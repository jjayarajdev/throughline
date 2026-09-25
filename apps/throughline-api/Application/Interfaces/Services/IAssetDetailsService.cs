using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs;
using EpicenterX.Domain.Shared;
using EpicenterX.Application.DTOs.CMS.Onboarding.AssetDetails;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IAssetDetailsService
    {
        Task<ApiResponseDto<PagedResult<GetAssetDetailsDto>>> GetPagedAssetDetails(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<GetAssetDetailsDto>>> GetAssetDetailsList();
        Task<ApiResponseDto<GetAssetDetailsDto>> GetAssetDetail(int candidatePersonalDetailsId);
        Task<ApiResponseDto<GetAssetDetailsDto>> AddAssetDetail(AddAssetDetailsDto dto);
        Task<ApiResponseDto<string>> UpdateAssetDetail(AddAssetDetailsDto dto);
        Task<ApiResponseDto<string>> ToggleAssetStatus(int id, bool? isActive);
    }
}
