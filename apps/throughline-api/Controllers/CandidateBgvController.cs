using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.CandidateBgvDetails;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/onboarding/[controller]")]
    [ApiController]
    public class CandidateBgvController(ICandidateBgvService _service) : ControllerBase
    {
        [HttpPost("paged/documents")]
        public async Task<IActionResult> GetSOWQuoteDocsAsync([FromBody] PageDto pageData, int? bgvDocId, int docType)
        {
            var result = await _service.GetPagedBGVDocs(pageData, bgvDocId, docType);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{candidatePersonalDetailsId}")]
        public async Task<IActionResult> GetBgvDetailAsync(int candidatePersonalDetailsId)
        {
            var result = await _service.GetBgvDetail(candidatePersonalDetailsId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateBgvDetail([FromBody] AddCandidateBgvDetailsDto dto)
        {
            if (dto == null)
                return BadRequest("BGV detail data is null.");

            var result = await _service.AddBgvDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBgvDetail(int id, [FromBody] AddCandidateBgvDetailsDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _service.UpdateBgvDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _service.ToggleStatus(dto.Id, dto.IsActive);
            return result.Status ? Ok(result) : BadRequest(result);
        }
    }
}
