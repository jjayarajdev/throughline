using System.ComponentModel.DataAnnotations;

namespace EpicenterX.Domain.Entities
{
	public class BaseIdentifier
	{
		[Key]
		public int Id { get; set; }
		public bool? IsActive { get; set; }
		public int? CreatedBy { get; set; }
		public DateTime? CreatedAt { get; set; }
		public int? UpdatedBy { get; set; }
		public DateTime? UpdatedAt { get; set; }
    }

    public class HistoryBaseIdentifier
    {
        public int Id { get; set; }
        public bool? IsActive { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
