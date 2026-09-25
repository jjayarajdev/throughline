using EpicenterX.Application.Extensions;

namespace EpicenterX.Application.DTOs
{
	public class NotificationDto : BaseIdentifierDto
	{
		public string? Name { get; set; } // Partner Onboarded, PO Tracker, etc.
        [ValidateStatus(Type = Domain.Enums.MASTER_TYPE.EMAIL_CATEGORY)]
		public int? CategoryType { get; set; }
        public string? Participants { get; set; } // Vendor/HPE
		public string? Remark { get; set; }
		public int? UserId{ get; set; }
    }
}
