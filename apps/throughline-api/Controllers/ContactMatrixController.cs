using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.ContactMatrix;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ContactMatrixController(IContactMatrixService _contactMatrixService) : ControllerBase
    {

        [HttpPost("paged")]
        public async Task<IActionResult> GetContactMatricesAsync([FromBody] PageDto pageData)
        {
            var result = await _contactMatrixService.GetPagedContactMatrices(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetContactMatricesListAsync(int partnerId)
        {
            var result = await _contactMatrixService.GetContactMatrices(partnerId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetContactMatrixAsync(int id)
        {
            var result = await _contactMatrixService.GetContactMatrix(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateContactMatrix([FromBody] AddContactMatrixDto dto)
        {
            if (dto == null)
                return BadRequest("Contact Matrix data is null.");

            var result = await _contactMatrixService.AddContactMatrix(dto);

            if (result.Status == true)
            {
                return Ok(result);
            }
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateContactMatrix(int id, [FromBody] AddContactMatrixDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _contactMatrixService.UpdateContactMatrix(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("approval")]
        public async Task<IActionResult> ApprovalStatus([FromBody] UpdateContactMatrixDto dto)
        {
            var result = await _contactMatrixService.UpdateContactMatrixStatus(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _contactMatrixService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}