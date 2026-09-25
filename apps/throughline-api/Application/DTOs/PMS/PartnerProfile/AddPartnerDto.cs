using EpicenterX.Application.Extensions;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Enums;

namespace EpicenterX.Application.DTOs.PMS.PartnerProfile
{
    public class AddPartnerDto : BaseIdentifierDto
    {
        [ValidateStatus(Type = MASTER_TYPE.PARTNER_CATEGORY)]
        public int? PartnerCategoryId { get; set; }
        public int? ServicingCountryId { get; set; }
        public string? PartnerName { get; set; }
        public string? Nickname { get; set; }

        [ValidateStatus(Type = MASTER_TYPE.PARTNER_STATUS)]
        public int? PartnerStatusId { get; set; }
        public DateTime? StartDate { get; set; }
        public int? CountryId { get; set; }
        public int? StateId { get; set; }
        public int? CityId { get; set; }
        public string? Address { get; set; }
        public string? Pincode { get; set; }
        public List<int>? DomainIds { get; set; }
        public List<int>? SubDomainIds { get; set; }
        public List<int>? SkillIds { get; set; }
        public int? CapabilitiesDeckId { get; set; }
        public List<DocumentDetailDto>? CapabilitiesDeckDocuments { get; set; }
        public int? ApprovedBy { get; set; }
        public bool? ApprovedStatus { get; set; }
        public int? PartnerTireId { get; set; }
    }

    public class ApprovePartnerDto 
    {
        public int? ApprovedBy { get; set; }
        public bool? ApprovedStatus { get; set; }
        public bool? IsReintiated { get; set; }
        public string? Comments { get; set; }
    }

    public class ReIntiatePartnerDto
    {
        public int? PartnerId { get; set; }
        public bool? IsExtendedEvaluation { get; set; }
        public int? PartnerStatusId { get; set; }
        public int? EngagementId { get; set; }
        public DateTime? ExtendedEvaluationDate { get; set; }
        public string? Comments { get; set; }
    }
}
