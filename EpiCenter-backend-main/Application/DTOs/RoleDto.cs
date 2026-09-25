using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Application.DTOs
{
    public class RoleDto
    {
        public int RoleId { get; set; }
        public string? RoleName { get; set; }
        public bool? IsActive { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ICollection<UserRoleDto>? UserRoles { get; set; }
        public ICollection<M_RoleFormAccess>? RoleFormAccesses { get; set; }
    }
}
