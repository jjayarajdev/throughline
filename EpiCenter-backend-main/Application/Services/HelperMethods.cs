using System.Security.Claims;
using EpicenterX.Application.DTOs.PMS;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared.HelperClasses;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace EpicenterX.Application.Services
{
    public class HelperMethods(IGenericRepository<Users> _userRepository,
                               IGenericRepository<UserRole> _userRoleRepository,
                               IGenericRepository<ContactMatrix> _contactMatrixRepository,
                               IGenericRepository<EscalationMatrix> _escaltionMatrixRepository,
                               IGenericRepository<QuarterDateRange> _quarterDateRangeRepository,
                               ICandidateHelperMethods _canHelperMethods,
                               IHttpContextAccessor _httpContextAccessor,
                               IMemoryCache _cache) : IHelperMethods
    {
        public async Task<List<string>> GetUserNamesAsync(List<int>? userIds)
        {
            try
            {
                if (userIds == null || userIds.Count == 0)
                    return [];

                // Get or set cache
                var userMap = await _cache.GetOrCreateAsync("UserFullNameMap", async entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10); // cache duration
                    var users = await _userRepository.GetListAsync("User");
                    return users.ToDictionary(u => u.UserId, u => u.FullName);
                });

                // Return only names for requested userIds
                return [.. userIds.Where(userMap!.ContainsKey).Select(id => userMap[id]!)];
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching user names", ex);
            }
        }

        // Optional: return as comma-separated string
        public async Task<string> GetUserNamesStringAsync(List<int>? userIds)
        {
            var names = await GetUserNamesAsync(userIds);
            return string.Join(", ", names);
        }

        public async Task AddUserRoles(List<int> userIdList, int roleId)
        {
            List<UserRole> existingPanelUsers = [];

            foreach (var id in userIdList)
            {
                if (id > 0)
                {
                    var existingUser = await _userRoleRepository.GetAsync(query => query.Where(x => x.UserId.HasValue && x.UserId.Value == id));
                    if (existingUser != null)
                    {
                        existingPanelUsers.Add(existingUser);
                    }
                }
            }

            var existingUserIds = existingPanelUsers.Select(x => x.UserId!.Value).ToHashSet();

            var newPanelRoles = userIdList
                .Where(id => !existingUserIds.Contains(id))
                .Select(id => new UserRole
                {
                    UserId = id,
                    RoleId = roleId,
                    IsActive = true
                }).ToList();

            if (newPanelRoles.Count > 0)
            {
                await _userRoleRepository.AddListAsync(newPanelRoles);
            }
        }

        public async Task<ExistingContactDto> CheckContactNumberExists(string? phoneNumber, int? contactId = null)
        {
            var normalizedPhone = _canHelperMethods.NormalizePhone(phoneNumber!);

            var contactMatrices = await _contactMatrixRepository.GetListAsync(
                query => query.Include(x => x.Partner).Where(x => (contactId == null || x.Id != contactId) && x.IsActive == true)
            );

            foreach (var contactMatrix in contactMatrices)
            {
                if (contactMatrix != null && _canHelperMethods.NormalizePhone(contactMatrix.ContactNumber!).Contains(normalizedPhone))
                {
                    return new ExistingContactDto
                    {
                        PartnerId = contactMatrix.PartnerId,
                        PartnerName = contactMatrix.Partner?.PartnerName,
                        ContactId = contactMatrix.Id,
                        SPOCName = contactMatrix.Name,
                        TypeName = "ContactMatrix",
                    };
                }
            }

            var escalationMatrices = await _escaltionMatrixRepository.GetListAsync(
                    query => query.Include(x => x.Partner).Where(x => (contactId == null || x.Id != contactId) && x.IsActive == true)
                );

            foreach (var escalation in escalationMatrices)
            {
                if (escalation != null && _canHelperMethods.NormalizePhone(escalation.ContactNumber!).Contains(normalizedPhone))
                {
                    return new ExistingContactDto
                    {
                        PartnerId = escalation.PartnerId,
                        PartnerName = escalation.Partner?.PartnerName,
                        ContactId = escalation.Id,
                        SPOCName = escalation.Name,
                        TypeName = "EscalationMatrix",
                        StatusName = escalation.Status?.Name
                    };
                }
            }
            return null;
        }

        public async Task<int> GetLoggedInUserIdAsync(bool? IsRoleId)
        {
            var email = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);

            var user = await _userRepository.GetAsync(query => query.Where(x => x.Email == email));

            if (IsRoleId == true && user != null)
            {
                var userRole = await _userRoleRepository.GetAsync(query => query.Where(x => x.UserId == user.UserId));
                return userRole.RoleId ?? 0;
            }

            return user.UserId;
        }

        public int? GetUserId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userIdString = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userIdString, out int userId))
                return userId;

            return null;
        }

        public int? GetRoleId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var roleIdString = user?.FindFirst("RoleId")?.Value;

            if (int.TryParse(roleIdString, out int roleId))
                return roleId;

            return null;
        }

        public (DateTime StartDate, DateTime? EndDate)? GetDateRangeByDurationId(int durationId)
        {
            var today = DateTime.Today;

            return durationId switch
            {
                1 => (today.AddDays(-30), today.AddDays(1).AddTicks(-1)),
                2 => (today.AddDays(-60), today.AddDays(-30).AddDays(1).AddTicks(-1)),
                3 => (today.AddDays(-90), today.AddDays(-60).AddDays(1).AddTicks(-1)),
                4 => (today.AddDays(-120), today.AddDays(-90).AddDays(1).AddTicks(-1)),
                5 => (DateTime.MinValue, today.AddDays(-120).AddDays(1).AddTicks(-1)),
                _ => null
            };
        }

        public async Task<(DateTime start, DateTime end)> GetFinancialQuarterRange(int financialYearStart, FinancialQuarter quarter)
        {
            var data = await _quarterDateRangeRepository.GetListAsync();

            // Map to Dictionary<FinancialQuarter, QuarterDateRange>
            var quarterConfig = data.ToDictionary(
                x => (FinancialQuarter)x.Id,  // assuming QuarterNumber is int: 1 = Q1, 2 = Q2...
                x => new QuarterDateRange
                {
                    StartDay = x.StartDay,
                    StartMonth = x.StartMonth,
                    EndDay = x.EndDay,
                    EndMonth = x.EndMonth
                });

            if (!quarterConfig.TryGetValue(quarter, out var range))
                throw new ArgumentException($"No configuration found for quarter {quarter}");

            int startYear = financialYearStart;
            int endYear = financialYearStart;

            if (range.StartMonth == 11)
                startYear -= 1;

            DateTime start = new DateTime(startYear, range.StartMonth, range.StartDay);
            DateTime end = new DateTime(endYear, range.EndMonth, range.EndDay);

            return (start, end);
        }


        public (int? UserId, int? RoleId, int? PartnerId) GetUserDetails()
        {
            var user = _httpContextAccessor.HttpContext?.User;

            var userIdString = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleIdString = user?.FindFirst("RoleId")?.Value;
            var partnerIdString = user?.FindFirst("PartnerId")?.Value; // Make sure this claim exists

            int? userId = int.TryParse(userIdString, out var uid) ? uid : null;
            int? roleId = int.TryParse(roleIdString, out var rid) ? rid : null;
            int? partnerId = int.TryParse(partnerIdString, out var pid) ? pid : null;

            return (userId, roleId, partnerId);
        }

        public (DateTime? startDate, DateTime? endDate) GetCurrentDurationRange(int? durationId)
        {
            DateTime now = DateTime.UtcNow;
            DateTime? startDate, endDate;

            // Default to Current Month
            durationId ??= (int)DURATION.CURRENTMONTH;

            switch (durationId)
            {
                case (int)DURATION.ALL:
                    startDate = null;
                    endDate = null;
                    break;

                case (int)DURATION.CURRENTDAY:
                    startDate = now.Date; // Today 12:00 AM
                    endDate = now.Date.AddDays(1).AddTicks(-1); // Today 11:59:59 PM
                    break;

                case (int)DURATION.CURRENTWEEK:
                    int diff = (int)now.DayOfWeek; // Sunday = 0
                    startDate = now.Date.AddDays(-diff); // Sunday 12:00 AM
                    endDate = startDate.Value.AddDays(7).AddTicks(-1); // Saturday 11:59:59 PM
                    break;

                case (int)DURATION.CURRENTMONTH:
                    startDate = new DateTime(now.Year, now.Month, 1); // 1st day of current month 12:00 AM
                    endDate = startDate.Value.AddMonths(1).AddTicks(-1); // Last day of current month 11:59:59 PM
                    break;

                default:
                    throw new ArgumentException("Invalid durationId");
            }

            return (startDate, endDate);
        }

    }
}
