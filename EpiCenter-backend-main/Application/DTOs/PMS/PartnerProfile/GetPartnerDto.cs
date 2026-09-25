using EpicenterX.Application.DTOs.PMS.ContactMatrix;
using EpicenterX.Application.DTOs.PMS.Engagement;
using EpicenterX.Application.DTOs.PMS.EscalationMatrix;
using EpicenterX.Application.DTOs.PMS.SOW;
using EpicenterX.Application.Extensions;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Enums;

namespace EpicenterX.Application.DTOs.PMS.PartnerProfile
{
    public class GetPartnerDto : BaseIdentifierDto
    {
        public int? ServicingCountryId { get; set; }
        public string? ServicingCountryName { get; set; }
        public int? PartnerCategoryId { get; set; }
        public string? PartnerCategoryName { get; set; }
        public string? PartnerCode { get; set; }  // Partner Id prefixed with PID000+ID
        public string? PartnerName { get; set; }
        public string? Nickname { get; set; }
        public int? PartnerStatusId { get; set; }
        public string? PartnerStatusName { get; set; }
        public DateTime? StartDate { get; set; }
        public int? CountryId { get; set; }
        public string? CountryName { get; set; }
        public int? StateId { get; set; }
        public string? StateName { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
        public string? Address { get; set; }
        public string? Pincode { get; set; }
        public List<int>? DomainIds { get; set; } // Foreign Key to M_Domain
        public List<int>? SubDomainIds { get; set; } // Foreign Key to M_SubDomain
        public List<int>? SkillIds { get; set; } // Foreign Key to M_Skill
        public string? SkillNames { get; set; }
        public string? DomainNames { get; set; }
        public string? SubDomainNames { get; set; }
        public List<DocumentDetailDto>? CapabilitiesDeckDocuments { get; set; }
        public int? ApprovedBy { get; set; }
        public string? ApproverName { get; set; }
        public string? ApproverEmail { get; set; }
        public bool? ApprovedStatus { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public int? PartnerTireId { get; set; }
        public string? PartnerTireName { get; set; }
        public string? EngagementTypeName { get; set; }
        public string? BusinessUnitName { get; set; }
        public List<GetContactMatrixDto>? ContactMatrices { get; set; }
        public List<GetEscalationMatrixDto>? EscalationMatrices { get; set; }
        public List<GetEngagementDto>? Engagements { get; set; }
        public List<GetSOWDto>? SOWs { get; set; }

        public bool? IsEmpaneled { get; set; }
        public bool? IsEngagementExpired { get; set; }
        public int? LatestEngagementId { get; set; }
        public int? ReintiatedByUserId { get; set; }
        public string? ReintiatedByUsername { get; set; }
        public string? ReintiatedComments { get; set; }
        public DateTime? ReintiatedOn { get; set; }
        public DateTime? LatestEngagementEvaluationEndDate { get; set; }
        public int? PartnerTenureInDays { get; set; }

    }
}
