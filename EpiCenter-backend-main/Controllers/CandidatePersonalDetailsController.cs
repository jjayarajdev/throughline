using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.PersonalDetails;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/onboarding/[controller]")]
    [ApiController]
    public class CandidatePersonalDetailsController(ICandidatePersonalDetailsService _service) : ControllerBase
    {

        [HttpPost("paged/{candidateStatusId}")]
        public async Task<IActionResult> GetPagedOnboardingDetailsAsync([FromBody] PageDto pageData)
        {
            var result = await _service.GetPagedPersonalDetails(pageData);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetOnboardingDetailsListAsync()
        {
            var result = await _service.GetPersonalDetailsList();
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOnboardingDetailAsync(int id, int? candidateId, int? hiringRequestId)
        {
            var result = await _service.GetPersonalDetail(id, candidateId, hiringRequestId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOnboardingDetail([FromBody] AddCandidatePersonalDetailsDto dto)
        {
            if (dto == null)
                return BadRequest("Onboarding detail data is null.");

            var result = await _service.AddPersonalDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOnboardingDetail(int id, [FromBody] AddCandidatePersonalDetailsDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _service.UpdatePersonalDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _service.ToggleStatus(dto.Id, dto.IsActive);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitOnboardingDetails([FromBody] SubmitOnboardingDetailsDto dto)
        {
            if (dto == null)
                return BadRequest("Onboarding detail data is null.");

            var result = await _service.SubmitOnboardingDetails(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }
    }
}
