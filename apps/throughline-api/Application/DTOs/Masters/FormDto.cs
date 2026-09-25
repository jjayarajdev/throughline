namespace EpicenterX.Application.DTOs.Masters
{
    public class FormDto : BaseIdentifierDto
    {
        public string? Name { get; set; }
        public int ModuleId { get; set; }
        public string? ModuleName { get; set; }
    }
}
