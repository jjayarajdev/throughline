namespace EpicenterX.Domain.Entities
{
    public class EmailNotifications : BaseIdentifier
    {
        public string? TemplateName { get; set; }
        public int? NotificationId { get; set; }
        public string? ToEmail { get; set; }
        public string? CCEmail { get; set; }
        public string? Subject { get; set; }
        public string? BodyHtml { get; set; }
        public bool? IsSent { get; set; }
        public string? ExternalReference { get; set; }
    }
}
