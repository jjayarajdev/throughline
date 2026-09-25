using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EpicenterX.Application.Services
{
    public class AuthService(IGenericRepository<Users> _userRepository,
        IConfiguration _configuration,
        IMapper _mapper) : BaseService, IAuthService
    {
        public async Task<ApiResponseDto<AuthResultDto>> ValidateUser(LoginDto model)
        {
            return await ExecuteAsync(async () =>
            {
                var user = await _userRepository.GetAsync(query => query
                .Include(x => x.UserRoles!)
                .ThenInclude(x => x.Role)
                .Include(x => x.UserRoles!)
                .ThenInclude(x => x.Partner)
                .Where(x => x.Email == model.Email))
                ?? throw new UnauthorizedAccessException("User not found. Please check the user ID.");

                if (user?.IsActive == false)
                    throw new UnauthorizedAccessException("The user with Email : " + model.Email + " is inactive.");

                if (user?.UserRoles?.Count == 0)
                    throw new UnauthorizedAccessException("The user with Email : " + model.Email + " is not assigned with any role.");

                var details = await GetAuthenticationDetails(user!);

                return details;

            }, "User validated successfully.");
        }

        public async Task<AuthResultDto> GetAuthenticationDetails(Users user)
        {
            AuthResultDto result = new();
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user!.UserId!.ToString()),
                new Claim(ClaimTypes.Name, user!.Email!),
                new Claim("RoleId", user?.UserRoles.FirstOrDefault()?.RoleId?.ToString()),
                new Claim("PartnerId",  user?.UserRoles.FirstOrDefault()?.PartnerId ==null ? "" : user?.UserRoles.FirstOrDefault()?.PartnerId?.ToString()),
                new Claim(ClaimTypes.Role,string.Join(", ", user!.UserRoles!.Select(ur => ur.Role!.RoleName))??"")
            };

            var keyBytes = Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!);
            if (keyBytes.Length < 32)
            {
                throw new InvalidDataException("Secret key should have a minimum length of 32 bytes");
            }
            var key = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Create the JWT token
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddYears(1),
                signingCredentials: creds
            );

            result.Token = new JwtSecurityTokenHandler().WriteToken(token);
            result.UserId = user!.UserId;
            result.Roles = _mapper.Map<List<DropdownDto>>(user!.UserRoles!.Select(x => x.Role));
            result.Email = user!.Email;
            result.UserName = user!.Username;
            var partner = user.UserRoles!.Where(x => x.RoleId == (int)ROLES.PARTNER).FirstOrDefault();
            if (partner != null)
            {
                result.PartnerId = partner.PartnerId;
                result.PartnerName = partner.Partner!.PartnerName;
            }

            return await Task.FromResult(result);
        }
    }
}