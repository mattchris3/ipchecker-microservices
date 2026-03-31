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
    }
}