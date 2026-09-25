using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Domain.Entities.PMS
{
	public class EscalationMatrix : BaseIdentifier
	{
		public int? ContactTypeId { get; set; }
        public M_MasterData? EscalationMatrixType { get; set; }
		public string? Name { get; set; }
        public int? CountryId { get; set; }
        public M_Country? Country { get; set; }
		public string? ContactNumber { get; set; }  
        public string? Email { get; set; }
		public string? Designation { get; set; }
		public int? StatusId { get; set; }
        public M_MasterData? Status { get; set; }
        public int? PartnerId { get; set; } // Foreign Key
        public Partner? Partner { get; set; }
        public int ApprovalStatusId { get; set; }
    }
}
