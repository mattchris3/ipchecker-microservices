# infoip

Describes what kind of address each entry is.

| | |
|---|---|
| Language | Python 3.12 · Flask, served by gunicorn |
| Container port | 5001 |
| Tests | pytest: `pip install -r requirements-dev.txt && pytest tests` |

## API

```
GET /?items=8.8.8.8,192.168.1.1
```

```
{"error":false,"countries":{…},"details":[{"ip":"8.8.8.8","scope":"Public","owner":"Google Public DNS","country":"United States"},…]}
```

## Notes

Uses Python's standard `ipaddress` module: private, loopback, link-local, carrier-grade NAT, documentation, multicast, reserved or public. A few well-known public resolvers have real owners. Other public addresses are reported as public rather than given a guessed country, because accurate locations need a licensed GeoIP database. `countries` is kept for older clients; `details` is the structured answer.

Part of [IP Checker](../README.md). Run the whole system from the repository root with `docker compose up --build`.
