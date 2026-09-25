using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS;
using EpicenterX.Application.DTOs.PMS.Empanelment;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IEmpanelmentService
    {
        Task<ApiResponseDto<PagedResult<GetPartnerEmpanelDto>>> GetPagedPartnerEmpanels(PageDto pageData);
        Task<ApiResponseDto<PagedResult<DocumentDetailDto>>> GetPagedSOWQuoteDocs(PageDto pagedata, int? partnerEmpanelId);
        Task<ApiResponseDto<IEnumerable<GetPartnerEmpanelDto>>> GetPartnerEmpanels(int partnerId);
        Task<ApiResponseDto<GetPartnerEmpanelDto>> GetPartnerEmpanelment(int partnerId);
        Task<ApiResponseDto<GetPartnerEmpanelDto>> GetPartnerEmpanlByPartnerId(int id);
        Task<ApiResponseDto<GetPartnerEmpanelDto>> AddPartnerEmpanel(AddPartnerEmpanelDto partnerEmpanel);
        Task<ApiResponseDto<string>> UpdatePartnerEmpanel(AddPartnerEmpanelDto partnerEmpanel);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
    }
}
