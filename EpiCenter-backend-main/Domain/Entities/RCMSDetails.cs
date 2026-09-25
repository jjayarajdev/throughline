namespace EpicenterX.Domain.Entities
{
    public class RCMSDetails : BaseIdentifier
    {
        public string? ProjectId { get; set; }
        public string? JobTitle { get; set; }
        public string? ProjectName { get; set; }
        public string? RcMsResourceRequestId { get; set; }
        public DateTime? RequestStartDate { get; set; }
        public int? HiringManagerId { get; set; }
        public Users? HiringManager { get; set; }

    }
}
