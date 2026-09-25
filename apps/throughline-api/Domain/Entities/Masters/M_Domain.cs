namespace EpicenterX.Domain.Entities.Masters
{
	public class M_Domain : BaseIdentifier
	{
		public string Name { get; set; } = string.Empty;
		public int? DomainManagerId { get; set; }
		public Users? DomainManager { get; set; }
    }
}
