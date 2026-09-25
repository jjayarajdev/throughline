namespace EpicenterX.Application.DTOs.Masters
{
    public class ModuleDto : BaseIdentifierDto
    {
        public string? Name { get; set; }
        public ICollection<FormDto>? Forms { get; set; }
    }
}
