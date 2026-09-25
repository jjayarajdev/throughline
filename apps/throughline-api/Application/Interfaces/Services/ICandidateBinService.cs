using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs.CMS.CandidateBin;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface ICandidateBinService
    {
        Task<ApiResponseDto<string>> ValidateCandidatesFromProc(List<GetCandidateBinDto> candidateDtos);

        Task<ApiResponseDto<string>> ValidateCandidates(List<GetCandidateBinDto> candidateDtos);

        Task<ApiResponseDto<PagedResult<GetCandidateBinDto>>> GetPagedCandidates(PageDto pageData);

        Task<ApiResponseDto<PagedResult<GetCandidateBinDto>>> GetManagerApprovalCandidates(CandidateExceptionsPageDto pageData, int? partnerId);

        Task<ApiResponseDto<GetCandidateBinDto>> GetCandidateById(int id);

        Task<ApiResponseDto<GetCandidateBinDto>> UploadCandidate(AddCandidateBinDto candidateDto);

        Task<ApiResponseDto<List<GetCandidateBinDto>>> UploadCandidates(List<AddCandidateBinDto> candidateDtos);

        Task<ApiResponseDto<List<GetCandidateBinDto>>> UploadCandidatesFromProc(List<GetCandidateBinDto> candidateDtos);

        Task<ApiResponseDto<string>> UpdateCandidate(bool? isEditFromGrid, AddCandidateBinDto candidateDto);

        Task<ApiResponseDto<string>> AddToRequestForExceptionList(int id, CandidateBinRequestForExceptionDto dto);

        Task<ApiResponseDto<string>> CandidateResumeUpload(int candidateBinId, CandidateBinResumeUploadDto dto);

        Task<ApiResponseDto<string>> AckonwledgeCandidate(int candidateBinId, CandidateApprovalDetailsDto dto);

        Task<ApiResponseDto<string>> ApproveBulkUploadCandidateFromBin(CandidateApprovalDetailsDto dto);

        Task<ApiResponseDto<string>> MoveCandidateFromBin(int id, ConfirmCandidateBinDto dto);

        Task<ApiResponseDto<PagedResult<CandidateBinHistoryDto>>> GetCandidateApprovedOrRejectedExceptionList(int? partnerId, CandidateExceptionsPageDto pageData);

        Task<ApiResponseDto<string>> DeleteFromBin(int id);

    }
}
