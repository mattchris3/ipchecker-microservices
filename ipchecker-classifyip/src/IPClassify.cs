namespace IPClassify
{
    public class IPClassify
    {
        public static bool IsIPv4(string ip)
        {
            if (string.IsNullOrWhiteSpace(ip)) return false;

            var parts = ip.Split('.');

            if (parts.Length != 4) return false;

            foreach(var num in parts)
            {
                if (num.Length == 0 || num.Length > 3) return false;
            }

            return true;
        }

        public static bool IsIPv6(string ip)
        {
            if (string.IsNullOrEmpty(ip)) return false;

            var parts = ip.Split(':');
            int partCount = parts.Length - 1;

            if (partCount < 2 || partCount > 8) return false;

            return true;
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