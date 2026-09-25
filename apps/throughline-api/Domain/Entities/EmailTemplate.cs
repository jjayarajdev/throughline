namespace EpicenterX.Domain.Entities
{
    public class EmailTemplate : BaseIdentifier
    {
        public string? TemplateName { get; set; }
        public string? Subject { get; set; }
        public string? BodyHtml { get; set; }
        public int? NotificationId { get; set; }
    }
}