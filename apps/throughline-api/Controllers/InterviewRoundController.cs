using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.InterviewRound;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class InterviewRoundController(IInterviewRoundService _interviewRoundService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedInterviewRounds([FromBody] PageDto pageData)
        {
            var result = await _interviewRoundService.GetPagedInterviewRounds(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
        [HttpGet("list")]
        public async Task<IActionResult> GetInterviewRoundList(int hiringRequestId)
        {
            var result = await _interviewRoundService.GetInterviewRounds(hiringRequestId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetInterviewRound(int id)
        {
            var result = await _interviewRoundService.GetInterviewRound(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateInterviewRound([FromBody]AddInterviewRoundDto dto)
        {
            if (dto == null)
                return BadRequest("Interview Round data is null.");

            var result = await _interviewRoundService.AddInterviewRound(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInterviewRound(int id, [FromBody] AddInterviewRoundDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _interviewRoundService.UpdateInterviewRound(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _interviewRoundService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
