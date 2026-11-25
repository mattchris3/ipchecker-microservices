using Xunit;
using IPValid.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace IPValid.Tests
{
    public class IPValidTests
    {
        private readonly IPValidControllers _controller;

        public IPValidTests()
        {
            _controller = new IPValidControllers();
        }

        [Fact]
        public void ValidateIPs()
        {
            string items = "172.217.23.206,,2a00:1450:400e:811::200e,172.217.23.206.100";

            var result = _controller.ValidateIPs(items) as OkObjectResult;
            var value = result?.Value;
            var totalValidIps = value?.GetType().GetProperty("total_valid_ips")?.GetValue(value);
            var resultsProperty = value?.GetType().GetProperty("results")?.GetValue(value);
            var results = resultsProperty as IEnumerable<string>;

            Assert.NotNull(result);
            Assert.Equal(2, totalValidIps);
            Assert.NotNull(results);
            
            var resultsList = results.ToList();
            Assert.Equal(4, resultsList.Count);
            Assert.Contains(resultsList, r => r.Contains("172.217.23.206 -> valid (IPv4)"));
            Assert.Contains(resultsList, r => r.Contains(" -> invalid"));
            Assert.Contains(resultsList, r => r.Contains("2a00:1450:400e:811::200e -> valid (IPv6)"));
            Assert.Contains(resultsList, r => r.Contains("172.217.23.206.100 -> invalid"));          
        }

        [Fact]
        public void ValidateIPs_WithEmptyString()
        {
            string items = "";

            var result = _controller.ValidateIPs(items) as OkObjectResult;
            var value = result?.Value;
            var totalValidIps = value?.GetType().GetProperty("total_valid_ips")?.GetValue(value);

            Assert.NotNull(result);
            Assert.Equal(0, totalValidIps);
        }

        [Theory]
        [InlineData("0.0.0.0")]
        [InlineData("192.168.1.1")]
        [InlineData("255.255.255.255")]
        public void AcceptsValidIPv4(string ip) => Assert.True(global::IPValid.IPValid.IsIPv4(ip));

        [Theory]
        [InlineData("100.200.300.400")] // parts above 255
        [InlineData("256.1.1.1")]
        [InlineData("1.2.3")]
        [InlineData("1.2.3.4.5")]
        [InlineData("01.2.3.4")]        // leading zero
        [InlineData("a.b.c.d")]
        [InlineData("1.2.3.-4")]
        public void RejectsInvalidIPv4(string ip) => Assert.False(global::IPValid.IPValid.IsIPv4(ip));

        [Theory]
        [InlineData("::1")]
        [InlineData("2001:db8::1")]
        [InlineData("2a00:1450:400e:811::200e")]
        [InlineData("::ffff:192.0.2.1")]
        public void AcceptsValidIPv6(string ip) => Assert.True(global::IPValid.IPValid.IsIPv6(ip));

        [Theory]
        [InlineData("2001:db8::g")]
        [InlineData("1:2:3:4:5:6:7:8:9")]
        [InlineData("::1::2")]
        [InlineData("abc")]
        public void RejectsInvalidIPv6(string ip) => Assert.False(global::IPValid.IPValid.IsIPv6(ip));
    }
}