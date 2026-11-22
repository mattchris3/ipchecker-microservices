namespace IPClassify
{
    public class IPClassify
    {
        // IPv4: exactly four decimal parts, each 0-255, no leading zeros ("01" is
        // ambiguous: some parsers read it as octal).
        public static bool IsIPv4(string ip)
        {
            if (string.IsNullOrWhiteSpace(ip)) return false;

            var parts = ip.Split('.');
            if (parts.Length != 4) return false;

            foreach (var part in parts)
            {
                if (part.Length == 0 || part.Length > 3) return false;
                if (!part.All(char.IsAsciiDigit)) return false;
                if (part.Length > 1 && part[0] == '0') return false;
                if (int.Parse(part) > 255) return false;
            }

            return true;
        }

        // IPv6: let .NET's parser handle the many valid shorthand forms ("::1",
        // "2001:db8::", embedded IPv4), but only for strings that look like IPv6.
        public static bool IsIPv6(string ip)
        {
            if (string.IsNullOrWhiteSpace(ip) || !ip.Contains(':')) return false;

            return System.Net.IPAddress.TryParse(ip, out var address)
                && address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6;
        }

        public static string Classify(string ip)
        {
            if (IsIPv4(ip))
                return "IPv4";
            else if (IsIPv6(ip))
                return "IPv6";
            else
                return "Invalid";
        }
    }
}