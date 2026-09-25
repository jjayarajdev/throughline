using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.EscalationMatrix;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Application.Services;
using EpicenterX.Domain.Entities.PMS;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EscalationMatrixController(IEscalationMatrixService _escalationMatrixService,
        IGenericRepository<Partner> _partnerRepository) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedEscalationMatrices([FromBody] PageDto pageData)
        {
            var result = await _escalationMatrixService.GetPagedEscalationMatrices(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetEscalationMatrixList(int partnerId)
        {
            var result = await _escalationMatrixService.GetEscalationMatrices(partnerId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEscalationMatrix(int id)
        {
            var result = await _escalationMatrixService.GetEscalationMatrix(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEscalationMatrix([FromBody] AddEscalationMatrixDto dto)
        {
            if (dto == null)
                return BadRequest("Escalation Matrix data is null.");

            var result = await _escalationMatrixService.AddEscalationMatrix(dto);

            if (result.Status == true)
            {
                return Ok(result);
            }
            else
                return BadRequest(result);
        }

        [HttpPatch("approval")]
        public async Task<IActionResult> UpdateEscalationApprovalStatus([FromBody] UpdateEscalationMatrixDto dto)
        {
            var result = await _escalationMatrixService.UpdateEscalationMatrixStatus(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEscalationMatrix(int id, [FromBody] AddEscalationMatrixDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _escalationMatrixService.UpdateEscalationMatrix(dto);
            if (result.Status == true)
            {
                return Ok(result);
            }
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _escalationMatrixService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}