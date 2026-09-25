using EpicenterX.Domain.Entities.PMS;

namespace EpicenterX.Domain.Entities
{
    public class UserRole
    {
        public int? UserId { get; set; }
        public Users? User { get; set; }
        public int? RoleId { get; set; }
        public Role? Role { get; set; }
        public int? PartnerId { get; set; }
        public Partner? Partner { get; set; }
        public DateTime? AssignedAt { get; set; }
        public bool? IsActive { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
