using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs.HMS.JobDetails
{
	public class AddJobDetailsDto : BaseIdentifierDto
	{
        public string? JobDescription { get; set; }
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.HIRING_ACTIVITY_TYPE)]
        public int? HiringActivityId { get; set; }
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.JOB_PRIORITY)]
        public int? JobPriorityId { get; set; }
        public DateTime? HiringDate { get; set; }
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.JOB_LEVEL)]
        public int? JobLevelId { get; set; }
        public int RelevantExperience { get; set; }
        public int TotalExperience { get; set; }
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.RESOURCE_TYPE)]
        public int? ResourceTypeId { get; set; }
        public int? BadgeRecId { get; set; }

        public int? CountryId { get; set; }

        public string? JobLocation { get; set; }

        public int? SubDomainId { get; set; }

        public DocumentDetailDto? UploadedJD { get; set; }
        public List<int>? PrimarySkills { get; set; }
        public List<int>? SecondarySkills { get; set; }
        public string? MandatoryCertification { get; set; } // File Path


        public List<int>? StateIds { get; set; }
        public List<int>? PrimaryCityIds { get; set; }
        public List<int>? SecondaryCityIds { get; set; }

        public int HiringRequestId { get; set; } // Foreign Key
    }
}
