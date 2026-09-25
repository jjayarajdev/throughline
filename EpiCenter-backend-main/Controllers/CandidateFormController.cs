using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.CMS.CandidateRateCard;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CandidateFormController(ICandidateFormService _candidateFormService,
                                         IHiringService _hiringService) : ControllerBase
    {
        [HttpGet("profile/{CandidateCode}")]
        public async Task<IActionResult> GetCandidateFormAsync(string CandidateCode)
        {
            var result = await _candidateFormService.GetCandidateInterviewHistory(CandidateCode, null, true);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged/{isBin}")]
        public async Task<IActionResult> GetCandidateFormsAsync(bool? isBin, [FromBody] PageDto pageData, string? intakeStatusId, [FromQuery] int? partnerId)
        {

            List<int> intakeStatusIds = [];
            if (intakeStatusId != null)
                intakeStatusIds = [.. intakeStatusId!.Split(',').Select(int.Parse)];

            var result = await _candidateFormService.GetPagedCandidateForms(pageData, partnerId, intakeStatusIds);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged/partner/{partnerId}")]
        public async Task<IActionResult> GetPartnerCandidateFormsAsync(int partnerId, [FromBody] PartnerTalentPoolPageDto pageData)
        {
            if (partnerId == 0)
                return BadRequest("PartnerId is required.");

            var result = await _candidateFormService.GetPagedPartnerCandidateForms(pageData, partnerId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("download-candidate-level-excel")]
        public async Task<IActionResult> DownloadCandidatesExcel(PageDto pageData, bool? isBin, int? partnerId, string intakeStatusId)
        {
            List<int> intakeStatusIds = [];
            if (!string.IsNullOrWhiteSpace(intakeStatusId))
            {
                intakeStatusIds = intakeStatusId.Split(',')
                                                .Select(x => int.Parse(x.Trim()))
                                                .ToList();
            }
            var fileBytes = await _candidateFormService.ExportLatestCandidateDetails(pageData, isBin, partnerId, intakeStatusIds);

            return File(fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "CandidateManagement.xlsx");
        }

        [HttpPost("download-candidate-feedback-level-excel")]
        public async Task<IActionResult> DownloadCandidatesFeedbackExcel(PageDto pageData, bool? isBin, int? partnerId, string intakeStatusId)
        {
            List<int> intakeStatusIds = [];
            if (!string.IsNullOrWhiteSpace(intakeStatusId))
            {
                intakeStatusIds = intakeStatusId.Split(',')
                                                .Select(x => int.Parse(x.Trim()))
                                                .ToList();
            }
            var fileBytes = await _candidateFormService.ExportCandidateInterviewFeedback(pageData, partnerId, intakeStatusIds);

            return File(fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "CandidateFeedBack.xlsx");
        }

        [HttpPost("export-talentpool")]
        public async Task<IActionResult> ExportCandidateForms([FromQuery] int? partnerId, [FromBody] PartnerTalentPoolPageDto pageDto)
        {
            var file = await _candidateFormService.ExportCandidateFormsToExcel(partnerId, pageDto);

            return File(
                file,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "CandidateForms.xlsx"
            );
        }


        [HttpPost("all-candidates/paged")]
        public async Task<IActionResult> GetAllCandidateFormsAsync([FromBody] PageDto pageData, int? intakeStatusId)
        {
            var result = await _candidateFormService.GetAllPagedCandidateForms(pageData, intakeStatusId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetCandidateFormListAsync()
        {
            var result = await _candidateFormService.GetCandidateForms();
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCandidateFormAsync(int id)
        {
            var result = await _candidateFormService.GetCandidateForm(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("details/{candidateCode}")]
        public async Task<IActionResult> GetCandidateDetailsAsync(string candidateCode)
        {
            var result = await _candidateFormService.GetCandidateDetails(candidateCode);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCandidateForm([FromBody] AddCandidateDto dto)
        {
            if (dto == null)
                return BadRequest("Candidate Form data is null.");

            var result = await _candidateFormService.AddCandidateForm(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCandidateForm(int id, [FromBody] AddCandidateDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _candidateFormService.UpdateCandidateForm(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _candidateFormService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("move-to-cart")]
        public async Task<IActionResult> MoveCandidateToCart(int id)
        {
            var result = await _candidateFormService.MoveCandidateToCart(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("candidatelist/{hrqId}")]
        public async Task<IActionResult> GetCandidatesListByHrqIdAsync(string hrqId)
        {
            var result = await _candidateFormService.GetCandidatesByHrqId(hrqId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("candidatelist/hiringid/{hiringRequestId}")]
        public async Task<IActionResult> GetCandidatesListByHiringRequestIdAsync(int hiringRequestId)
        {
            var result = await _candidateFormService.GetCandidatesByHrqId(hiringRequestId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged/final-list")]
        public async Task<IActionResult> GetFinalCandidateFormsAsync([FromBody] PageDto pageData, int? partnerId, int? intakeStatusCategoryId, int? intakeStatusId, int? durationId)
        {
            var result = await _candidateFormService.GetPagedFinalCandidates(pageData, partnerId, intakeStatusCategoryId, intakeStatusId, durationId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("move-to-hrq")]
        public async Task<IActionResult> MoveToChildHrqAsync([FromBody] TransferCandidateDto dto)
        {
            var result = await _hiringService.TransferCandidate(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("move-to-offer-rolled-out")]
        public async Task<IActionResult> MoveCandidateToOfferRolledOutAsync([FromBody] AddCandidateRateCardDto dto)
        {
            var result = await _candidateFormService.MoveCandidateToOfferRolledOutAsync(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("candidate-confirm-offer")]
        public async Task<IActionResult> CandidateConfirmOfferAsync([FromBody] CandidateConfirmOfferDto dto)
        {
            var result = await _candidateFormService.CandidateConfirmOfferAsync(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("candidate-joining-confirmation")]
        public async Task<IActionResult> CandidateJoiningConfirmationAsync([FromBody] CandidateJoinConfirmationDto dto)
        {
            var result = await _candidateFormService.CandidateJoiningConfirmationAsync(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("candidate-onboarding-confirmation")]
        public async Task<IActionResult> CandidateFinalOnboardingConfirmationAsync([FromBody] ApproveOnboardingDateDto dto)
        {
            var result = await _candidateFormService.CandidateFinalOnboardingConfirmationAsync(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("rate-card/{rateCardId}")]
        public async Task<IActionResult> GetCandidateRateCardAsync(int rateCardId)
        {
            var result = await _candidateFormService.GetCandidateRateCard(rateCardId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpPost("paged/request-exception-list")]
        public async Task<IActionResult> GetCandidateFinalOnboardingExceptionListAsync([FromBody] PageDto pageData)
        {
            var result = await _candidateFormService.GetCandidateOnboardingExceptionList(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged/bgv-docs-verification-list")]
        public async Task<IActionResult> GetBGVDocsVerificationListAsync([FromBody] PageDto pageData)
        {
            var result = await _candidateFormService.GetCandidateCDANDAApprovingList(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("candidate-bgv-confirmation")]
        public async Task<IActionResult> CandidatebgvConfirmationAsync([FromBody] ApproveBGVDto dto)
        {
            var result = await _candidateFormService.CandidateBGVConfirmationAsync(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("profile/drop/{candidateId}")]
        public async Task<IActionResult> DropCandidatesync(int candidateId, [FromBody] CandidateDropOrReintiateDto dto)
        {
            var result = await _candidateFormService.DropCandidate(candidateId, dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("profile/re-intiate/{candidateId}")]
        public async Task<IActionResult> ReenableDroppedCandidatesync(int candidateId, [FromBody] CandidateDropOrReintiateDto dto)
        {
            var result = await _candidateFormService.ReenableDroppedCandidate(candidateId, dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
