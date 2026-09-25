using EpicenterX.Domain.Entities.Masters;

namespace EpicenterX.Application.DTOs.Masters
{
    public class RoleFormAccessDto
    {
        public int? RoleId { get; set; }
        public string? RoleName { get; set; }
        public int FormId { get; set; }
        public string? FormName { get; set; }

        public bool CanView { get; set; } = false;
        public bool CanCreate { get; set; } = false;
        public bool CanEdit { get; set; } = false;
        public bool CanDelete { get; set; } = false;
        public bool CanApprove { get; set; } = false;
        public bool CanReject { get; set; } = false;

    }
}
