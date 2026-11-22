// Live architecture diagram. Nodes and links are laid out by hand on a fixed
// grid; packets are SVG <animateMotion> dots that travel along a link while a
// request is in flight (outbound) and back once it answers (return).
import { useEffect, useState } from 'react';
import type { Call } from '../lib/api';
import { LANGUAGES, SERVICES, type ServiceKey } from '../lib/services';

export type Health = 'healthy' | 'unhealthy' | 'unknown';

interface Props {
  pending: Set<ServiceKey>;
  last: Partial<Record<ServiceKey, Call>>;
  health: Partial<Record<ServiceKey, Health>>;
  /** Bumps on every run, so the browser → gateway → proxy packets replay. */
  pulse: number;
  monitorOk?: boolean;
}

const W = 460;
const NODE_W = 172;
const NODE_H = 54;
const COL = [24 + NODE_W / 2, W - 24 - NODE_W / 2]; // service column centres
const ROWS = [340, 410, 480, 550];
const BUS_Y = 280;

// Grid position for each service (left/right column, row).
const PLACE: Record<ServiceKey, [number, number]> = {
  validip: [0, 0],
  classifyip: [1, 0],
  infoip: [0, 1],
  badip: [1, 1],
  totalIPs: [0, 2],
  totalEmptyIPs: [1, 2],
  stateful: [0, 3],
};

const PROXY = { x: W / 2, y: 214 };
const GATEWAY = { x: W / 2, y: 126 };
const BROWSER = { x: W / 2, y: 40 };

/** Proxy → down to the bus → across to the column's outer rail → down → into the node. */
function linkPath(key: ServiceKey) {
  const [col, row] = PLACE[key];
  const y = ROWS[row];
  const rail = col === 0 ? 10 : W - 10;
  const edge = col === 0 ? COL[0] - NODE_W / 2 : COL[1] + NODE_W / 2;
  return `M ${PROXY.x} ${PROXY.y + NODE_H / 2} V ${BUS_Y} H ${rail} V ${y} H ${edge}`;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduced;
}

function Packet({ path, back = false, color, dur = 0.55, loop = false }: { path: string; back?: boolean; color: string; dur?: number; loop?: boolean }) {
  return (
    <circle r={4} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
      <animateMotion
        dur={`${dur}s`}
        path={path}
        repeatCount={loop ? 'indefinite' : '1'}
        fill="freeze"
        keyPoints={back ? '1;0' : '0;1'}
        keyTimes="0;1"
        calcMode="linear"
      />
    </circle>
  );
}

function Box({
  x,
  y,
  title,
  sub,
  stripe,
  status,
  right,
  active,
  w = NODE_W,
}: {
  x: number;
  y: number;
  title: string;
  sub: string;
  stripe?: string;
  status?: Health;
  right?: string;
  active?: boolean;
  w?: number;
}) {
  const dot = status === 'healthy' ? '#34d399' : status === 'unhealthy' ? '#f87171' : '#4b5563';
  return (
    <g transform={`translate(${x - w / 2} ${y - NODE_H / 2})`}>
      <rect
        width={w}
        height={NODE_H}
        rx={10}
        fill="#161c25"
        stroke={active ? '#22d3ee' : '#2a3442'}
        strokeWidth={active ? 1.5 : 1}
        style={{ transition: 'stroke 150ms' }}
      />
      {stripe && <rect x={0} y={10} width={3} height={NODE_H - 20} rx={1.5} fill={stripe} />}
      <text x={14} y={23} fontSize={13} fontWeight={600} fill="#e6edf3">
        {title}
      </text>
      <text x={14} y={41} fontSize={11} fill="#8592a0" fontFamily="'Geist Mono Variable', monospace">
        {sub}
      </text>
      {status && <circle cx={w - 14} cy={16} r={4} fill={dot} />}
      {right && (
        <text x={w - 12} y={42} fontSize={11} textAnchor="end" fill="#34d399" fontFamily="'Geist Mono Variable', monospace">
          {right}
        </text>
      )}
    </g>
  );
}

export default function Diagram({ pending, last, health, pulse, monitorOk }: Props) {
  const reduced = useReducedMotion();
  const anyPending = pending.size > 0;

  return (
    <svg viewBox={`0 0 ${W} 600`} className="h-auto w-full" role="img" aria-labelledby="diagram-title diagram-desc">
      <title id="diagram-title">Live architecture</title>
      <desc id="diagram-desc">
        The browser calls the Nginx gateway, which forwards API requests to the reverse proxy. The proxy routes each
        request to one of seven services: two in C#, two in Node.js, one in Python and two in PHP. A monitor checks
        every service through the proxy every five minutes.
      </desc>

      {/* Links */}
      <g stroke="#2a3442" strokeWidth={1.5} fill="none">
        <line x1={BROWSER.x} y1={BROWSER.y + 22} x2={GATEWAY.x} y2={GATEWAY.y - NODE_H / 2} />
        <line x1={GATEWAY.x} y1={GATEWAY.y + NODE_H / 2} x2={PROXY.x} y2={PROXY.y - NODE_H / 2} />
        {SERVICES.map((s) => (
          <path
            key={s.key}
            d={linkPath(s.key)}
            stroke={pending.has(s.key) ? '#22d3ee' : '#2a3442'}
            strokeOpacity={pending.has(s.key) ? 0.7 : 1}
            style={{ transition: 'stroke 150ms' }}
          />
        ))}
        {/* Monitor → proxy, every 5 minutes */}
        <path d={`M ${W - 70} ${PROXY.y} H ${PROXY.x + 70}`} strokeDasharray="4 4" />
      </g>

      {/* Browser */}
      <g transform={`translate(${BROWSER.x - 70} ${BROWSER.y - 22})`}>
        <rect width={140} height={44} rx={22} fill="#0b0f14" stroke="#2a3442" />
        <text x={70} y={27} textAnchor="middle" fontSize={13} fontWeight={600} fill="#e6edf3">
          Your browser
        </text>
      </g>

      <Box x={GATEWAY.x} y={GATEWAY.y} w={200} title="Gateway" sub="nginx · the only public port" stripe="#22d3ee" active={anyPending} />
      <Box x={PROXY.x} y={PROXY.y} w={140} title="Reverse proxy" sub="revproxy:3000" stripe={LANGUAGES.node.color} active={anyPending} />

      {/* Monitor */}
      <g transform={`translate(${W - 70 - 0} ${PROXY.y - 22})`}>
        <rect x={0} width={60} height={44} rx={10} fill="#11161d" stroke="#2a3442" strokeDasharray="3 3" />
        <text x={30} y={19} textAnchor="middle" fontSize={11} fontWeight={600} fill="#e6edf3">
          Monitor
        </text>
        <text x={30} y={34} textAnchor="middle" fontSize={10} fill={monitorOk === false ? '#f87171' : '#8592a0'}>
          every 5 min
        </text>
      </g>

      <text x={PROXY.x} y={BUS_Y - 8} textAnchor="middle" fontSize={10} fill="#8592a0" letterSpacing={1}>
        INTERNAL DOCKER NETWORK
      </text>

      {/* Services */}
      {SERVICES.map((s) => {
        const [col, row] = PLACE[s.key];
        const call = last[s.key];
        const right = pending.has(s.key)
          ? '…'
          : call
            ? call.ok
              ? `${call.upstreamMs ?? call.totalMs}ms`
              : 'failed'
            : undefined;
        return (
          <Box
            key={s.key}
            x={COL[col]}
            y={ROWS[row]}
            title={s.label}
            sub={`${s.host}:${s.port}`}
            stripe={LANGUAGES[s.language].color}
            status={health[s.key] ?? 'unknown'}
            right={right}
            active={pending.has(s.key)}
          />
        );
      })}

      {/* Stateful's volume */}
      <g transform={`translate(${COL[0] + NODE_W / 2 + 18} ${ROWS[3] - 16})`}>
        <ellipse cx={22} cy={4} rx={22} ry={5} fill="#11161d" stroke="#2a3442" />
        <path d="M0 4 V 26 A 22 5 0 0 0 44 26 V 4" fill="#11161d" stroke="#2a3442" />
        <text x={22} y={22} textAnchor="middle" fontSize={9} fill="#8592a0">
          volume
        </text>
      </g>

      {/* Packets */}
      {!reduced && (
        <g>
          {pulse > 0 && (
            <g key={`pulse-${pulse}`}>
              <Packet path={`M ${BROWSER.x} ${BROWSER.y + 22} V ${GATEWAY.y - NODE_H / 2}`} color="#22d3ee" dur={0.25} />
              <Packet path={`M ${GATEWAY.x} ${GATEWAY.y + NODE_H / 2} V ${PROXY.y - NODE_H / 2}`} color="#22d3ee" dur={0.25} />
            </g>
          )}
          {SERVICES.map((s) =>
            pending.has(s.key) ? (
              <Packet key={`out-${s.key}`} path={linkPath(s.key)} color="#22d3ee" loop />
            ) : last[s.key] ? (
              <Packet
                key={`back-${s.key}-${last[s.key]!.id}`}
                path={linkPath(s.key)}
                back
                color={last[s.key]!.ok ? '#34d399' : '#f87171'}
              />
            ) : null,
          )}
        </g>
      )}

      {/* Legend */}
      <g transform="translate(16 590)">
        {Object.values(LANGUAGES).map((l, i) => (
          <g key={l.label} transform={`translate(${i * 112} 0)`}>
            <rect y={-8} width={8} height={8} rx={2} fill={l.color} />
            <text x={13} y={0} fontSize={10} fill="#8592a0">
              {l.label.split(' · ')[0]}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

