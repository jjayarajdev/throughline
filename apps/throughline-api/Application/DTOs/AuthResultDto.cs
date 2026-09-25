namespace EpicenterX.Application.DTOs
{
    public class AuthResultDto
    {
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public List<DropdownDto>? Roles { get; set; }
        public int? UserId { get; set; }
        public int? PartnerId { get; set; }
        public string? UserName { get; set; }
        public string? PartnerName { get; set; }
        public string? Email { get; set; }
        public string? WindowsUserName { get; set; }
    }
}
