using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.CandidateBin;
using EpicenterX.Application.DTOs.GetAllMatrix;
using EpicenterX.Application.DTOs.HMS;
using EpicenterX.Application.DTOs.PMS;
using EpicenterX.Application.DTOs.PMS.PartnerOverview;
using EpicenterX.Application.DTOs.PMS.PartnerProfile;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using Microsoft.Graph.Models;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IPartnerService
    {
        Task<ApiResponseDto<PartnerProfileDto>> GetPartnerProfile(string? partnerCode);
        Task<ApiResponseDto<PagedResult<PartnerGridViewDto>>> GetPagedPartners(PageDto pagedata, List<int>? statusId, bool? isVMApproved);
        Task<ApiResponseDto<PagedResult<DocumentDetailDto>>> GetPagedPartnerCapabilityDocuments(PageDto pagedata, int? partnerId);
        Task<ApiResponseDto<PagedResult<LabourHRQDetailDto>>> GetPagedHReqOpenList(PageDto pagedata, int? partnerId);
        Task<ApiResponseDto<IEnumerable<GetPartnerDto>>> GetPartners();
        Task<ApiResponseDto<GetPartnerDto>> GetPartner(int id);
        Task<ApiResponseDto<GetPartnerDto>> AddPartner(AddPartnerDto partner);
        Task<ApiResponseDto<string>> UpdatePartner(AddPartnerDto partner);
        Task<ApiResponseDto<string>> ChangePartnerStatus(ReIntiatePartnerDto dto);
        Task<ApiResponseDto<string>> ApproveOrRejectPartner(int partnerId, ApprovePartnerDto dto);
        Task<ApiResponseDto<string>> SubmitPartner(int partnerId);
        Task<ApiResponseDto<string>> UnfreezePartner(int partnerId, int? userId);

        Task<ApiResponseDto<PagedResult<GetPartnerDto>>> GetPagedPartnersWithPODetails(List<int> statusId, PageDto pageData);

        Task<ApiResponseDto<string>> UpdatePartnerEmpanelStatus(int? partnerId);

        Task<byte[]> ExportAllPartnersToExcel(PageDto pageData, List<int> statusId, bool? isVMApproved);

        Task<ApiResponseDto<PagedResult<MatrixDto>>> GetAllMatricesByStatus(CONTACT_MATRIX_STATUS status, PageDto pageData);

        Task<ApiResponseDto<PagedResult<SOWMatrix>>> GetAllSOWMatricesByStatus(CONTACT_MATRIX_STATUS status, PageDto pageData);

        Task<ApiResponseDto<string>> ApproveMatrix(ApproveMatrixDto dto);

        Task<ApiResponseDto<string>> ApproveSOWMatrix(ApproveMatrixDto dto);
        Task<ApiResponseDto<string>> AssignOpenHiringListToPartner(int partnerId, AssignOpenHiringListDto dto);
    }
}
