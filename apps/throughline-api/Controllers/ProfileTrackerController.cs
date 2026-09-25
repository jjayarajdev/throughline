using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs.CMS.Onboarding.ProfileTracker;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/onboarding/[controller]")]
    [ApiController]
    public class ProfileTrackerController(IProfileTrackerService _service) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedProfileTrackersAsync( [FromBody] PageDto pageData)
        {
            var result = await _service.GetPagedProfileTrackerDetails(pageData);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetProfileTrackerListAsync()
        {
            var result = await _service.GetProfileTrackerDetailsList();
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{candidatePersonalDetailsId}")]
        public async Task<IActionResult> GetProfileTrackerAsync(int candidatePersonalDetailsId)
        {
            var result = await _service.GetProfileTrackerDetail(candidatePersonalDetailsId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProfileTracker([FromBody] AddProfileTrackerDto dto)
        {
            if (dto == null)
                return BadRequest("Profile tracker data is null.");

            var result = await _service.AddProfileTrackerDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProfileTracker(int id, [FromBody] AddProfileTrackerDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _service.UpdateProfileTrackerDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _service.ToggleProfileTrackerStatus(dto.Id, dto.IsActive);
            return result.Status ? Ok(result) : BadRequest(result);
        }

    }
}
