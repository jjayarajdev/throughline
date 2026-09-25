using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Domain.Entities;

namespace EpicenterX.Application.Extensions.HelperMethods
{
    public interface IApplicationUtilities
    {
        DateTime? GetLocalTime(DateTime? createdAt);
        DateTime GetUtcDateTime(DateTime? dateTime);
        int CalculateTatDays(DateTime tatStartDate, DateTime? tatEndDate = null);
    }

    public class ApplicationUtilities : IApplicationUtilities
    {

        public int CalculateTatDays(DateTime tatStartDate, DateTime? tatEndDate = null)
        {
            // if end date is null, use current UTC time
            DateTime utcEndDate = tatEndDate ?? DateTime.UtcNow;

            // convert both dates to local timezone
            DateTime localStart = tatStartDate.ToLocalTime();
            DateTime localEnd = utcEndDate.ToLocalTime();

            // calculate difference in days
            int days = (localEnd.Date - localStart.Date).Days;

            return days < 0 ? 0 : days; // avoid negative days
        }


        public DateTime? GetLocalTime(DateTime? createdAt)
        {
            if (!createdAt.HasValue)
                return null;
            TimeZoneInfo kolkataTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            var fixedDateTime = DateTime.SpecifyKind(createdAt.Value, DateTimeKind.Utc);
            DateTime localCreatedAt = TimeZoneInfo.ConvertTimeFromUtc(fixedDateTime, kolkataTimeZone);
            return localCreatedAt;
        }

        public DateTime GetUtcDateTime(DateTime? dateTime)
        {
            if (dateTime.HasValue)
            {
                return TimeZoneInfo.ConvertTimeToUtc(dateTime.Value);
            }

            return DateTime.UtcNow;
        }
    }
}
