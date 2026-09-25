using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Application.DTOs.CMS.Onboarding.AssetDetails;
using Microsoft.AspNetCore.Authorization;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/onboarding/[controller]")]
    [ApiController]
    public class AssetDetailsController(IAssetDetailsService _service) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedAssetDetailsAsync([FromBody] PageDto pageData)
        {
            var result = await _service.GetPagedAssetDetails(pageData);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetAssetDetailsListAsync()
        {
            var result = await _service.GetAssetDetailsList();
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{candidatePersonalDetailsId}")]
        public async Task<IActionResult> GetAssetDetailAsync(int candidatePersonalDetailsId)
        {
            var result = await _service.GetAssetDetail(candidatePersonalDetailsId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAssetDetail([FromBody] AddAssetDetailsDto dto)
        {
            if (dto == null)
                return BadRequest("Asset detail data is null.");

            var result = await _service.AddAssetDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAssetDetail(int id, [FromBody] AddAssetDetailsDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _service.UpdateAssetDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleAssetStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _service.ToggleAssetStatus(dto.Id, dto.IsActive);
            return result.Status ? Ok(result) : BadRequest(result);
        }
    }
}
