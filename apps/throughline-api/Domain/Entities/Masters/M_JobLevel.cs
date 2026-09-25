namespace EpicenterX.Domain.Entities.Masters
{
    public class M_JobLevel : BaseIdentifier
    {
        public string? Name { get; set; }
        public string? ShortName { get; set; }
        public int? DefaultExperience { get; set; }
        public int? ExperienceRange { get; set; }
        public decimal? StandardRate { get; set; }
        public decimal? INRStandardRate { get; set; }
        public decimal? ETRate { get; set; }
        public decimal? INRETRate { get; set; }
        public int? OrderId { get; set; }

    }
}
