using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.CandidateBgvDetails;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface ICandidateBgvService
    {
        Task<ApiResponseDto<PagedResult<DocumentDetailDto>>> GetPagedBGVDocs(PageDto pagedata, int? bgvDocId, int? docTypeId);
        Task<ApiResponseDto<GetCandidateBgvDetailsDto>> GetBgvDetail(int id);
        Task<ApiResponseDto<GetCandidateBgvDetailsDto>> AddBgvDetail(AddCandidateBgvDetailsDto dto);
        Task<ApiResponseDto<string>> UpdateBgvDetail(AddCandidateBgvDetailsDto dto);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
    }
}
