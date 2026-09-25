using EpicenterX.Application.DTOs.PMS;
using EpicenterX.Domain.Enums;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IHelperMethods
    {
        Task<List<string>> GetUserNamesAsync(List<int>? userIds);
        Task<string> GetUserNamesStringAsync(List<int>? userIds);
        Task AddUserRoles(List<int> userIdList, int roleId);
        Task<ExistingContactDto> CheckContactNumberExists(string? phoneNumber, int? contactId = null);
        Task<int> GetLoggedInUserIdAsync(bool? IsRoleId);
        (DateTime StartDate, DateTime? EndDate)? GetDateRangeByDurationId(int durationId);
        Task<(DateTime start, DateTime end)> GetFinancialQuarterRange(int financialYearStart, FinancialQuarter quarter);
        int? GetUserId();
        int? GetRoleId();
        (int? UserId, int? RoleId, int? PartnerId) GetUserDetails();

        (DateTime? startDate, DateTime? endDate) GetCurrentDurationRange(int? durationId);
    }
}
