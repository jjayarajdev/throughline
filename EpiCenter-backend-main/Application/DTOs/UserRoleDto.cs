namespace EpicenterX.Application.DTOs
{
    public class UserRoleDto
    {
        public int? UserId { get; set; }
        public string? FullName { get; set; }
        public int? RoleId { get; set; }
        public string? RoleName { get; set; }
        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public DateTime? AssignedAt { get; set; }
        public string? Email { get; set; }
        public bool? IsActive { get; set; }
    }

    public class UserRoleGridDto
    {
        public int? UserId { get; set; }
        public string? FullName { get; set; }
        public int? RoleId { get; set; }
        public string? RoleName { get; set; }
        public int? PartnerId { get; set; }
        public string? PartnerName { get; set; }
        public DateTime? AssignedAt { get; set; }
        public string? Email { get; set; }

        public string? DomainNames { get; set; }
        public string? SubDomainNames { get; set; }

        public bool? IsActive { get; set; }
    }
}
