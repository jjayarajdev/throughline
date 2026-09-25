using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.ContactMatrix;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IContactMatrixService
    {
        Task<ApiResponseDto<PagedResult<GetContactMatrixDto>>> GetPagedContactMatrices(PageDto pagedata);
        Task<ApiResponseDto<IEnumerable<GetContactMatrixDto>>> GetContactMatrices(int partnerId);
        Task<ApiResponseDto<GetContactMatrixDto>> GetContactMatrix(int id);
        Task<ApiResponseDto<GetContactMatrixDto>> AddContactMatrix(AddContactMatrixDto contactMatrix);
        Task<ApiResponseDto<string>> UpdateContactMatrix(AddContactMatrixDto contactMatrix);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);

        Task<ApiResponseDto<string>> UpdateContactMatrixStatus(UpdateContactMatrixDto dto);

    }
}
