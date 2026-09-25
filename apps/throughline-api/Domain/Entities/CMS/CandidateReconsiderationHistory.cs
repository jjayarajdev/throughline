using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.CMS
{
    public class CandidateReconsiderationHistory : BaseIdentifier
    {
        public int CandidateId { get; set; }
        public int? HiringRequestId { get; set; }
        public int? LastInterviewSlotId { get; set; }
        public int? ReconsideredByUserId { get; set; }
        public DateTime? ReconsideredOn { get; set; }
        public int? ReconsiderReasonId { get; set; }
        public M_MasterData? ReconsiderReason { get; set; }
        public string? ReconsiderComments { get; set; }
    }
}
