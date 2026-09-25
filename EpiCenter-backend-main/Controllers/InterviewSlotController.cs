using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.CMS.InterviewSlot;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/CandidateForm")]
    [ApiController]
    public class InterviewSlotController(IInterviewSlotService _interviewSlotService) : ControllerBase
    {
        [HttpPost("candidates/screening-list")]
        public async Task<IActionResult> GetScreeningCandidatesAsync([FromBody] InterviewSlotScreeningPageDto pageData)
        {
            var result = await _interviewSlotService.GetInterviewScreeningList(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("update-screening-status")]
        public async Task<IActionResult> UpdateScreeningStatus(AddScreeningSlotDto dto)
        {
            var result = await _interviewSlotService.UpdateCandidateScreeningSlot(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("candidates/interview-list")]
        public async Task<IActionResult> GetInterviewSlots([FromBody] InterviewSlotListPageDto pageData)
        {
            var result = await _interviewSlotService.GetCandidateInterviewSlotList(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("assign-interview-slots")]
        public async Task<IActionResult> CreateInterviewSlotForm([FromBody] AddInterviewSlotDto dto)
        {
            if (dto == null)
                return BadRequest("Candidate Form data is null.");

            var result = await _interviewSlotService.ScheduleCandidateInterviewSlot(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("partner/edit-interview-slot")]
        public async Task<IActionResult> EditInterviewSlot([FromBody] EditInterviewSlotDto dto)
        {
            var result = await _interviewSlotService.EditCandidateInterviewSlot(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("candidates/interview-slot-notifications")]
        public async Task<IActionResult> GetInterviewSlotNotifications(int? partnerId, int? categoryId, [FromBody] PageDto pageData, int? durationId)
        {
            var result = await _interviewSlotService.GetPartnerInterviewSlotPendingApprovalRequests(partnerId, categoryId, pageData, durationId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("partner/accept-interview-slot")]
        public async Task<IActionResult> AcceptInterviewSlot([FromBody] AcceptInterviewSlotDto dto)
        {
            var result = await _interviewSlotService.PartnerUpdateCandidateInterviewSlot(dto.InterviewSlotId, dto.IsAccepted, dto.Comments!);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("partner/update-interview-status")]
        public async Task<IActionResult> PartnerUpdateInterviewStatus([FromBody] CandidateInterviewUpdateDto dto)
        {
            var result = await _interviewSlotService.PartnerUpdateCandidateInterviewStatus(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("update-interview-feedback")]
        public async Task<IActionResult> UpdateInterviewFeedback([FromBody] AddFeedbackDto dto)
        {
            if (dto == null)
                return BadRequest("Candidate Form data is null.");

            var result = await _interviewSlotService.UpdateInterviewFeedback(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("candidates/interview-feedback-pending")]
        public async Task<IActionResult> GetInterviewFeedbacks([FromBody] InterviewFeedbackPendingListPageDto pageData)
        {
            var result = await _interviewSlotService.GetInterviewFeedbackPendingList(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("candidates/selected-list")]
        public async Task<IActionResult> GetSelectedCandidates([FromBody] InterviewSelectedListPageDto pageData)
        {
            var result = await _interviewSlotService.GetInterviewSelectedList(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("candidate-feedback-details")]
        public async Task<IActionResult> GetCandidateFeedbackFormAsync(int? candidateId)
        {
            var result = await _interviewSlotService.GetCandidateInterviewFeedbackDetails(candidateId);

            return Ok(result);
        }


        [HttpPost("partner/unallocated-candidate-list")]
        public async Task<IActionResult> GetPartnerCandidateUnallocatedInterviewSlots([FromBody] CandidateAwaitingSlotListPageDto pageData)
        {
            var result = await _interviewSlotService.GetUnallocatedPartnerCandidatesList(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("reconsider-candidate")]
        public async Task<IActionResult> ReconciderCandidate([FromBody] ReconsiderCandidateDto dto)
        {
            var result = await _interviewSlotService.ReconsiderCandidate(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
