using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.Masters;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IUserService
    {
        Task<ApiResponseDto<NotificationDto>> GetUserNotifcationsAsync(int userId);
        //Task<ApiResponseDto<string>> MarkAsReadAsync(int userId,string notificationIds);
        Task<ApiResponseDto<PagedResult<UserDto>>> GetPagedUsersAsync(PageDto pageData, bool? isActive);
        Task<ApiResponseDto<IEnumerable<UserDto>>> GetUsersAsync(bool? isActive);
        Task<ApiResponseDto<UserDto>> GetUserAsync(int id);
        Task<ApiResponseDto<UserDto>> IsUserNameExistsAsync(string? username);
        Task<ApiResponseDto<UserDto>> IsEmailExistsAsync(string? email);
        Task<ApiResponseDto<UserDto>> GetUserByNameAsync(string name);
        Task<ApiResponseDto<UserDto>> AddUserAsync(UserDto user);
        Task<ApiResponseDto<string>> UpdateUserAsync(UserDto user);
        Task<ApiResponseDto<string>> ToggleActivationStatusAsync(BaseIdentifierDto user);
        Task<ApiResponseDto<string>> ChangePasswordAsync(string password, string username);


        Task<ApiResponseDto<string>> AddUserRoleAsync(UserRoleDto userRole);
        Task<ApiResponseDto<string>> UpdateUserRoleAsync(UserRoleDto userRole);
        Task<ApiResponseDto<RoleDto>> GetUserRole(int? userId);
        Task<int> GetRoleByUserId(int? userId);
        Task<ApiResponseDto<IEnumerable<RoleDto>>> GetRolesAsync();

        Task<ApiResponseDto<UserDto>> GetBETApprover();

        Task<ApiResponseDto<PagedResult<UserRoleGridDto>>> GetPagedUserRolesAsync(PageDto pageData, bool? isActive, int? roleId, int? userId, int? partnerId);
        Task<ApiResponseDto<string>> DeleteUserRole(int? userId);


        Task<ApiResponseDto<EmployeeDto>> GetEmployeeDetailsByEmployeeCode(string? empCode);

    }
}
