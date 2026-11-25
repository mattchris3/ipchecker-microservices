import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { Call, MonitorRun } from '../lib/api';
import type { Row, Summary } from '../lib/ips';
import { byKey, LANGUAGES, type ServiceKey } from '../lib/services';

export function Panel({ title, aside, children, className = '' }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function SummaryCards({ summary }: { summary: Summary }) {
  const cards: [string, number | undefined, string][] = [
    ['Entries', summary.total, 'Count · PHP'],
    ['Empty', summary.empty, 'Count empty · PHP'],
    ['Valid', summary.valid, 'Validate · C#'],
    ['IPv4 / IPv6', undefined, 'Classify · C#'],
    ['Bogons', summary.bogons, 'Bogon filter · Node'],
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {cards.map(([label, value, from]) => (
        <div key={label} className="rounded-lg border border-line bg-panel-2 px-3 py-2.5">
          <dt className="text-xs text-fg-muted">{label}</dt>
          <dd className="num mt-0.5 text-xl font-medium">
            {label === 'IPv4 / IPv6'
              ? summary.ipv4 === undefined
                ? '—'
                : `${summary.ipv4} / ${summary.ipv6}`
              : (value ?? '—')}
          </dd>
          <dd className="mt-0.5 truncate text-[11px] text-fg-muted">{from}</dd>
        </div>
      ))}
    </dl>
  );
}

const REPUTATION = {
  ok: { text: 'Routable', className: 'bg-emerald-400/10 text-ok' },
  bogon: { text: 'Bogon', className: 'bg-red-400/10 text-bad' },
  invalid: { text: 'Invalid', className: 'bg-zinc-500/15 text-fg-muted' },
};

export function ResultsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-fg-muted">
            <th className="py-2.5 pr-3 pl-4 font-medium">Address</th>
            <th className="px-3 font-medium">Valid</th>
            <th className="px-3 font-medium">Version</th>
            <th className="px-3 font-medium">What it is</th>
            <th className="pr-4 pl-3 font-medium">Public source?</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {rows.map((r, i) => (
            <motion.tr
              key={r.ip}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <td className="num py-2.5 pr-3 pl-4 break-all">{r.ip}</td>
              <td className="px-3">
                {r.valid === undefined ? '—' : r.valid ? <span className="text-ok">✓</span> : <span className="text-bad">✗</span>}
              </td>
              <td className="num px-3 text-fg-soft">{r.version ?? '—'}</td>
              <td className="px-3">
                <span className="text-fg">{r.scope ?? '—'}</span>
                {r.owner && <span className="block text-xs text-fg-muted">{r.owner}{r.country ? ` · ${r.country}` : ''}</span>}
              </td>
              <td className="pr-4 pl-3">
                {r.reputation ? (
                  <>
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${REPUTATION[r.reputation.status].className}`}>
                      {REPUTATION[r.reputation.status].text}
                    </span>
                    {r.reputation.reason && <span className="block text-xs text-fg-muted">{r.reputation.reason}</span>}
                  </>
                ) : (
                  '—'
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RequestLog({ calls }: { calls: Call[] }) {
  if (calls.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-fg-muted">Run a check and every request appears here.</p>;
  }
  return (
    <ol className="max-h-72 divide-y divide-line-soft overflow-y-auto">
      {calls.map((c) => {
        const info = c.service in byKey ? byKey[c.service as ServiceKey] : undefined;
        return (
          <li key={c.id} className="flex items-center gap-3 px-4 py-2 text-xs">
            <span className={`num w-10 shrink-0 font-medium ${c.ok ? 'text-ok' : 'text-bad'}`}>{c.status || 'ERR'}</span>
            <span className="num w-11 shrink-0 text-fg-muted">{c.method}</span>
            <span className="min-w-0 flex-1">
              <span className="num block truncate text-fg-soft">{c.path.split('?')[0]}</span>
              <span className="num block truncate text-fg-muted">
                {c.upstream ? `→ ${c.upstream.replace(/^https?:\/\//, '').replace(/\/$/, '')}` : c.error ? c.error : '→ gateway'}
                {info && <span style={{ color: LANGUAGES[info.language].color }}> · {LANGUAGES[info.language].label.split(' · ')[0]}</span>}
              </span>
            </span>
            <span className="num shrink-0 text-right text-fg-soft">
              {c.totalMs}ms
              {c.upstreamMs !== undefined && <span className="block text-fg-muted">svc {c.upstreamMs}ms</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function SaveLoad({
  canSave,
  onSave,
  onLoad,
  savedId,
  busy,
  error,
}: {
  canSave: boolean;
  onSave: () => void;
  onLoad: (id: string) => void;
  savedId?: string;
  busy: boolean;
  error?: string;
}) {
  const [id, setId] = useState('');
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-ghost" disabled={!canSave || busy} onClick={onSave}>
          Save this list
        </button>
        {savedId && (
          <button
            type="button"
            className="num inline-flex h-9 min-w-0 items-center gap-2 rounded-lg bg-panel-2 px-3 text-xs text-fg-soft hover:text-fg"
            onClick={() => navigator.clipboard?.writeText(savedId).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
            title="Copy ID"
          >
            <span className="truncate">{savedId}</span>
            <span className="text-accent">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (id.trim()) onLoad(id.trim());
        }}
      >
        <input className="field num h-9" placeholder="Paste a saved ID" aria-label="Saved list ID" value={id} onChange={(e) => setId(e.target.value)} />
        <button type="submit" className="btn btn-ghost shrink-0" disabled={!id.trim() || busy}>
          Load
        </button>
      </form>
      {error && <p className="text-xs text-bad">{error}</p>}
      <p className="text-xs text-fg-muted">Saved by the stateful service onto a Docker volume, so lists survive restarts.</p>
    </div>
  );
}

export function MonitorCard({ run }: { run?: MonitorRun | null }) {
  if (!run) {
    return <p className="px-4 py-4 text-sm text-fg-muted">The monitor runs its first check about 15 seconds after start-up.</p>;
  }
  const when = new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="p-4">
      <p className="text-sm">
        <span className={run.summary.failed === 0 ? 'text-ok' : 'text-warn'}>
          {run.summary.successful} of {run.summary.total} services passed
        </span>
        <span className="text-fg-muted"> · avg {run.summary.avgResponseTime} · at {when}</span>
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {run.results.map((r) => (
          <li
            key={r.service}
            className={`num rounded px-1.5 py-0.5 text-[11px] ${r.status === 'success' ? 'bg-emerald-400/10 text-ok' : 'bg-red-400/10 text-bad'}`}
          >
            {r.service} {r.responseTime}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-fg-muted">A separate container that calls every service through the proxy on a schedule.</p>
    </div>
  );
}
