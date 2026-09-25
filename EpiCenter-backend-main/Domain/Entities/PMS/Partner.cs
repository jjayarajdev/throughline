using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Domain.Entities.PMS
{
    public class Partner : BaseIdentifier
    {
        public int? PartnerCategoryId { get; set; }
        public M_MasterData? PartnerCategory { get; set; }

        public string? PartnerCode { get; set; }
        public string? PartnerName { get; set; }
        public string? Nickname { get; set; }
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
        public List<DocumentDetails>? CapabilitiesDeckDocuments { get; set; }
        public int? PartnerTireId { get; set; }
        public M_MasterData? PartnerTire { get; set; }


        public int? ApprovedBy { get; set; }
        public Users? Approver { get; set; }
        public bool? ApprovedStatus { get; set; }
        public DateTime? ApprovedDate { get; set; }


        public string? PartnerProfileURL { get; set; }
        public bool? IsEmailSent { get; set; }
        public bool? IsEmpaneledEnabled { get; set; }
        public M_Country? Country { get; set; }
        public M_State? State { get; set; }
        public M_City? City { get; set; }
        public M_MasterData? PartnerStatus { get; set; }

        public int? ServicingCountryId { get; set; }
        public M_Country? ServicingCountry { get; set; }

        public DateTime? LastActivatedDate { get; set; }
        public int? LastReinitiatedBy { get; set; }
        public string? LastReinitiatedByUserComments { get; set; }
        public Users? LastReinitiatedByUser { get; set; }

        public ICollection<ContactMatrix>? ContactMatrices { get; set; }
        public ICollection<EscalationMatrix>? EscalationMatrices { get; set; }
        public ICollection<Engagement>? Engagements { get; set; }
        public PartnerEmpanel? PartnerEmpanel { get; set; }
        public ICollection<SOW>? SOWs { get; set; }
        public ICollection<PartnerApprovalHistory>? PartnerApprovalHistory { get; set; }

    }
}
