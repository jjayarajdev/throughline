using EpicenterX.Domain.Entities;

namespace EpicenterX.Domain.Shared.HelperClasses
{
    public class QuarterDateRange :BaseIdentifier
    {
        public int StartDay { get; set; }
        public int StartMonth { get; set; }
        public int EndDay { get; set; }
        public int EndMonth { get; set; }
    }
}
