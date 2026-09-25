using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.TrainingDetails;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface ITrainingDetailsService
    {
        Task<ApiResponseDto<PagedResult<GetTrainingDetailsDto>>> GetPagedTrainingDetails(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<GetTrainingDetailsDto>>> GetTrainingDetailsList();
        Task<ApiResponseDto<GetTrainingDetailsDto>> GetTrainingDetail(int candidatePersonalDetailsId);
        Task<ApiResponseDto<GetTrainingDetailsDto>> AddTrainingDetail(AddTrainingDetailsDto dto);
        Task<ApiResponseDto<string>> UpdateTrainingDetail(AddTrainingDetailsDto dto);
        Task<ApiResponseDto<string>> ToggleTrainingStatus(int id, bool? isActive);
    }
}
