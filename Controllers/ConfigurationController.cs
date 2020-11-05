using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;


namespace IoT_GUI.Controllers
{
    [Produces("application/json")]
    [Route("api/Configuration")]
    public class ConfigurationController : Controller
    {
        private readonly IConfiguration _configuration;

        public ConfigurationController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("[action]")]
        public IActionResult ConfigurationData()
        {
            return Ok(new Dictionary<string, string>
        {
            { "ApiAddress", _configuration["ApiAddress"] }
        });
        }
    }
}