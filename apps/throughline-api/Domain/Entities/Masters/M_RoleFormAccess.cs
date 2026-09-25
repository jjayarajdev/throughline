namespace EpicenterX.Domain.Entities.Masters
{
    public class M_RoleFormAccess
    {
        public int RoleId { get; set; }
        public Role? Role { get; set; }
        public int FormId { get; set; }
        public M_Form? Form { get; set; }
        public bool? IsActive { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
