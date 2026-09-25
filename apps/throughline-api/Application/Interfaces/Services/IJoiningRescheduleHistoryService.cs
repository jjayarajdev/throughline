using EpicenterX.Application.DTOs.CMS.Onboarding.AssetDetails;
using EpicenterX.Application.DTOs;
using EpicenterX.Domain.Shared;
using EpicenterX.Application.DTOs.CMS.JoiningRescheduleHistory;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IJoiningRescheduleHistoryService
    {
        Task<ApiResponseDto<PagedResult<GetJoiningRescheduleHistoryDto>>> GetPagedHistoryDetails(PageDto pageData, int? personalDetailsId);
        Task<ApiResponseDto<IEnumerable<GetJoiningRescheduleHistoryDto>>> GetHistoryDetailsList(int? personalDetailsId);
    }
}
