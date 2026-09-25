using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.Masters;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SearchColumnController(ISearchColumnService _searchColumnService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetSearchColumnsAsync([FromBody] PageDto pageData)
        {
            var result = await _searchColumnService.GetPagedSearchColumns(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list/{GridId}")]
        public async Task<IActionResult> GetSearchColumnsListAsync(int GridId)
        {
            var result = await _searchColumnService.GetSearchColumns(GridId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSearchColumnAsync(int id)
        {
            var result = await _searchColumnService.GetSearchColumn(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSearchColumn([FromBody] AddSearchColumnDto dto)
        {
            if (dto == null)
                return BadRequest("Contact Matrix data is null.");

            var result = await _searchColumnService.AddSearchColumn(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSearchColumn(int id, [FromBody] AddSearchColumnDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _searchColumnService.UpdateSearchColumn(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _searchColumnService.ToggleSearchColumnStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
