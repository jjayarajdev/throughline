namespace EpicenterX.Application.DTOs
{
    public class UserDto : BaseIdentifierDto
    {
        public int? UserId { get; set; }
        public string? FullName { get; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? EmployeeId { get; set; }
        public string? UserName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public int? RoleId { get; set; }
        public string? RoleNames { get; set; }
    }

    public class EmployeeDto : BaseIdentifierDto
    {
        public string? FullName { get; }
        public string? Email { get; set; }
        public string? EmployeeCode { get; set; }
    }
}
