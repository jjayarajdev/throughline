using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.HiringRequest;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IExternalService
    {
        Task<ApiResponseDto<GetHiringRequestDto>> GetRCMSAsync(string rcmsProjectIdId, string rcMsResourceRequestId);
    }
}
