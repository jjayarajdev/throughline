using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.CandidateBin;
using EpicenterX.Application.DTOs.PMS.PartnerProfile;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Application.Services;
using EpicenterX.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PartnerController(IPartnerService _partnerService) : ControllerBase
    {

        [HttpGet("profile")]
        public async Task<IActionResult> GetPartnersAsync(string? partnerCode)
        {
            var result = await _partnerService.GetPartnerProfile(partnerCode);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpPost("paged")]
        public async Task<IActionResult> GetPartnersAsync([FromBody] PageDto pageData, string? statusId, bool? isVMApproved)
        {
            List<int> statusIds = [];
            if (statusId != null)
                statusIds = [.. statusId!.Split(',').Select(int.Parse)];

            var result = await _partnerService.GetPagedPartners(pageData, statusIds, isVMApproved);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged/open-list")]
        public async Task<IActionResult> GetHRQOpenListAsync([FromBody] PageDto pageData, int? partnerId)
        {
            var result = await _partnerService.GetPagedHReqOpenList(pageData, partnerId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged/capability-deck-documants")]
        public async Task<IActionResult> GetPartnerCapabilityDeckDocumentsAsync([FromBody] PageDto pageData, int? partnerId)
        {
            var result = await _partnerService.GetPagedPartnerCapabilityDocuments(pageData, partnerId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetPartnersListAsync()
        {
            var result = await _partnerService.GetPartners();

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPartnerAsync(int id)
        {
            var result = await _partnerService.GetPartner(id);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateResource([FromBody] AddPartnerDto partnerDto)
        {
            if (partnerDto == null)
                return BadRequest("Partner data is null.");

            var result = await _partnerService.AddPartner(partnerDto);

            if (result.Status == true)
            {
                return Ok(result);
            }
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateResource(int id, [FromBody] AddPartnerDto partnerDto)
        {
            if (id != partnerDto.Id)
                return BadRequest("Partner ID mismatch.");

            if (partnerDto == null)
                return BadRequest("Partner is null.");

            var result = await _partnerService.UpdatePartner(partnerDto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleActivationResourceAsync(ReIntiatePartnerDto dto)
        {
            var result = await _partnerService.ChangePartnerStatus(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("approve-partner")]
        public async Task<IActionResult> SubmitPartnerAsync(int partnerId, [FromBody] ApprovePartnerDto dto)
        {
            var result = await _partnerService.ApproveOrRejectPartner(partnerId, dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("submit-partner")]
        public async Task<IActionResult> ApprovePartnerAsync(int partnerId)
        {
            var result = await _partnerService.SubmitPartner(partnerId);


            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("unfreeze-partner")]
        public async Task<IActionResult> UnfreezePartnerAsync(int partnerId, int? userId)
        {
            var result = await _partnerService.UnfreezePartner(partnerId, userId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpPost("podetails/paged")]
        public async Task<IActionResult> GetPartnersAsync([FromQuery] List<int> statusId, [FromBody] PageDto pageData)
        {
            var result = await _partnerService.GetPagedPartnersWithPODetails(statusId, pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("download-all-excel")]
        public async Task<IActionResult> DownloadAllPartnersExcel(PageDto pageData, string statusId, bool? isVMApproved)
        {
            List<int> statusIds = [];
            if (statusId != null)
                statusIds = [.. statusId!.Split(',').Select(int.Parse)];

            var fileBytes = await _partnerService.ExportAllPartnersToExcel(pageData, statusIds, isVMApproved);

            return File(fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "PartnerManagement.xlsx");
        }


        [HttpPost("pending-all")]
        public async Task<IActionResult> GetPendingMatrices(PageDto pageData)
        {
            var result = await _partnerService.GetAllMatricesByStatus(CONTACT_MATRIX_STATUS.PENDING, pageData);

            if (result.Status)
                return Ok(result);

            return BadRequest(result);
        }


        [HttpPost("pending-all-SOW")]
        public async Task<IActionResult> GetPendingSOWMatrices(PageDto pageData)
        {
            var result = await _partnerService.GetAllSOWMatricesByStatus(CONTACT_MATRIX_STATUS.PENDING, pageData);

            if (result.Status)
                return Ok(result);

            return BadRequest(result);
        }


        [HttpPost("approve-matrix")]
        public async Task<IActionResult> ApproveMatrix([FromBody] ApproveMatrixDto dto)
        {
            var result = await _partnerService.ApproveMatrix(dto);
            if (result.Status)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPost("approve-SOW-matrix")]
        public async Task<IActionResult> ApproveSOWMatrix([FromBody] ApproveMatrixDto dto)
        {
            var result = await _partnerService.ApproveSOWMatrix(dto);
            if (result.Status)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPost("assign-open-hiring-requests/{partnerId}")]
        public async Task<IActionResult> AssignOpenHiringRequests(int partnerId, [FromBody] AssignOpenHiringListDto dto)
        {
            var result = await _partnerService.AssignOpenHiringListToPartner(partnerId, dto);

            return result.Status ? Ok(result) : BadRequest(result);
        }
    }
}