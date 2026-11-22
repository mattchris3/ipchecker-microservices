# monitor

Calls every service through the reverse proxy on a schedule and keeps the results.

| | |
|---|---|
| Language | Node.js 22 · Express + node-cron |
| Container port | 4000 |
| Tests | Jest + Supertest: `npm ci && npm test` |

## API

```
GET /results/latest  ·  GET /trigger  ·  GET /health
```

```
{"summary":{"total":6,"successful":6,"failed":0,"avgResponseTime":"9ms"},…}
```

## Notes

Runs once about 15 seconds after start-up, then every 5 minutes. It tests the real path (through the proxy) rather than each service checking itself. The UI shows the latest run.

Part of [IP Checker](../README.md). Run the whole system from the repository root with `docker compose up --build`.
