using Microsoft.AspNetCore.Mvc;

namespace IPClassify.Controllers
{
    [ApiController]
    [Route("/")]
    public class IPClassifyControllers : ControllerBase
    {
        [HttpGet]
        public IActionResult ClassifyIPs([FromQuery] string? items)
        {
            try
            {
                int ipv4Count = 0;
                int ipv6Count = 0;

                if (string.IsNullOrEmpty(items))
                {
                    return Ok(new
                    {
                        error = false,
                        message = "No IP addresses provided",
                        items = "",
                        results = new List<string>(),                        
                        ipv4 = 0,
                        ipv6 = 0
                    });
                }

                var ips = items.Split(',');

                if (ips.Length == 0)
                {
                    return Ok(new
                    {
                        error = true,
                        message = "Invalid input format",
                        items = items,
                        results = new List<string>(),                        
                        ipv4 = 0,
                        ipv6 = 0
                    });
                }

                var results = new List<string>();

                foreach (var ip in ips)
                {
                    string trimmedIP = ip.Trim();
                    string classification = IPClassify.Classify(trimmedIP);
                    
                    results.Add($"{trimmedIP} -> {classification}");
                    
                    if (classification == "IPv4")
                    {
                        ipv4Count++;
                    }
                    else if (classification == "IPv6")
                    {
                        ipv6Count++;
                    }
                }

                return Ok(new
                {
                    error = false,
                    items = items,
                    results = results,
                    ipv4 = ipv4Count,
                    ipv6 = ipv6Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = true,
                    message = "Internal server error: " + ex.Message,
                    items = items ?? "",
                    results = new List<string>(),
                    ipv4 = 0,
                    ipv6 = 0
                });
            }
        }
    }
}