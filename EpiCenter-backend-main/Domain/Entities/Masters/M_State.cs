namespace EpicenterX.Domain.Entities.Masters
{
	public class M_State : BaseIdentifier
	{
		public string? Name { get; set; }
		public int? CountryId { get; set; }
		public List<M_City>? Cities { get; set; }
		public M_Country? Country { get; set; }
    }
}
