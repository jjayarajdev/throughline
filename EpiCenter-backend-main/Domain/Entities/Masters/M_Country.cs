namespace EpicenterX.Domain.Entities.Masters
{
	public class M_Country : BaseIdentifier
	{
		public string? Name { get; set; }
		public string? CountryCode { get; set; }
		public int? PhoneMaxLength { get; set; }

        public List<M_State>?  States { get; set; }
    }
}
