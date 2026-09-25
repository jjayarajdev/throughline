using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.Engagement;
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
    public class EngagementController(IEngagementService _engagementService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedEngagements([FromBody] PageDto pageData)
        {
            var result = await _engagementService.GetPagedEngagements(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
        [HttpPost("history/paged/{engagementId}")]
        public async Task<IActionResult> GetPagedEngagementHistories(int? engagementId, [FromBody] PageDto pageData)
        {
            var result = await _engagementService.GetPagedEngagementHistories(engagementId, pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetEngagementList(int partnerId)
        {
            var result = await _engagementService.GetEngagements(partnerId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEngagement(int id)
        {
            var result = await _engagementService.GetEngagement(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEngagement([FromBody] AddEngagementDto dto)
        {
            if (dto == null)
                return BadRequest("Engagement data is null.");

            var result = await _engagementService.AddEngagement(dto);
            if (result.Status == true)
            {
                return Ok(result);
            }
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEngagement(int id, [FromBody] AddEngagementDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _engagementService.UpdateEngagement(dto);
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
            var result = await _engagementService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list/engagementType/{id}")]
        public async Task<IActionResult> GetList(int id)
        {
            var result = await _engagementService.GetEngagements(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("list/evaluation-status/{statusId}")]
        public async Task<IActionResult> GetEvaluationList(int? partnerId, int statusId, [FromBody] PageDto pageData)
        {
            var result = await _engagementService.GetEvaluationEngagements(partnerId, statusId, pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}