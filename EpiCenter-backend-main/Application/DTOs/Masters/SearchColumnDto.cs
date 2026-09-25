namespace EpicenterX.Application.DTOs.Masters
{
    public class GetSearchColumnDto
    {
        public string? Name { get; set; }
        public string? Value { get; set; }
    }

    public class AddSearchColumnDto : BaseIdentifierDto
    {
        public string? Name { get; set; }
        public string? Value { get; set; }
        public int? GridId { get; set; }
    }
}
