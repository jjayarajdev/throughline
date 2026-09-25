namespace EpicenterX.Application.DTOs
{
    public class MasterDto : BaseDetailsDto
    {
        public int? OrderId { get; set; }
        public int? MasterTypeId { get; set; }
        public int? ParentMasterTypeId { get; set; }
        public int? StateId { get; set; }
        public int? CountryId { get; set; }
        public string? CountryCode { get; set; }
        public int? PhoneMaxLength { get; set; }
        public List<int>? DomainIds { get; set; }
        public int? DomainId { get; set; }
        
        public int? DomainManagerId { get; set; }
        public int? SubDomainManagerId { get; set; }
        public string? DomainManagerName { get; set; }
        public string? SubDomainManagerName { get; set; }
        public string? PartnerCode { get; set; }
        public string? Email { get; set; }
        public int? OptionId { get; set; }

        public bool? IsPrimary { get; set; }
        public bool? IsRecommended { get; set; }
        public string? HrqId { get; set; }

        public int? RoundNameId { get; set; }
        public int? SectionId { get; set;}


        public int? DefaultExperience { get; set; }
        public int? ExperienceRange { get; set; }
        public decimal? StandardRate { get; set; }
        public decimal? INRStandardRate { get; set; }
        public decimal? ETRate { get; set; }
        public decimal? INRETRate { get; set; }
    }

    public class GetMasterDto : BaseDetailsDto
    {
        public int? OrderId { get; set; }
        public int? MasterTypeId { get; set; }
        public int? ParentMasterTypeId { get; set; }
        public int? StateId { get; set; }
        public int? CountryId { get; set; }
        public string? CountryCode { get; set; }
        public List<int>? DomainIds { get; set; }
        public int? DomainId { get; set; }
        public int? DefaultExperience { get; set; }
        public int? ExperienceRange { get; set; }
        public int? DomainManagerId { get; set; }
        public int? SubDomainManagerId { get; set; }
        public string? DomainManagerName { get; set; }
        public string? SubDomainManagerName { get; set; }
        public string? PartnerCode { get; set; }
        public string? Email { get; set; }
        public int? OptionId { get; set; }

        public bool? IsPrimary { get; set; }
        public bool? IsRecommended { get; set; }
        public string? HrqId { get; set; }

        public int? RoundNameId { get; set; }
        public int? SectionId { get; set; }
    }
}
