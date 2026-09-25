using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.HMS;
using EpicenterX.Application.DTOs.HMS.HiringRequest;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IHiringService
    {
        Task<ApiResponseDto<HiringProfileDto>> GetHiringProfile(string hrqId);
        Task<ApiResponseDto<PagedResult<HiringGridViewDto>>> GetPagedHiringRequests(HiringListPageDto pageData);
        Task<ApiResponseDto<IEnumerable<GetHiringRequestDto>>> GetHiringRequests();
        Task<ApiResponseDto<GetHiringRequestDto>> GetHiringRequest(int id);
        Task<ApiResponseDto<GetHiringRequestDto>> GetHiringRequestByHRQID(string hrqId);
        Task<ApiResponseDto<ValidatedHiringRequestDetailsDto>> ValidateHiringRequestByHRQID(string hrqId);
        Task<ApiResponseDto<GetHiringRequestDto>> AddHiringRequest(AddHiringRequestDto hiringRequest);
        Task<ApiResponseDto<string>> AddChildHiringRequests(AddChildHiringRequestsDto dto);
        Task<ApiResponseDto<string>> UpdateHiringRequest(AddHiringRequestDto hiringRequest);
        Task<ApiResponseDto<string>> ChangeApprovalStatus(int id, int? approverStatusId, string? approverComments, DateTime? approverDate, bool? proceedToCancelChildHrqs = false);
        Task<ApiResponseDto<string>> ToggleStatus(int id, int hiringStatusId);
        Task<ApiResponseDto<string>> RMOwnerApproval(int id, int rmOwnerId);
        Task<ApiResponseDto<string>> TransferCandidate(TransferCandidateDto dto);
        Task<byte[]> ExportPartnerHiringRequestsToExcel(PartnerHiringListPageDto pageData, int? partnerId);

        Task<ApiResponseDto<PagedResult<PartnerHrqsGridDto>>> GetPagedPartnerHiringRequests(PartnerHiringListPageDto pageData, int? partnerId);
        Task<ApiResponseDto<string>> UpdateSelectedPartnersForHrqID(int hiringRequestId, int partnerId);
        Task<ApiResponseDto<string>> OnHoldHiringRequest(int hiringRequestId, AddOnholdHiringRequestDto dto);
        Task<ApiResponseDto<PagedResult<OnholdHiringGridViewDto>>> GetOnHoldHiringRequestApprovals(PageDto pageData);
        Task<ApiResponseDto<string>> ApproveOnHoldHiringRequests(int hiringRequestId, int? reviewStatusId, int? OnholdRequestId);
        Task<ApiResponseDto<string>> ResumeHiringRequest(int hiringRequestId);
        Task<ApiResponseDto<ViewHiringRequestDto>> GetHiringRequestViewDetails(string hrqId);
        Task<byte[]> ExportAllHiringRequestsToExcel(PageDto pageData, bool? isBin, bool? isAssigned, List<int> hiringStatusId, int? durationId, bool? isParent, int? financialYearStart,
    int? quarterId, int? userId);
    }
}
