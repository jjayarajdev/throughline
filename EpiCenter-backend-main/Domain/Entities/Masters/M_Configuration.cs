namespace EpicenterX.Domain.Entities.Masters
{
    public class M_Configuration : BaseIdentifier
    {
        public string? ConfigKey { get; set; }
        public string? ConfigValue { get; set; }
        public string? Description { get; set; }
    }
}
