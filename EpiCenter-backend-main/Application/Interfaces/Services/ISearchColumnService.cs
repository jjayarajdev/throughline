using EpicenterX.Application.DTOs.Masters;
using EpicenterX.Application.DTOs;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface ISearchColumnService
    {
        Task<ApiResponseDto<PagedResult<GetSearchColumnDto>>> GetPagedSearchColumns(PageDto pagedata);

        Task<ApiResponseDto<IEnumerable<GetSearchColumnDto>>> GetSearchColumns(int partnerId);

        Task<ApiResponseDto<GetSearchColumnDto>> GetSearchColumn(int id);

        Task<ApiResponseDto<GetSearchColumnDto>> AddSearchColumn(AddSearchColumnDto searchColumn);

        Task<ApiResponseDto<string>> UpdateSearchColumn(AddSearchColumnDto searchColumn);

        Task<ApiResponseDto<string>> ToggleSearchColumnStatus(int id, bool? isActive);

    }
}
