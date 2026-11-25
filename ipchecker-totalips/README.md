# totalips

Counts the entries in a list.

| | |
|---|---|
| Language | PHP 8.3 · Apache |
| Container port | 80 |
| Tests | plain PHP: `php src/tests/tests.php` |

## API

```
GET /?items=8.8.8.8,,1.1.1.1
```

```
{"error":false,"items":"8.8.8.8,,1.1.1.1","total_ips":3}
```

## Notes

Blank entries count as entries; an empty input has none.

Part of [IP Checker](../README.md). Run the whole system from the repository root with `docker compose up --build`.
