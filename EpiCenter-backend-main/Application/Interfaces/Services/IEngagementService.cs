using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.Engagement;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IEngagementService
    {
        Task<ApiResponseDto<PagedResult<GetEngagementDto>>> GetPagedEngagements(PageDto pagedata);
        Task<ApiResponseDto<PagedResult<GetEngagementDto>>> GetPagedEngagementHistories(int? engagementId, PageDto pagedata);
        Task<ApiResponseDto<IEnumerable<GetEngagementDto>>> GetEngagements(int partnerId);
        Task<ApiResponseDto<PagedResult<GetEngagementDto>>> GetEvaluationEngagements(int? partnerId,int statusId, PageDto pageData);
        Task<ApiResponseDto<GetEngagementDto>> GetEngagement(int id);
        Task<ApiResponseDto<GetEngagementDto>> AddEngagement(AddEngagementDto engagement);
        Task<ApiResponseDto<string>> UpdateEngagement(AddEngagementDto engagement);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
    }
}
