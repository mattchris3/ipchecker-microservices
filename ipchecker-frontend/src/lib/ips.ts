// Pure helpers: turning what people paste into the services' input, and the
// six services' answers into one row per address. Unit-tested.

export const SAMPLES: { label: string; items: string[] }[] = [
  {
    label: 'Mixed bag',
    items: ['8.8.8.8', '192.168.1.10', '2001:4860:4860::8888', '', '100.200.300.400', '1.1.1.1', '127.0.0.1', 'not-an-ip'],
  },
  { label: 'Public DNS', items: ['8.8.8.8', '1.1.1.1', '9.9.9.9', '208.67.222.222', '2606:4700:4700::1111'] },
  { label: 'Bogons', items: ['10.0.0.1', '172.16.5.4', '100.64.0.1', '169.254.1.1', '203.0.113.9', 'fe80::1', '2001:db8::1'] },
];

/** Accepts commas or new lines. Keeps blank entries, because "count empty" counts them. */
export function toItems(text: string): string[] {
  if (text.trim() === '') return [];
  return text.split(/[\n,]/).map((s) => s.trim());
}

/** The services take one comma-separated query parameter. */
export const toQuery = (items: string[]) => items.join(',');

export type Reputation = { status: 'ok' | 'bogon' | 'invalid'; reason?: string };

export interface Row {
  ip: string;
  valid?: boolean;
  version?: 'IPv4' | 'IPv6';
  scope?: string;
  owner?: string | null;
  country?: string | null;
  reputation?: Reputation;
}

export interface ServiceData {
  validip?: { results?: string[]; total_valid_ips?: number };
  classifyip?: { results?: string[]; ipv4?: number; ipv6?: number };
  infoip?: { details?: { ip: string; scope: string; owner: string | null; country: string | null }[] };
  badip?: { details?: { ip: string; status: Reputation['status']; reason?: string }[]; bad_ips?: number };
  totalIPs?: { total_ips?: number };
  totalEmptyIPs?: { total_empty_ips?: number };
}

/** "1.2.3.4 -> valid (IPv4)" → ["1.2.3.4", "valid (IPv4)"] */
function splitResult(line: string): [string, string] {
  const at = line.lastIndexOf(' -> ');
  return at === -1 ? [line.trim(), ''] : [line.slice(0, at).trim(), line.slice(at + 4).trim()];
}

/** One row per non-blank entry, in the order they were entered (duplicates kept once). */
export function mergeRows(items: string[], data: ServiceData): Row[] {
  const rows = new Map<string, Row>();
  for (const ip of items) if (ip && !rows.has(ip)) rows.set(ip, { ip });

  for (const line of data.validip?.results ?? []) {
    const [ip, verdict] = splitResult(line);
    const row = rows.get(ip);
    if (row) row.valid = verdict.startsWith('valid');
  }
  for (const line of data.classifyip?.results ?? []) {
    const [ip, kind] = splitResult(line);
    const row = rows.get(ip);
    if (row && (kind === 'IPv4' || kind === 'IPv6')) row.version = kind;
  }
  for (const d of data.infoip?.details ?? []) {
    const row = rows.get(d.ip);
    if (row) Object.assign(row, { scope: d.scope, owner: d.owner, country: d.country });
  }
  for (const d of data.badip?.details ?? []) {
    const row = rows.get(d.ip);
    if (row) row.reputation = { status: d.status, reason: d.reason };
  }
  return [...rows.values()];
}

export interface Summary {
  total?: number;
  empty?: number;
  valid?: number;
  ipv4?: number;
  ipv6?: number;
  bogons?: number;
}

export function summarise(data: ServiceData): Summary {
  return {
    total: data.totalIPs?.total_ips,
    empty: data.totalEmptyIPs?.total_empty_ips,
    valid: data.validip?.total_valid_ips,
    ipv4: data.classifyip?.ipv4,
    ipv6: data.classifyip?.ipv6,
    bogons: data.badip?.bad_ips,
  };
}
