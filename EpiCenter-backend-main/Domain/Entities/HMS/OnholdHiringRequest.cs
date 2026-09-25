using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.HMS
{
    public class OnholdHiringRequest : BaseIdentifier
    {
        public int? HiringRequestId { get; set; }
        public HiringRequest? HiringRequest { get; set; }

        public int? OnholdCategoryId { get; set; }
        public M_MasterData? OnholdCategory { get; set; }
        public DateTime? OnholdRequestedDate { get; set; }
        public int? OnholdRequestedByRoleId { get; set; }
        public Role? OnholdRequestedByRole { get; set; }
        public int? OnholdRaisedByUserId { get; set; }
        public Users? OnholdRaisedByUser { get; set; }


        public int? OnholdReasonId { get; set; }
        public M_MasterData? OnholdReason { get; set; }
        public string? OnholdComments { get; set; }
        public List<int>? FreezeCandidateTypes { get; set; }

        public int? ReviewStatusId { get; set; }
        public M_MasterData? ReviewStatus { get; set; }


        public int? OnHoldReviewedByUserId { get; set; }
        public Users? OnHoldReviewedByUser { get; set; }
     
        public DateTime? ReviewedDate { get; set; }
        public string? ReviewedComments { get; set; }
    }
}
