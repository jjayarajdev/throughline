namespace EpicenterX.Domain.Entities.Masters
{
    public class M_Form : BaseIdentifier
    {
        public string Name { get; set; } = string.Empty;

        public int ModuleId { get; set; }
        public M_Module? Module { get; set; }

        public ICollection<M_RoleFormAccess>? RoleFormAccesses { get; set; }
    }
}
