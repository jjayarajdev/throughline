using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    //[Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RCMSController(IExternalService _externalService) : ControllerBase
    {
        [HttpGet("{rcmsProjectId}/{rcMsResourceRequestId}")]
        public async Task<IActionResult> GetRCMSAsync(string rcmsProjectId, string rcMsResourceRequestId)
        {
            var result = await _externalService.GetRCMSAsync(rcmsProjectId, rcMsResourceRequestId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
