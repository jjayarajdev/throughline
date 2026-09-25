using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.CandidateBin;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CandidateBinController(ICandidateBinService _binService) : ControllerBase
    {
        [HttpPost("paged/{userId}")]
        public async Task<IActionResult> GetBulkCandidatesPaged(int userId, [FromBody] PageDto pageData)
        {
            var result = await _binService.GetPagedCandidates(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("manage-candidate-approval")]
        public async Task<IActionResult> GetManagerApprovalCandidates([FromBody] CandidateExceptionsPageDto pageData, int? partnerId)
        {
            var result = await _binService.GetManagerApprovalCandidates(pageData, partnerId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpPatch("manage-candidate-approval")]
        public async Task<IActionResult> MoveCandidateBinToList([FromBody] ConfirmCandidateBinDto dto)
        {
            if (dto.CandidateBinId != dto.CandidateBinId)
                return BadRequest("ID mismatch.");

            var result = await _binService.MoveCandidateFromBin(dto.CandidateBinId, dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged/request-exception-list")]
        public async Task<IActionResult> GetCandidateRejectedExceptionListAsync(int? partnerId, [FromBody] CandidateExceptionsPageDto pageData)
        {
            var result = await _binService.GetCandidateApprovedOrRejectedExceptionList(partnerId, pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpPost("single/{userId}")]
        public async Task<IActionResult> UploadCandidate(int? userId, [FromBody] AddCandidateBinDto dto)
        {
            if (dto == null)
                return BadRequest("Candidate data is required.");

            var result = await _binService.UploadCandidate(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("bulk/{userId}")]
        public async Task<IActionResult> UploadCandidates(int? userId, [FromBody] List<GetCandidateBinDto> dtos)
        {
            if (dtos == null || dtos.Count == 0)
                return BadRequest("Candidate data is required.");

            var result = await _binService.UploadCandidatesFromProc(dtos);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{candidateBinId}")]
        public async Task<IActionResult> GetCandidate(int candidateBinId)
        {
            var result = await _binService.GetCandidateById(candidateBinId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{candidateBinId}")]
        public async Task<IActionResult> UpdateCandidate(int candidateBinId, bool? isEditFromGrid, [FromBody] AddCandidateBinDto dto)
        {
            if (candidateBinId != dto.CandidateBinId)
                return BadRequest("ID mismatch.");

            var result = await _binService.UpdateCandidate(isEditFromGrid, dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("request-for-exception/{candidateBinId}")]
        public async Task<IActionResult> RequestForException(int candidateBinId, CandidateBinRequestForExceptionDto dto)
        {
            if (candidateBinId != dto.CandidateBinId)
                return BadRequest("ID mismatch.");

            var result = await _binService.AddToRequestForExceptionList(candidateBinId, dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("resume-upload/{candidateBinId}")]
        public async Task<IActionResult> ResumeUpload(int candidateBinId, [FromBody] CandidateBinResumeUploadDto candidateResume)
        {
            var result = await _binService.CandidateResumeUpload(candidateBinId, candidateResume);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("Acknowledge/{candidateBinId}")]
        public async Task<IActionResult> Acknowledge(int candidateBinId, CandidateApprovalDetailsDto dto)
        {
            var result = await _binService.AckonwledgeCandidate(candidateBinId, dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpDelete("delete/{candidateBinId}")]
        public async Task<IActionResult> DeleteCandidateFromBin(int candidateBinId)
        {
            var result = await _binService.DeleteFromBin(candidateBinId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("bulk/validate")]
        public async Task<IActionResult> ValidateCandidates([FromBody] List<GetCandidateBinDto> dtos)
        {
            if (dtos == null || dtos.Count == 0)
                return BadRequest("Candidate data is required.");

            var result = await _binService.ValidateCandidatesFromProc(dtos);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}