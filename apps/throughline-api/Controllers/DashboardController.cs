using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController(IDashboardService _dashboardService) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetCandidateFormAsync()
        {
            var result = await _dashboardService.GetDashboardDetails();
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
