namespace EpicenterX.Domain.Entities.Masters
{
    public class M_MasterData : BaseIdentifier
    {
        public string? Name {  get; set; }
        public int? OrderId { get; set; }
        public int? MasterTypeId { get; set; }
        public int? DefaultExperience { get; set; }
        public int? ExperienceRange { get; set; }
        public List<int?>? RoundNameIds { get; set; }

        public int? SectionId { get; set; }
    }
}
