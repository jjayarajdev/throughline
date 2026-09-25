using EpicenterX.Application.DTOs;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IAuthService
    {
        Task<ApiResponseDto<AuthResultDto>> ValidateUser(LoginDto model);
    }
}
