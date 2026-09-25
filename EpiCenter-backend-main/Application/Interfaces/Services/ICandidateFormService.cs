using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.CMS.CandidateRateCard;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface ICandidateFormService
    {
        Task<ApiResponseDto<CandidateDataDto>> GetCandidateInterviewHistory(string candidateCode, int? partnerId, bool isAdmin = false);
        Task<ApiResponseDto<PagedResult<CandidateGridViewDto>>> GetPagedCandidateForms(PageDto pageData, int? partnerId, List<int>? intakeStatusId);
        Task<ApiResponseDto<PagedResult<CandidateGridViewDto>>> GetPagedPartnerCandidateForms(PartnerTalentPoolPageDto pageData, int? partnerId);
        Task<byte[]> ExportCandidateFormsToExcel(int? partnerId, PartnerTalentPoolPageDto pageData);

        Task<ApiResponseDto<PagedResult<CandidateGridViewDto>>> GetAllPagedCandidateForms(PageDto pageData, int? intakeStatusId);
        Task<ApiResponseDto<IEnumerable<GetCandidateDto>>> GetCandidateForms();
        Task<ApiResponseDto<GetCandidateDto>> GetCandidateForm(int id);
        Task<ApiResponseDto<CandidateDetailsDto>> GetCandidateDetails(string candidateCode);
        Task<ApiResponseDto<GetCandidateDto>> AddCandidateForm(AddCandidateDto candidateForm);
        Task<ApiResponseDto<IEnumerable<GetCandidateDto>>> AddBulkCandidates(int? partnerId, IEnumerable<AddCandidateDto> candidateForm);
        Task<ApiResponseDto<string>> UpdateCandidateForm(AddCandidateDto candidateForm);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
        Task<ApiResponseDto<string>> MoveCandidateToCart(int id);
        Task<ApiResponseDto<IEnumerable<GetCandidateDto>>> GetCandidatesByHrqId(string hrqId);
        Task<ApiResponseDto<IEnumerable<GetCandidateDto>>> GetCandidatesByHrqId(int hiringRequestId);


        Task<ApiResponseDto<PagedResult<GetCandidateDto>>> GetPagedFinalCandidates(PageDto pageData, int? partnerId, int? intakeStatusCategoryId, int? intakeStatusId, int? durationId);
        Task<ApiResponseDto<GetCandidateRateCardDto>> MoveCandidateToOfferRolledOutAsync(AddCandidateRateCardDto dto);
        Task<ApiResponseDto<string>> CandidateConfirmOfferAsync(CandidateConfirmOfferDto dto);
        Task<ApiResponseDto<string>> CandidateJoiningConfirmationAsync(CandidateJoinConfirmationDto dto);
        Task<ApiResponseDto<string>> CandidateFinalOnboardingConfirmationAsync(ApproveOnboardingDateDto dto);

        Task<ApiResponseDto<GetCandidateRateCardDto>> GetCandidateRateCard(int rateCardId);

        Task<ApiResponseDto<PagedResult<GetCandidateCDANDAApprovalListDto>>> GetCandidateOnboardingExceptionList(PageDto pageData);
        Task<ApiResponseDto<PagedResult<GetCandidateCDANDAApprovalListDto>>> GetCandidateCDANDAApprovingList(PageDto pageData);
        Task<ApiResponseDto<string>> CandidateBGVConfirmationAsync(ApproveBGVDto dto);

        Task<byte[]> ExportLatestCandidateDetails(PageDto pageData, bool? isBin, int? partnerId, List<int> intakeStatusId);

        Task<byte[]> ExportInterviewFeedback(PageDto pageData, bool? isBin, int? partnerId, List<int> intakeStatusId);
        Task<byte[]> ExportCandidateInterviewFeedback(PageDto pageData, int? partnerId, List<int> intakeStatusId);
        Task<ApiResponseDto<string>> DropCandidate(int candidateId, CandidateDropOrReintiateDto dto);
        Task<ApiResponseDto<string>> ReenableDroppedCandidate(int candidateId, CandidateDropOrReintiateDto dto);
    }
}
