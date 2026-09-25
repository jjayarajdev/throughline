using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.CMS.InterviewSlot;
using EpicenterX.Application.DTOs.HMS.HiringRequest;

namespace EpicenterX.Application.DTOs.HMS
{
    public class HiringProfileDto
    {
        public GetHiringRequestDto? HiringDetails { get; set; }
        public List<PartnerContibutions>? PartnerContributions { get; set; }
        public List<GetCandidateDto>? SelectedTalents { get; set; }
        public List<GetCandidateDto>? TalentPipeline { get; set; }
        public List<GetCandidateDto>? TalentBench { get; set; }
        public List<GetCandidateDto>? FreezedCandidates { get; set; }
        public List<GetCandidateDto>? DroppedCandidates { get; set; }
        public List<GetCandidateDto>? RejectedCandidates { get; set; }
        public IEnumerable<GetInterviewSlotDto>? UpcomingInterviews { get; set; }
        public List<GetCandidateDto>? SlotAllocations { get; set; }
    }

    public class PartnerContibutions
    {
        public int PartnerId { get; set; }
        public string? PartnerCode { get; set; }
        public string? PartnerName { get; set; }
        public string? Nickname { get; set; }
        public int? Contributions { get; set; }
    }
}
