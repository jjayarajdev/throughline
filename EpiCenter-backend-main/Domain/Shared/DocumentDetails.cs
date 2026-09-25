using EpicenterX.Domain.Entities;

namespace EpicenterX.Domain.Shared
{
    public class DocumentDetails : BaseIdentifier
    {
        public string? AttachmentName { get; set; }
        public string? AttachmentURL { get; set; }

        public int? PartnerId { get; set; }
        public int? UploadBGVDocId { get; set; }
        public int? AdditionalDocId { get; set; }
        public int? DocType { get; set; }
        public int? PartnerEmpanelId { get; set; }
        public bool? MarkAsDeleted { get; set; }
    }
}
