using EpicenterX.Domain.Entities;

namespace EpicenterX.Domain.Shared.HelperClasses
{
    public class RoleEntityRule : BaseIdentifier
    {
        public int RoleId { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public string ConditionExpression { get; set; } = string.Empty;
    }
}
