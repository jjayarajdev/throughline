namespace EpicenterX.Domain.Entities.HMS
{
    public class PartnerHrqsGrid
    {
        public int HiringRequestId { get; set; }
        public string? HrqId { get; set; }
        public bool? IsProxyPartner { get; set; }
        public string? JobTitle { get; set; }
        public int PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public string? PartnerCode { get; set; }
        public int BusinessId { get; set; }
        public string? BusinessName { get; set; }
        public DateTime? PartnerAssignedDate { get; set; }
        public int? RMOwnerId { get; set; }
        public string? RMOwnerName { get; set; }
        public int? HiringStatusId { get; set; }
        public string? HiringStatusName { get; set; }
        public int? NumberOfPositions { get; set; }
        public int? JobPriorityId { get; set; }
        public string? JobPriorityName { get; set; }
        public int? CurrentStatusHeadCount { get; set; }

    }
}
