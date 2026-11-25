# revproxy

Reverse proxy and API gateway in front of every service.

| | |
|---|---|
| Language | Node.js 22 · Express + axios |
| Container port | 3000 |
| Tests | Jest + Supertest (against fake upstream services): `npm ci && npm test` |

## API

```
GET /<service>?items=…  ·  GET /discover/services  ·  GET /health/<service>  ·  POST /stateful/save  ·  GET /stateful/load/<id>
```

```
X-Upstream: http://validip:80/
X-Upstream-Time: 4
```

## Notes

Routes by `config.json`, which maps each service to one or more upstream URLs and is reloaded when it changes. Tries each upstream in turn (failover) and returns `503` with the failures if all are down. Adds `X-Upstream` and `X-Upstream-Time` to every proxied response.

Part of [IP Checker](../README.md). Run the whole system from the repository root with `docker compose up --build`.
