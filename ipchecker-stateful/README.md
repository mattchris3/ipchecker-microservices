# stateful

Saves a list and returns an ID; loads it back later.

| | |
|---|---|
| Language | Node.js 22 · Express |
| Container port | 3000 |
| Tests | Jest + Supertest: `npm ci && npm test` |

## API

```
POST /save {"items":"8.8.8.8,1.1.1.1"}  ·  GET /load/<id>  ·  GET /health
```

```
{"success":true,"id":"123c1558-…"}
```

## Notes

The only stateful service. Lists are stored in `data/stored-ips.json`, which Docker Compose mounts on the `saved-lists` named volume so they survive restarts.

Part of [IP Checker](../README.md). Run the whole system from the repository root with `docker compose up --build`.
