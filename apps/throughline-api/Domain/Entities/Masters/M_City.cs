namespace EpicenterX.Domain.Entities.Masters
{
	public class M_City : BaseIdentifier
	{
		public string? Name { get; set; }
		public int? StateId { get; set; }
        public M_State? State { get; set; }

    }
}
