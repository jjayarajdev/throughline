using EpicenterX.Application.DTOs;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IDashboardService
    {
        Task<ApiResponseDto<DashboardDto>> GetDashboardDetails();
    }
}
