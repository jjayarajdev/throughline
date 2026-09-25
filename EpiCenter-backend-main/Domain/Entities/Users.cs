using System.ComponentModel.DataAnnotations;
using EpicenterX.Domain.Entities.PMS;

namespace EpicenterX.Domain.Entities
{
    public class Users
    {
        [Key]
        public int UserId { get; set; }

        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? PasswordHash { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? FullName { get; set; }
        public string? EmployeeId { get; set; }
        public DateTime? LastLogin { get; set; }
        public string? ProfilePictureURL { get; set; }
        public string? Bio { get; set; }
        public int? NameTypeId { get; set; }
        public bool? IsActive { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ICollection<UserRole>? UserRoles { get; set; }
    }
}
