using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.ContactMatrix;
using EpicenterX.Application.DTOs.PMS.EscalationMatrix;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IEscalationMatrixService
    {
        Task<ApiResponseDto<PagedResult<GetEscalationMatrixDto>>> GetPagedEscalationMatrices(PageDto pagedata);
        Task<ApiResponseDto<IEnumerable<GetEscalationMatrixDto>>> GetEscalationMatrices(int partnerId);
        Task<ApiResponseDto<GetEscalationMatrixDto>> GetEscalationMatrix(int id);
        Task<ApiResponseDto<GetEscalationMatrixDto>> AddEscalationMatrix(AddEscalationMatrixDto escalationMatrix);
        Task<ApiResponseDto<string>> UpdateEscalationMatrix(AddEscalationMatrixDto escalationMatrix);
        Task<ApiResponseDto<string>> UpdateEscalationMatrixStatus(UpdateEscalationMatrixDto dto);

        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
    }
}
