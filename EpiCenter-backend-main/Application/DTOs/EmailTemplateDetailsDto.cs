namespace EpicenterX.Application.DTOs
{
    public class EmailTemplateDetailsDto : BaseIdentifierDto
    {
        public string? TemplateName { get; set; }
        public string? Subject { get; set; }
        public string? BodyHtml { get; set; }
        public int? NotificationId { get; set; }
    }
}