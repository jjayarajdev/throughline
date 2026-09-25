using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.Panel;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PanelController(IInterviewSlotService _interviewSlotService) : ControllerBase
    {

        [HttpGet("feedback")]
        public async Task<IActionResult> GetCandidateFeedbackFormAsync(int? interviewSlotId)
        {
            var result = await _interviewSlotService.GetInterviewSlotFeedbackDetails(interviewSlotId);

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> AddCandidateInterviewFeedback([FromBody] List<UpdatePanelFeedbackFormDto> dtos)
        {
            if (dtos == null)
                return BadRequest("Candidate Form data is null.");

            var result = await _interviewSlotService.UpdateInterviewSlotFeedbackDetails(dtos);

            return Ok(result);
        }
    }
}
