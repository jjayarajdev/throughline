namespace EpicenterX.Domain.Entities.Masters
{
    public class M_SearchColumn : BaseIdentifier
    {
        public string? Name { get; set; }
        public string? Value { get; set; }
        public int? GridId { get; set; }

        public bool? IsPartner {  get; set; }
    }
}
