namespace EpicenterX.Domain.Entities.PMS
{
	public class Notifications : BaseIdentifier
	{
        public int? UserId { get; set; }
        public string? Name { get; set; } // Partner Onboarded, PO Tracker, etc.
		public int? CategoryType { get; set; }
		public string? Participants { get; set; } // Vendor/HPE
		public string? Remark { get; set; }
		public bool? IsRead { get; set; }
    }
}
