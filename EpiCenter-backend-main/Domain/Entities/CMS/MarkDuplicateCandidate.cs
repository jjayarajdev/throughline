namespace EpicenterX.Domain.Entities.CMS
{
    public class MarkDuplicateCandidate 
    {
        public bool? IsDuplicate { get; set; }
        public string? ExistingCandidateCode { get; set; }
        public bool? AllowToUpdate { get; set; }
    }
}
