// Calls go to /api (the reverse proxy) and /monitor, both through the Nginx
// gateway, so the browser only ever talks to one origin.
import type { ServiceKey } from './services';

export interface Call<T = unknown> {
  id: number;
  service: ServiceKey | 'discover' | 'health' | 'monitor';
  method: 'GET' | 'POST';
  path: string;
  ok: boolean;
  status: number;
  /** Browser → gateway → proxy → service and back. */
  totalMs: number;
  /** Proxy → service, from the proxy's X-Upstream-Time header. */
  upstreamMs?: number;
  /** Which instance answered, from X-Upstream (e.g. http://validip:80/). */
  upstream?: string;
  data?: T;
  error?: string;
  at: number;
}

let nextId = 1;

async function call<T>(service: Call['service'], method: 'GET' | 'POST', path: string, body?: unknown): Promise<Call<T>> {
  const started = performance.now();
  const base = { id: nextId++, service, method, path, at: Date.now() };
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => undefined)) as T | undefined;
    const upstreamMs = res.headers.get('x-upstream-time');
    return {
      ...base,
      ok: res.ok,
      status: res.status,
      totalMs: Math.round(performance.now() - started),
      upstreamMs: upstreamMs ? Number(upstreamMs) : undefined,
      upstream: res.headers.get('x-upstream') ?? undefined,
      data,
      error: res.ok ? undefined : ((data as { message?: string } | undefined)?.message ?? `HTTP ${res.status}`),
    };
  } catch (e) {
    return {
      ...base,
      ok: false,
      status: 0,
      totalMs: Math.round(performance.now() - started),
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export const checkService = (key: ServiceKey, query: string) =>
  call(key, 'GET', `/api/${key}?items=${encodeURIComponent(query)}`);

export const saveList = (query: string) =>
  call<{ success: boolean; id: string }>('stateful', 'POST', '/api/stateful/save', { items: query });

export const loadList = (id: string) =>
  call<{ success: boolean; items: string; timestamp: string }>('stateful', 'GET', `/api/stateful/load/${encodeURIComponent(id)}`);

export const discover = () =>
  call<{ totalServices: number; services: { name: string; endpoints: string[] }[] }>('discover', 'GET', '/api/discover/services');

export const health = (key: ServiceKey) =>
  call<{ endpoints: { url: string; status: 'healthy' | 'unhealthy'; responseTime?: string }[] }>(
    'health',
    'GET',
    `/api/health/${key}`,
  );

export interface MonitorRun {
  id: number;
  timestamp: string;
  summary: { total: number; successful: number; failed: number; avgResponseTime: string };
  results: { service: string; status: 'success' | 'failed'; responseTime: string }[];
}

export const monitorLatest = () => call<MonitorRun | { message: string }>('monitor', 'GET', '/monitor/results/latest');
