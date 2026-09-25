namespace EpicenterX.Domain.Entities.HMS
{
    public class PanelHistory : BaseIdentifier
    {
        public int? RoundId { get; set; }
        public string? RoundName {  get; set; }
        public string? PanelNames { get; set; }
    }
}
