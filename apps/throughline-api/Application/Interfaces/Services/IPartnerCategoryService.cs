using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.PartnerCategory;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IPartnerCategoryService
    {
        Task<ApiResponseDto<PagedResult<GetPartnerCategoryDto>>> GetPagedPartnerCategories(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<GetPartnerCategoryDto>>> GetPartnerCategories(int hiringRequestId);
        Task<ApiResponseDto<GetPartnerCategoryDto>> GetPartnerCategory(int id);
        Task<ApiResponseDto<GetPartnerCategoryDto>> GetPartnerCategoryByHiringId(int hiringId);
        Task<ApiResponseDto<GetPartnerCategoryDto>> AddPartnerCategory(AddPartnerCategoryDto partnerCategory);
        Task<ApiResponseDto<string>> UpdatePartnerCategory(AddPartnerCategoryDto partnerCategory);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);

    }
}
