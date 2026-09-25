using DocumentFormat.OpenXml.Vml;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.Masters;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IMasterService
    {
        Task<ApiResponseDto<IEnumerable<CountryMasterDto>>> GetCountryMasterAsync(int? countryId);
        Task<ApiResponseDto<PagedResult<MasterDto>>> GetPagedMastersAsync(MasterPageDto pageData);
        Task<ApiResponseDto<IEnumerable<MasterDto>>> GetMastersAsync(int MasterType, int countryId, int stateId, List<int> domainIds, int? partnerId, int? hiringRequestId, int? roundNameId, bool? getVacant, List<int> roleIds, bool? isActive);
        Task<ApiResponseDto<IEnumerable<MasterDto>>> GetMasterDataByListIdsAsync(int _masterType, List<int> parentIds, bool? isActive);
        Task<ApiResponseDto<IEnumerable<MasterDto>>> GetSubDomainsMasterAsync(List<int>? domainIds);
        Task<ApiResponseDto<MasterDto>> AddMasterAsync(int type, MasterDto master);
        Task<ApiResponseDto<string>> UpdateMasterAsync(int type, MasterDto master);
        Task<ApiResponseDto<string>> DeleteMasterAsync(int type, int id);
        Task<ApiResponseDto<string>> ToggleActivationStatusMasterAsync(int? type, int id, bool? isActive);
    }
}
