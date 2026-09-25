using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.HMS
{
    public class JobDetails : BaseIdentifier
    {
        public string? JobDescription { get; set; }
        //public int? JDDocumentId { get; set; }
        //public DocumentDetails? JDDocument { get; set; }
        public int? HiringActivityId { get; set; }
        public M_MasterData? HiringActivity { get; set; }
        public int? JobPriorityId { get; set; }
        public M_MasterData? JobPriority { get; set; }
        public DateTime? HiringDate { get; set; }
        public int? ResourceTypeId { get; set; } // Badged, Third Party, etc.
        public M_MasterData? ResourceType { get; set; }
        public int? BadgeRecId { get; set; }

        public string? JobLocation { get; set; }

        public int? SubDomainId { get; set; }
        public M_SubDomain? SubDomain { get; set; }

        public List<int>? PrimarySkills { get; set; }
        public List<int>? SecondarySkills { get; set; }
        public int? MandatoryCertificationId { get; set; }
        public string? MandatoryCertification { get; set; }
        public int? JobLevelId { get; set; }
        public M_MasterData? JobLevel { get; set; }
        public int RelevantExperience { get; set; }
        public int TotalExperience { get; set; }
        public int? CountryId { get; set; }
        public M_Country? Country { get; set; }

        public List<int>? StateIds { get; set; }
        public List<int>? PrimaryCityIds { get; set; }
        public List<int>? SecondaryCityIds { get; set; }


        public int? HiringRequestId { get; set; } // Foreign Key
        public HiringRequest? HiringRequest { get; set; }
    }
}
