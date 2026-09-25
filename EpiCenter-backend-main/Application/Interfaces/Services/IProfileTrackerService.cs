using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.ProfileTracker;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IProfileTrackerService
    {
        Task<ApiResponseDto<PagedResult<GetProfileTrackerDto>>> GetPagedProfileTrackerDetails(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<GetProfileTrackerDto>>> GetProfileTrackerDetailsList();
        Task<ApiResponseDto<GetProfileTrackerDto>> GetProfileTrackerDetail(int candidatePersonalDetailsId);
        Task<ApiResponseDto<GetProfileTrackerDto>> AddProfileTrackerDetail(AddProfileTrackerDto dto);
        Task<ApiResponseDto<string>> UpdateProfileTrackerDetail(AddProfileTrackerDto dto);
        Task<ApiResponseDto<string>> ToggleProfileTrackerStatus(int id, bool? isActive);
    }
}
