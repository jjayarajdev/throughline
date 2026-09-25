using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.Calibration;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface ICalibrationService
    {
        Task<ApiResponseDto<PagedResult<GetCalibrationDto>>> GetPagedCalibrations(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<GetCalibrationDto>>> GetCalibrations(int hiringRequestId);
        Task<ApiResponseDto<GetCalibrationDto>> GetCalibration(int id);
        Task<ApiResponseDto<GetCalibrationDto>> AddCalibration(AddCalibrationDto calibration);
        Task<ApiResponseDto<string>> UpdateCalibration(AddCalibrationDto calibration);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
    }
}
