using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class UserService(IGenericRepository<Users> _uesrRepository,
        AppDBContext _context,
                             IGenericRepository<UserRole> _uesrRoleRepository,
                             IGenericRepository<Role> _roleRepository,
                             IGenericRepository<M_RoleFormAccess> _roleFormsRepository,
                             IGenericRepository<Notifications> _notificationRepository,
                             IMapper _mapper) : BaseService, IUserService
    {
        public async Task<ApiResponseDto<PagedResult<UserDto>>> GetPagedUsersAsync(PageDto pageData, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _uesrRepository.GetPaginatedListAsync(pageData,
                    query => query.Include(x => x.UserRoles!)
                                  .ThenInclude(x => x.Role)
                                  .Where(x => x.IsActive == (isActive == null ? x.IsActive : isActive))
                    , "User");

                var dtos = _mapper.Map<IEnumerable<UserDto>>(result.Items);

                return new PagedResult<UserDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }
            , "Users fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<UserDto>>> GetUsersAsync(bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _uesrRepository.GetListAsync(query => query
                                                  .Include(x => x.UserRoles!)
                                                  .ThenInclude(x => x.Role)
                                                  .Where(x => x.IsActive == (isActive == null ? x.IsActive : isActive)));


                return _mapper.Map<IEnumerable<UserDto>>(result);
            }, "Users list fetched successfully.");
        }

        public async Task<ApiResponseDto<UserDto>> GetUserAsync(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _uesrRepository.GetAsync(query => query
                                                  .Include(x => x.UserRoles!)
                                                  .ThenInclude(x => x.Role).Where(x => x.UserId == id));
                return _mapper.Map<UserDto>(result);
            }, "Users list fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> AddUserRoleAsync(UserRoleDto userRoleDto)
        {
            return await ExecuteAsync(async () =>
            {
                var existedUserRole = await _uesrRoleRepository.GetAsync(query => query.Where(u => u.UserId == userRoleDto.UserId));

                if (existedUserRole != null)
                    throw new Exception("User already mapped to the role.");

                if (userRoleDto == null)
                    throw new BadHttpRequestException("Data is required");

                if (userRoleDto.RoleId == (int)ROLES.PARTNER && (userRoleDto.PartnerId == null || userRoleDto.PartnerId == 0))
                    throw new BadHttpRequestException("PartnerId is required");

                var result = await _uesrRoleRepository.AddAsync(_mapper.Map<UserRole>(userRoleDto));

            }, "User role added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateUserRoleAsync(UserRoleDto userRoleDto)
        {
            return await ExecuteAsync(async () =>
            {
                if (userRoleDto == null)
                    throw new BadHttpRequestException("Data is required");

                if (userRoleDto.RoleId == (int)ROLES.PARTNER && (userRoleDto.PartnerId == null || userRoleDto.PartnerId == 0))
                    throw new BadHttpRequestException("PartnerId is required");

                var existedUserRole = await _context.UserRolesMapping.Where(x => x.UserId == userRoleDto.UserId).FirstOrDefaultAsync()
                ?? throw new Exception("User not mapped to any role.");

                existedUserRole.RoleId = userRoleDto.RoleId;

                if (userRoleDto.RoleId == (int)ROLES.PARTNER)
                {
                    existedUserRole.PartnerId = userRoleDto.PartnerId;
                }

                _context.UserRolesMapping.Update(existedUserRole);
                await _context.SaveChangesAsync();

            }, "User role updated successfully.");
        }

        public Task<ApiResponseDto<UserDto>> AddUserAsync(UserDto user)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponseDto<string>> UpdateUserAsync(UserDto user)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponseDto<UserDto>> GetUserByNameAsync(string name)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponseDto<UserDto>> IsEmailExistsAsync(string? email)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponseDto<UserDto>> IsUserNameExistsAsync(string? username)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponseDto<string>> ToggleActivationStatusAsync(BaseIdentifierDto user)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _uesrRepository.GetAsync(user.Id, "User") ?? throw new Exception($"User is not found with Id : {user.Id}");

                result.IsActive = user.IsActive;

                await _uesrRepository.UpdateAsync(result);

            }, "User Status updated successfully.");
        }

        public Task<ApiResponseDto<IEnumerable<UserDto>>> GetAccessTypeUsersAsync()
        {
            throw new NotImplementedException();
        }

        Task<ApiResponseDto<UserDto>> IUserService.GetUserAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponseDto<string>> ChangePasswordAsync(string password, string username)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponseDto<NotificationDto>> GetUserNotifcationsAsync(int userId)
        {
            return await ExecuteAsync(async () =>
            {
                var notifications = await _notificationRepository.GetListAsync(query => query.Where(x => x.UserId == userId && x.IsRead == false));
                return _mapper.Map<NotificationDto>(notifications);
            }, "Users notifications fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<RoleDto>>> GetRolesAsync()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _roleRepository.GetListAsync(query => query.OrderBy(x => x.RoleName), "Role", false);

                return _mapper.Map<IEnumerable<RoleDto>>(result);

            }, "Roles fetched successfully.");
        }

        public async Task<ApiResponseDto<RoleDto>> GetUserRole(int? userId)
        {
            return await ExecuteAsync(async () =>
            {
                var userRole = await _uesrRoleRepository.GetAsync(query => query.Where(x => x.UserId == userId));

                var result = await _roleRepository.GetAsync(query => query.Where(x => x.RoleId == userRole.RoleId));

                return _mapper.Map<RoleDto>(result);

            }, "Role fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> DeleteUserRole(int? userId)
        {
            return await ExecuteAsync(async () =>
            {
                var userRole = await _uesrRoleRepository.GetAsync(query => query.Where(x => x.UserId == userId)) ?? throw new Exception("User is not mapped with any role.");

                _context.UserRolesMapping.Remove(userRole);
                await _context.SaveChangesAsync();

            }, "User role deleted successfully.");
        }
         
        public async Task<ApiResponseDto<EmployeeDto>> GetEmployeeDetailsByEmployeeCode(string? empCode)
        {
            return await ExecuteAsync(async () =>
            {
                var empDetails = await _uesrRepository.GetAsync(query => query
                .Where(x => x.EmployeeId! == empCode))
                ?? throw new Exception($"Employee details not found with EmployeeId : {empCode}");

                return _mapper.Map<EmployeeDto>(empDetails);

            }, "Employee details fetched successfully.");
        }


        public async Task<int> GetRoleByUserId(int? userId)
        {
            var userRole = await _uesrRoleRepository.GetAsync(query => query.Where(x => x.UserId == userId));

            var result = await _roleRepository.GetAsync(query => query.Where(x => x.RoleId == userRole.RoleId));

            return result.RoleId;
        }

        public async Task<ApiResponseDto<UserDto>> GetBETApprover()
        {
            return await ExecuteAsync(async () =>
            {
                var betApprovers = await _uesrRepository.GetListAsync(query => query
                .Include(x => x.UserRoles!)
                .ThenInclude(x => x.Role)
                .Where(x => x.UserRoles!.Any(ur => ur.RoleId == (int)ROLES.BETApprover)));

                return _mapper.Map<UserDto>(betApprovers.FirstOrDefault());

            }, "Role fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<UserRoleGridDto>>> GetPagedUserRolesAsync(PageDto pageData, bool? isActive, int? roleId, int? userId, int? partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                return await _uesrRoleRepository.GetPaginatedListWithJoinQueryAsync<UserRoleGridDto>(pageData,
                                    query => from userRole in query

                                             join user in _context.Users on userRole.UserId equals user.UserId into users
                                             from user in users.DefaultIfEmpty()

                                             join role in _context.Roles on userRole.RoleId equals role.RoleId into roles
                                             from role in roles.DefaultIfEmpty()


                                             join partner in _context.Partners on userRole.PartnerId equals partner.Id into partners
                                             from partner in partners.DefaultIfEmpty()

                                             where userRole.UserId == (userId == null ? userRole.UserId : userId) &&
                                                   userRole.RoleId == (roleId == null ? userRole.RoleId : roleId) &&
                                                   userRole.PartnerId == (partnerId == null ? userRole.PartnerId : partnerId) &&
                                                   userRole.IsActive == (isActive == null ? userRole.IsActive : isActive)

                                             orderby (userRole.UpdatedAt ?? userRole.CreatedAt ?? DateTime.MinValue) descending,
                                                      user.FullName descending

                                             select new UserRoleGridDto
                                             {
                                                 UserId = userRole.UserId,
                                                 FullName = user.FullName,
                                                 RoleId = userRole.RoleId,
                                                 RoleName = role.RoleName,
                                                 PartnerId = userRole.PartnerId,
                                                 PartnerName = partner.PartnerName,
                                                 AssignedAt = userRole.CreatedAt,
                                                 Email = user.Email,
                                                 DomainNames = string.Join(", ", _context.M_Domains
                                                                                        .Where(ud => ud.DomainManagerId == userRole.UserId)
                                                                                        .Select(ud => ud.Name)),
                                                 SubDomainNames = string.Join(", ", _context.M_SubDomains
                                                                                        .Where(sd => sd.SubDomainManagerId == userRole.UserId)
                                                                                        .Select(sd => sd.Name)),
                                                 IsActive = userRole.IsActive
                                             });

            }
            , "UserRoles fetched successfully.");
        }

    }
}
