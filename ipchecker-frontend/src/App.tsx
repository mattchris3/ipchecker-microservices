import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Diagram, { type Health } from './components/Diagram';
import { MonitorCard, Panel, RequestLog, ResultsTable, SaveLoad, SummaryCards } from './components/Panels';
import { checkService, discover, health as checkHealth, loadList, monitorLatest, saveList, type Call, type MonitorRun } from './lib/api';
import { mergeRows, SAMPLES, summarise, toItems, toQuery, type ServiceData } from './lib/ips';
import { CHECKS, SERVICES, type ServiceKey } from './lib/services';

const REPO = 'https://github.com/mattchris3/ipchecker-microservices';

const STEPS = [
  ['Gateway', 'Nginx serves this page and forwards /api to the proxy. It is the only published port.'],
  ['Reverse proxy', 'Looks the service up in its config, tries each instance until one answers, and reports which one did.'],
  ['Service', 'Each check is its own container in its own language, reachable only on the internal network.'],
  ['Back to you', 'Six answers arrive in parallel and are merged into one row per address.'],
];

export default function App() {
  const [text, setText] = useState(SAMPLES[0].items.join('\n'));
  const [pending, setPending] = useState<Set<ServiceKey>>(new Set());
  const [last, setLast] = useState<Partial<Record<ServiceKey, Call>>>({});
  const [data, setData] = useState<ServiceData>({});
  const [ranItems, setRanItems] = useState<string[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [health, setHealth] = useState<Partial<Record<ServiceKey, Health>>>({});
  const [discovered, setDiscovered] = useState<number | null>(null);
  const [monitor, setMonitor] = useState<MonitorRun | null>(null);
  const [monitorDown, setMonitorDown] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [savedId, setSavedId] = useState<string>();
  const [storeBusy, setStoreBusy] = useState(false);
  const [storeError, setStoreError] = useState<string>();
  const [inputError, setInputError] = useState<string>();

  const log = useCallback((c: Call) => setCalls((all) => [c, ...all].slice(0, 60)), []);
  const items = useMemo(() => toItems(text), [text]);

  const refreshHealth = useCallback(async () => {
    const d = await discover();
    log(d);
    setDiscovered(d.ok ? (d.data?.totalServices ?? null) : null);
    await Promise.all(
      SERVICES.map(async (s) => {
        const h = await checkHealth(s.key);
        const ok = h.ok && h.data?.endpoints.some((e) => e.status === 'healthy');
        setHealth((prev) => ({ ...prev, [s.key]: ok ? 'healthy' : 'unhealthy' }));
      }),
    );
  }, [log]);

  const refreshMonitor = useCallback(async () => {
    const m = await monitorLatest();
    setMonitorDown(!m.ok);
    if (m.ok && m.data && 'summary' in m.data) setMonitor(m.data);
  }, []);

  useEffect(() => {
    refreshHealth();
    refreshMonitor();
    const t = setInterval(refreshMonitor, 60_000);
    return () => clearInterval(t);
  }, [refreshHealth, refreshMonitor]);

  async function run(list = items) {
    if (list.length === 0) {
      setInputError('Paste at least one address, or pick a sample.');
      return;
    }
    setInputError(undefined);
    const query = toQuery(list);
    setRanItems(list);
    setData({});
    setPulse((p) => p + 1);
    setPending(new Set(CHECKS.map((c) => c.key)));

    await Promise.all(
      CHECKS.map(async (c) => {
        const result = await checkService(c.key, query);
        log(result);
        setLast((prev) => ({ ...prev, [c.key]: result }));
        if (result.ok) setData((prev) => ({ ...prev, [c.key]: result.data }));
        setHealth((prev) => ({ ...prev, [c.key]: result.ok ? 'healthy' : 'unhealthy' }));
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(c.key);
          return next;
        });
      }),
    );
  }

  async function save() {
    setStoreBusy(true);
    setStoreError(undefined);
    const r = await saveList(toQuery(items));
    log(r);
    setLast((prev) => ({ ...prev, stateful: r }));
    if (r.ok && r.data?.id) setSavedId(r.data.id);
    else setStoreError(r.error ?? "Couldn't save the list.");
    setStoreBusy(false);
  }

  async function load(id: string) {
    setStoreBusy(true);
    setStoreError(undefined);
    const r = await loadList(id);
    log(r);
    setLast((prev) => ({ ...prev, stateful: r }));
    setStoreBusy(false);
    if (r.ok && r.data?.items !== undefined) {
      const list = toItems(r.data.items);
      setText(list.join('\n'));
      run(list);
    } else {
      setStoreError(r.status === 404 ? 'No saved list has that ID.' : (r.error ?? "Couldn't load the list."));
    }
  }

  const rows = useMemo(() => mergeRows(ranItems, data), [ranItems, data]);
  const summary = summarise(data);
  const running = pending.size > 0;
  const healthy = Object.values(health).filter((h) => h === 'healthy').length;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <img src="/favicon.svg" alt="" className="size-7" />
          <span className="font-semibold tracking-tight">IP Checker</span>
          <span className="hidden text-sm text-fg-muted sm:inline">7 microservices · 4 languages · 1 reverse proxy</span>
          <a href={REPO} className="ml-auto text-sm text-fg-soft hover:text-fg">
            Source on GitHub
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="min-w-0 space-y-5">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Check a list of IP addresses</h1>
            <p className="mt-2 max-w-2xl text-fg-soft">
              Each question is answered by a different microservice in a different language. The diagram shows every
              request travelling through the gateway and reverse proxy, and how long each service took.
            </p>
          </motion.div>

          <Panel
            title="Addresses"
            aside={<span className="num text-xs text-fg-muted">{items.length} entries</span>}
          >
            <div className="space-y-3 p-4">
              <textarea
                aria-label="IP addresses, one per line or comma-separated"
                className="field num min-h-36 resize-y py-2.5 leading-relaxed"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setInputError(undefined);
                }}
                placeholder={'8.8.8.8\n192.168.1.1\n2001:db8::1'}
                spellCheck={false}
              />
              {inputError && <p className="text-sm text-bad">{inputError}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-primary" onClick={() => run()} disabled={running}>
                  {running ? `Waiting on ${pending.size}…` : 'Run all checks'}
                </button>
                <span className="text-xs text-fg-muted">Samples:</span>
                {SAMPLES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="h-8 rounded-md border border-line px-2.5 text-xs text-fg-soft hover:border-fg-muted hover:text-fg"
                    onClick={() => setText(s.items.join('\n'))}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Results" aside={ranItems.length > 0 && <span className="text-xs text-fg-muted">from 6 services</span>}>
            {ranItems.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-fg-muted">
                Press <span className="text-fg">Run all checks</span> to send the list to every service at once.
              </p>
            ) : (
              <div className="space-y-4 p-4">
                <SummaryCards summary={summary} />
                {rows.length > 0 && (
                  <div className="-mx-4 border-t border-line">
                    <ResultsTable rows={rows} />
                  </div>
                )}
              </div>
            )}
          </Panel>

          <div className="grid gap-5 md:grid-cols-2">
            <Panel title="Save or load a list">
              <SaveLoad canSave={items.length > 0} onSave={save} onLoad={load} savedId={savedId} busy={storeBusy} error={storeError} />
            </Panel>
            <Panel title="Request log" aside={<span className="text-xs text-fg-muted">newest first</span>}>
              <RequestLog calls={calls} />
            </Panel>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Panel
            title="Live architecture"
            aside={
              <button type="button" onClick={refreshHealth} className="text-xs text-fg-muted hover:text-fg" title="Run the proxy's health checks again">
                {discovered === null ? 'Proxy unreachable' : `${healthy}/${discovered} healthy`} · recheck
              </button>
            }
          >
            <div className="p-3">
              <Diagram pending={pending} last={last} health={health} pulse={pulse} monitorOk={monitorDown ? false : undefined} />
            </div>
            <ol className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
              {STEPS.map(([title, body], i) => (
                <li key={title} className="bg-panel p-3">
                  <p className="text-xs font-medium">
                    <span className="num mr-1.5 text-accent">{i + 1}</span>
                    {title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">{body}</p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Monitor" aside={<span className="text-xs text-fg-muted">automated checks</span>}>
            <MonitorCard run={monitor} />
          </Panel>
        </aside>
      </main>
    </div>
  );
}
