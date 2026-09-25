namespace EpicenterX.Application.DTOs
{
    public class PageDto
    {
        public int? PageNumber { get; set; }
        public int? PageSize { get; set; }
        public string? SearchColumn { get; set; }
        public string? SearchText { get; set; }
        public List<SortColumn>? SortColumns { get; set; }
    }

    public class SortColumn
    {
        public string Column { get; set; }
        public bool Descending { get; set; }
    }

    public class MasterPageDto : PageDto
    {
        public int? MasterTypeId { get; set; }
        public int? DomainId { get; set; }
        public int? CountryId { get; set; }
        public int? StateId { get; set; }
        public bool? ActiveStatus { get; set; }
    }

    public class InterviewSlotScreeningPageDto : PageDto
    {
        public bool? IsSelf { get; set; }
        public bool? IsScreening { get; set; } = true;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class InterviewSlotListPageDto : PageDto
    {
        public int? SlotStatusTypeId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class InterviewFeedbackPendingListPageDto : PageDto
    {
        public bool? IsSelf { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class InterviewSelectedListPageDto : PageDto
    {
        public List<int>? IntakeStatusIds { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class CandidateListPageDto : PageDto
    {
        public List<int>? IntakeStatusIds { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class PartnerTalentPoolPageDto : PageDto
    {
        public List<int>? IntakeStatusIds { get; set; }
        public int? FinancialYear { get; set; }
        public int? QuarterId { get; set; }
    }

    public class CandidateAwaitingSlotListPageDto : PageDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class HiringListPageDto : PageDto
    {
        public List<int>? HiringStatusIds { get; set; }
        public bool? IsBin { get; set; }
        public bool? IsAssigned { get; set; }
        public bool? IsParent { get; set; }
        public int? TATDurationId { get; set; }
        public int? FinancialYear { get; set; }
        public int? QuarterId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IsApproved { get; set; }
    }

    public class PartnerHiringListPageDto : PageDto
    {
        public List<int>? HiringStatusIds { get; set; }
        public int? FinancialYear { get; set; }
        public int? QuarterId { get; set; }
    }

    public class CandidateExceptionsPageDto : PageDto
    {
        public int? CandidateExceptionStatusId { get; set; }
    }
}
