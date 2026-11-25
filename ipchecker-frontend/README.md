# frontend

The UI and the system's single entry point.

| | |
|---|---|
| Stack | React 19, TypeScript, Vite, Tailwind CSS, Motion; served by Nginx |
| Container port | 80 (the only port published to the host) |
| Tests | Vitest: `npm ci && npm test` |

- `nginx.conf` serves the built UI and forwards `/api/*` to the reverse proxy and `/monitor/*` to the
  monitor on the internal Docker network.
- `src/components/Diagram.tsx` draws the live architecture: health from the proxy's health checks,
  in-flight requests as moving packets, and each service's response time from `X-Upstream-Time`.
- `src/lib/ips.ts` turns pasted text into the services' input and merges the six answers into one row
  per address (unit-tested).

Develop against the running containers with `npm run dev`; Vite forwards `/api` and `/monitor` to the
gateway on port 8080.

Part of [IP Checker](../README.md).
