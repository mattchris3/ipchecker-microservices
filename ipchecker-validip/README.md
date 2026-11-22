# validip

Validates each entry as an IPv4 or IPv6 address.

| | |
|---|---|
| Language | C# · ASP.NET Core 9 |
| Container port | 80 |
| Tests | xUnit: `cd tests && dotnet test` |

## API

```
GET /?items=8.8.8.8,nope
```

```
{"error":false,"results":["8.8.8.8 -> valid (IPv4)","nope -> invalid"],"total_valid_ips":1}
```

## Notes

IPv4 needs four decimal parts, each 0–255, with no leading zeros (`01.2.3.4` is ambiguous: some parsers read it as octal). IPv6 uses .NET's `IPAddress.TryParse`, so shorthand like `::1` and embedded IPv4 work.

Part of [IP Checker](../README.md). Run the whole system from the repository root with `docker compose up --build`.
