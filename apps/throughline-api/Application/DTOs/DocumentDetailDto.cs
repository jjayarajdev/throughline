namespace EpicenterX.Application.DTOs
{
    public class DocumentDetailDto
    {
        public int Id { get; set; }
        public string? AttachmentName { get; set; }
        public string? AttachmentURL { get; set; }
        public string? Name { get; set; }

        public DateOnly? CreatedDate { get; set; }
        public string? CreatedTime { get; set; }

        public int? DocType { get; set; }
        public int? PartnerId { get; set; }
        public int? UploadBGVDocId { get; set; }
        public int? AdditionalDocId { get; set; }
        public int? PartnerEmpanelId { get; set; }
        public bool? MarkAsDeleted { get; set; }
    }
}
