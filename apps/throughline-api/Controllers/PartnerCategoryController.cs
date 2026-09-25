using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.PartnerCategory;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PartnerCategoryController(IPartnerCategoryService _partnerCategoryService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetPartnerCategoriesAsync([FromBody] PageDto pageData)
        {
            var result = await _partnerCategoryService.GetPagedPartnerCategories(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetPartnerCategoryListAsync(int hiringRequestId)
        {
            var result = await _partnerCategoryService.GetPartnerCategories(hiringRequestId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPartnerCategoryAsync(int id)
        {
            var result = await _partnerCategoryService.GetPartnerCategory(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("hiring/{hiringId}")]
        public async Task<IActionResult> GetPartnerCategoryByHiringIdAsync(int hiringId)
        {
            var result = await _partnerCategoryService.GetPartnerCategoryByHiringId(hiringId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePartnerCategory([FromBody] AddPartnerCategoryDto dto)
        {
            if (dto == null)
                return BadRequest("Partner Category data is null.");

            var result = await _partnerCategoryService.AddPartnerCategory(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePartnerCategory(int id, [FromBody] AddPartnerCategoryDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _partnerCategoryService.UpdatePartnerCategory(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _partnerCategoryService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
