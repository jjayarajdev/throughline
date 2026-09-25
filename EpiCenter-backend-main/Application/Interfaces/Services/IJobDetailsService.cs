using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.JobDetails;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IJobDetailsService
    {
        Task<ApiResponseDto<PagedResult<GetJobDetailsDto>>> GetPagedJobDetails(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<GetJobDetailsDto>>> GetJobDetails(int hiringRequestId);
        Task<ApiResponseDto<GetJobDetailsDto>> GetJobDetail(int id);
        Task<ApiResponseDto<GetJobDetailsDto>> GetJobDetailByHiringId(int hiringId);
        Task<ApiResponseDto<GetJobDetailsDto>> AddJobDetail(AddJobDetailsDto jobDetail);
        Task<ApiResponseDto<string>> UpdateJobDetail(AddJobDetailsDto jobDetail);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);

    }
}
