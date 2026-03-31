using Microsoft.AspNetCore.Mvc;

namespace IPValid.Controllers
{
    [ApiController]
    [Route("/")]
    public class IPValidControllers : ControllerBase
    {
        [HttpGet]
        public IActionResult ValidateIPs([FromQuery] string? items)
        {
            try
            {
                if (string.IsNullOrEmpty(items))
                {
                    return Ok(new
                    {
                        error = false,
                        message = "No IP addresses provided",
                        items = "",
                        results = new List<string>(),
                        total_valid_ips = 0
                    });
                }

                var ipList = items.Split(',');
                
                if (ipList.Length == 0)
                {
                    return Ok(new
                    {
                        error = true,
                        message = "Invalid input format",
                        items = items,
                        results = new List<string>(),
                        total_valid_ips = 0
                    });
                }

                int validCount = 0;
                var results = new List<string>();

                foreach (var ip in ipList)
                {
                    string trimmedIP = ip.Trim();
                    string validationResult = IPValid.ValidateIP(trimmedIP);
                    
                    results.Add($"{trimmedIP} -> {validationResult}");
                    
                    if (IPValid.IsValid(trimmedIP))
                    {
                        validCount++;
                    }
                }

                return Ok(new
                {
                    error = false,
                    items = items,
                    results = results,
                    total_valid_ips = validCount
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
                    total_valid_ips = 0
                });
            }
        }
    }
}