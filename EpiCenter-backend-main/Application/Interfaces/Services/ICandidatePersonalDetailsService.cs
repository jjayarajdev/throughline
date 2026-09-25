using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.PersonalDetails;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface ICandidatePersonalDetailsService
    {
        Task<ApiResponseDto<PagedResult<GetCandidatePersonalDetailsDto>>> GetPagedPersonalDetails(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<GetCandidatePersonalDetailsDto>>> GetPersonalDetailsList();
        Task<ApiResponseDto<GetCandidatePersonalDetailsDto>> GetPersonalDetail(int id, int? candidateId, int? hiringRequestId);
        Task<ApiResponseDto<GetCandidatePersonalDetailsDto>> AddPersonalDetail(AddCandidatePersonalDetailsDto dto);
        Task<ApiResponseDto<string>> UpdatePersonalDetail(AddCandidatePersonalDetailsDto dto);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
        Task<ApiResponseDto<string>> SubmitOnboardingDetails(SubmitOnboardingDetailsDto dto);
    }
}
