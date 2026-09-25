using EpicenterX.Application.DTOs;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface INotificationService
    {
        Task<ApiResponseDto<PagedResult<NotificationDto>>> GetPagedNotifications(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<NotificationDto>>> GetNotifications();
        Task<ApiResponseDto<NotificationDto>> GetNotification(int id);
        Task<ApiResponseDto<NotificationDto>> AddNotification(NotificationDto notification);
        Task<ApiResponseDto<string>> UpdateNotification(NotificationDto notification);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
    }
}
