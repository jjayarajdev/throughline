namespace EpicenterX.Domain.Entities.Masters
{
	public class M_SubDomain : BaseIdentifier
	{ 
		public string? Name { get; set; }
		public int? DomainId { get; set; }
        public int? SubDomainManagerId { get; set; }
        public Users? SubDomainManager { get; set; }

        public M_Domain? Domain { get; set; }

    }
}
