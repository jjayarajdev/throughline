using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JoiningRescheduleHistoryController(IJoiningRescheduleHistoryService _service) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedAssetDetailsAsync([FromBody] PageDto pageData, int? personalDetailsId)
        {
            var result = await _service.GetPagedHistoryDetails(pageData, personalDetailsId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetAssetDetailsListAsync(int? personalDetailsId)
        {
            var result = await _service.GetHistoryDetailsList(personalDetailsId);
            return result.Status ? Ok(result) : BadRequest(result);
        }
    }
}
