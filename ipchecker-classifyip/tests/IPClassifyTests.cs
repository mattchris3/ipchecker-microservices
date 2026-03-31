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
    }
}