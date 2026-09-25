using System.Text.Json.Serialization;

namespace EpicenterX.Application.DTOs
{
	public class BaseIdentifierDto
	{
		public int Id { get; set; }

		public bool? IsActive { get; set; }
		[JsonIgnore]
		public int? CreatedBy { get; set; }
		[JsonIgnore]
		public DateTime? CreatedAt { get; set; }
		[JsonIgnore]
		public int? UpdatedBy { get; set; }
		[JsonIgnore]
		public DateTime? UpdatedAt { get; set; }
	}
}
