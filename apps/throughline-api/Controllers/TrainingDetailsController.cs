using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.TrainingDetails;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/onboarding/[controller]")]
    [ApiController]
    public class TrainingDetailsController(ITrainingDetailsService _service) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedTrainingDetailsAsync( [FromBody] PageDto pageData)
        {
            var result = await _service.GetPagedTrainingDetails(pageData);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetTrainingDetailsListAsync()
        {
            var result = await _service.GetTrainingDetailsList();
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{candidatePersonalDetailsId}")]
        public async Task<IActionResult> GetTrainingDetailAsync(int candidatePersonalDetailsId)
        {
            var result = await _service.GetTrainingDetail(candidatePersonalDetailsId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTrainingDetail([FromBody] AddTrainingDetailsDto dto)
        {
            if (dto == null)
                return BadRequest("Training detail data is null.");

            var result = await _service.AddTrainingDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTrainingDetail(int id, [FromBody] AddTrainingDetailsDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _service.UpdateTrainingDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleTrainingStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _service.ToggleTrainingStatus(dto.Id, dto.IsActive);
            return result.Status ? Ok(result) : BadRequest(result);
        }

    }
}
