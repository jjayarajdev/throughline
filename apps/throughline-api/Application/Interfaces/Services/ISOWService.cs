using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.ContactMatrix;
using EpicenterX.Application.DTOs.PMS.SOW;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface ISOWService
    {
        Task<ApiResponseDto<PagedResult<GetSOWDto>>> GetPagedSOWDetails(PageDto pageData, int partnerId);
        Task<ApiResponseDto<IEnumerable<GetSOWDto>>> GetSOWDetails(int partnerId);
        Task<ApiResponseDto<GetSOWDto>> GetSOWDetail(int id);
        Task<ApiResponseDto<GetSOWDto>> AddSOWDetail(AddSOWDto sowDetail);
        Task<ApiResponseDto<string>> UpdateSOWDetail(AddSOWDto sowDetail);
        Task<ApiResponseDto<string>> ToggleSOWStatus(int id, bool isActive);
        Task<ApiResponseDto<string>> UpdateSOWMatrixStatus(UpdateSOWMatrixDto dto);

        Task<ApiResponseDto<PagedResult<GetSOWDto>>> GetPagedSOWDetailsByCategoryId(PageDto pageData, int? partnerId,int categoryId);



        Task<ApiResponseDto<PagedResult<GetPODetailDto>>> GetPagedPODetails(PageDto pageData, int sowId);
        Task<ApiResponseDto<IEnumerable<GetPODetailDto>>> GetPODetails(int sowId);
        Task<ApiResponseDto<GetPODetailDto>> GetPODetail(int id);
        Task<ApiResponseDto<GetPODetailDto>> AddPODetail(AddPODetailDto sowDetail);
        Task<ApiResponseDto<string>> UpdatePODetail(AddPODetailDto sowDetail);
        Task<ApiResponseDto<string>> TogglePOStatus(int id, bool? isActive);
    }
}
