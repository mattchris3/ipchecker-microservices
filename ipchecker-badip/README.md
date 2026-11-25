# badip

Bogon filter: flags addresses that should never appear as a source on the public internet.

| | |
|---|---|
| Language | Node.js 22 · Express |
| Container port | 3000 |
| Tests | Jest: `npm ci && npm test` |

## API

```
GET /?items=8.8.8.8,10.0.0.1
```

```
{"error":false,"good_ips":1,"bad_ips":1,"invalid_ips":0,"details":[{"ip":"10.0.0.1","status":"bogon","reason":"Private network (RFC 1918)","range":"10.0.0.0/8"},…]}
```

## Notes

Checks the IANA special-purpose ranges for IPv4 and IPv6 with Node's built-in `net.BlockList`, and reports the RFC behind each match. Traffic claiming to come from a bogon is spoofed or misrouted, which is why firewalls drop it.

Part of [IP Checker](../README.md). Run the whole system from the repository root with `docker compose up --build`.
