using Xunit;
using IPClassify.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace IPClassify.Tests
{
    public class IPClassifyTests
    {
        private readonly IPClassifyControllers _controller;

        public IPClassifyTests()
        {
            _controller = new IPClassifyControllers();
        }

        [Fact]
        public void ClassifyIPs()
        {
            string items = "172.217.23.206,2a00:1450:400e:811::200e,1.2.3.4";

            var result = _controller.ClassifyIPs(items) as OkObjectResult;
            var value = result?.Value;
            var ipv4 = value?.GetType().GetProperty("ipv4")?.GetValue(value);
            var ipv6 = value?.GetType().GetProperty("ipv6")?.GetValue(value);
            var resultsProperty = value?.GetType().GetProperty("results")?.GetValue(value);
            var results = resultsProperty as IEnumerable<string>;

            Assert.NotNull(result);
            Assert.Equal(2, ipv4);
            Assert.Equal(1, ipv6);
            Assert.NotNull(results);
            
            var resultsList = results.ToList();
            Assert.Equal(3, resultsList.Count);
            Assert.Contains(resultsList, r => r.Contains("172.217.23.206 -> IPv4"));
            Assert.Contains(resultsList, r => r.Contains("2a00:1450:400e:811::200e -> IPv6"));
            Assert.Contains(resultsList, r => r.Contains("1.2.3.4 -> IPv4"));
        }

        [Fact]
        public void ClassifyIPs_EmptyStrings()
        {
            string items = "";

            var result = _controller.ClassifyIPs(items) as OkObjectResult;
            var value = result?.Value;
            var ipv4 = value?.GetType().GetProperty("ipv4")?.GetValue(value);
            var ipv6 = value?.GetType().GetProperty("ipv6")?.GetValue(value);

            Assert.NotNull(result);
            Assert.Equal(0, ipv4);
            Assert.Equal(0, ipv6);
        }

        [Theory]
        [InlineData("0.0.0.0")]
        [InlineData("192.168.1.1")]
        [InlineData("255.255.255.255")]
        public void AcceptsValidIPv4(string ip) => Assert.True(global::IPClassify.IPClassify.IsIPv4(ip));

        [Theory]
        [InlineData("100.200.300.400")] // parts above 255
        [InlineData("256.1.1.1")]
        [InlineData("1.2.3")]
        [InlineData("1.2.3.4.5")]
        [InlineData("01.2.3.4")]        // leading zero
        [InlineData("a.b.c.d")]
        [InlineData("1.2.3.-4")]
        public void RejectsInvalidIPv4(string ip) => Assert.False(global::IPClassify.IPClassify.IsIPv4(ip));

        [Theory]
        [InlineData("::1")]
        [InlineData("2001:db8::1")]
        [InlineData("2a00:1450:400e:811::200e")]
        [InlineData("::ffff:192.0.2.1")]
        public void AcceptsValidIPv6(string ip) => Assert.True(global::IPClassify.IPClassify.IsIPv6(ip));

        [Theory]
        [InlineData("2001:db8::g")]
        [InlineData("1:2:3:4:5:6:7:8:9")]
        [InlineData("::1::2")]
        [InlineData("abc")]
        public void RejectsInvalidIPv6(string ip) => Assert.False(global::IPClassify.IPClassify.IsIPv6(ip));
    }
}