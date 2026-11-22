# classifyip

Says whether each entry is IPv4 or IPv6.

| | |
|---|---|
| Language | C# · ASP.NET Core 9 |
| Container port | 80 |
| Tests | xUnit: `cd tests && dotnet test` |

## API

```
GET /?items=8.8.8.8,::1
```

```
{"error":false,"results":["8.8.8.8 -> IPv4","::1 -> IPv6"],"ipv4":1,"ipv6":1}
```

## Notes

Uses the same validation rules as `validip`, so an invalid entry is never counted as either version.

Part of [IP Checker](../README.md). Run the whole system from the repository root with `docker compose up --build`.
