// What runs where. Used by the diagram, the request log and the README's story.

export type Language = 'csharp' | 'node' | 'python' | 'php';

export const LANGUAGES: Record<Language, { label: string; color: string }> = {
  csharp: { label: 'C# · ASP.NET Core', color: '#a78bfa' },
  node: { label: 'Node.js · Express', color: '#34d399' },
  python: { label: 'Python · Flask', color: '#60a5fa' },
  php: { label: 'PHP · Apache', color: '#f472b6' },
};

export type ServiceKey = 'totalIPs' | 'totalEmptyIPs' | 'validip' | 'classifyip' | 'infoip' | 'badip' | 'stateful';

export interface ServiceInfo {
  key: ServiceKey;
  /** Container name on the Docker network. */
  host: string;
  port: number;
  label: string;
  does: string;
  language: Language;
}

export const SERVICES: ServiceInfo[] = [
  { key: 'validip', host: 'validip', port: 80, label: 'Validate', does: 'Is each entry a real IPv4 or IPv6 address?', language: 'csharp' },
  { key: 'classifyip', host: 'classifyip', port: 80, label: 'Classify', does: 'IPv4 or IPv6?', language: 'csharp' },
  { key: 'infoip', host: 'infoip', port: 5001, label: 'Info', does: 'Private, public, loopback… and known owners', language: 'python' },
  { key: 'badip', host: 'badip', port: 3000, label: 'Bogon filter', does: 'Flags addresses that should never be a public source', language: 'node' },
  { key: 'totalIPs', host: 'totalips', port: 80, label: 'Count', does: 'How many entries?', language: 'php' },
  { key: 'totalEmptyIPs', host: 'totalemptyips', port: 80, label: 'Count empty', does: 'How many entries are blank?', language: 'php' },
  { key: 'stateful', host: 'stateful', port: 3000, label: 'Saved lists', does: 'Stores a list and returns an ID (Docker volume)', language: 'node' },
];

/** The six services that analyse a list; "stateful" is called by Save / Load. */
export const CHECKS = SERVICES.filter((s) => s.key !== 'stateful');

export const byKey = Object.fromEntries(SERVICES.map((s) => [s.key, s])) as Record<ServiceKey, ServiceInfo>;
