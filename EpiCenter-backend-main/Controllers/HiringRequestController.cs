using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.HMS.HiringRequest;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class HiringRequestController(IHiringService _hiringRequestService) : ControllerBase
    {
        [HttpGet("hiring-profile")]
        public async Task<IActionResult> GetHiringRequest(string hrqId)
        {
            var result = await _hiringRequestService.GetHiringProfile(hrqId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedHiringRequests([FromBody] HiringListPageDto pageData)
        {
            var result = await _hiringRequestService.GetPagedHiringRequests(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpPost("download-all-excel")]
        public async Task<IActionResult> DownloadAllHiringRequestsExcel(PageDto pageData,
    bool? isBin, bool? isAssigned, string hiringStatusId, int? durationId, bool? isParent, int? financialYearStart,
    int? quarterId, int? userId = null)
        {
            List<int> hiringStatusIds = [];
            if (hiringStatusId != null)
                hiringStatusIds = [.. hiringStatusId!.Split(',').Select(int.Parse)];

            var fileBytes = await _hiringRequestService.ExportAllHiringRequestsToExcel(
               pageData, isBin, isAssigned, hiringStatusIds, durationId, isParent, financialYearStart, quarterId, userId);

            return File(fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "HiringRequests.xlsx");
        }


        [HttpGet("list")]
        public async Task<IActionResult> GetHiringRequestList()
        {
            var result = await _hiringRequestService.GetHiringRequests();
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetHiringRequest(int id)
        {
            var result = await _hiringRequestService.GetHiringRequest(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("hiring/{hrqId}")]
        public async Task<IActionResult> GetHiringRequestByHRQID(string hrqId)
        {
            var result = await _hiringRequestService.GetHiringRequestByHRQID(hrqId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("hiring/validate/{hrqId}")]
        public async Task<IActionResult> ValidateHiringRequestByHRQID(string hrqId)
        {
            var result = await _hiringRequestService.ValidateHiringRequestByHRQID(hrqId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateHiringRequest([FromBody] AddHiringRequestDto dto)
        {
            if (dto == null)
                return BadRequest("Hiring Screen data is null.");

            var result = await _hiringRequestService.AddHiringRequest(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("add-child-hrqs")]
        public async Task<IActionResult> AddChildHrqs([FromBody] AddChildHiringRequestsDto dto)
        {
            if (dto == null)
                return BadRequest("Hiring Screen data is null.");

            var result = await _hiringRequestService.AddChildHiringRequests(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHiringRequest(int id, [FromBody] AddHiringRequestDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _hiringRequestService.UpdateHiringRequest(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("approval")]
        public async Task<IActionResult> ApprovalStatus([FromBody] UpdateApprovalStatusDto dto)
        {
            var result = await _hiringRequestService.ChangeApprovalStatus(dto.Id, dto.ApprovalStatusId, dto.ApproverComments, dto.ApproverUpdatedDate, dto.ProceedToCancelChildHrqs);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus(int hiringRequestId, int hiringStatusId)
        {
            var result = await _hiringRequestService.ToggleStatus(hiringRequestId, hiringStatusId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("rm-owner-accept")]
        public async Task<IActionResult> AcceptRequest(int hiringRequestId, int rmOwnerId)
        {
            var result = await _hiringRequestService.RMOwnerApproval(hiringRequestId, rmOwnerId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("partner-hrqs")]
        public async Task<IActionResult> GetPagedPartnerHiringRequests([FromBody] PartnerHiringListPageDto pageData, [FromQuery] int? partnerId)
        {
            var result = await _hiringRequestService.GetPagedPartnerHiringRequests(pageData, partnerId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
        [HttpPost("partner/export")]
        public async Task<IActionResult> ExportPartnerHiringRequests([FromBody] PartnerHiringListPageDto pageData, [FromQuery] int? partnerId)
        {
            var file = await _hiringRequestService.ExportPartnerHiringRequestsToExcel(pageData, partnerId);

            return File(
                file,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "PartnerHiringRequests.xlsx"
            );
        }



        [HttpPatch("partner-hrqs/remove-partner/{hiringRequestId}/{partnerId}")]
        public async Task<IActionResult> UpdateSelectedPartnerHiringRequests(int hiringRequestId, int partnerId)
        {
            var result = await _hiringRequestService.UpdateSelectedPartnersForHrqID(hiringRequestId, partnerId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpPatch("onhold/{hiringRequestId}")]
        public async Task<IActionResult> OnHoldHiringRequest(int hiringRequestId, [FromBody] AddOnholdHiringRequestDto dto)
        {
            if (hiringRequestId != dto.HiringRequestId)
                return BadRequest("ID mismatch.");

            var result = await _hiringRequestService.OnHoldHiringRequest(hiringRequestId, dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("on-hold/paged")]
        public async Task<IActionResult> GetPagedOnholdHiringRequests([FromBody] PageDto pageData)
        {
            var result = await _hiringRequestService.GetOnHoldHiringRequestApprovals(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("approve-onhold/{hiringRequestId}")]
        public async Task<IActionResult> ReviewOnHoldHiringRequest(int hiringRequestId, int? reviewStatusId, int? OnholdRequestId)
        {
            var result = await _hiringRequestService.ApproveOnHoldHiringRequests(hiringRequestId, reviewStatusId, OnholdRequestId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("resume/{hiringRequestId}")]
        public async Task<IActionResult> ResumeHiringRequests(int hiringRequestId)
        {
            var result = await _hiringRequestService.ResumeHiringRequest(hiringRequestId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("transfer-candidate")]
        public async Task<IActionResult> TransferCandidate([FromBody] TransferCandidateDto dto)
        {
            var result = await _hiringRequestService.TransferCandidate(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpGet("view/{hrqId}")]
        public async Task<IActionResult> GetHiringRequestViewDetails(string hrqId)
        {
            var result = await _hiringRequestService.GetHiringRequestViewDetails(hrqId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
