using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace EpicenterX.Application.Extensions
{
    public static class DateTimeExtensions
    {
        public static DateTime? ToIndiaLocalTime(this DateTime? utcDate)
        {
            if (!utcDate.HasValue)
                return null;

            var timeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            var fixedDateTime = DateTime.SpecifyKind(utcDate.Value, DateTimeKind.Utc);

            return TimeZoneInfo.ConvertTimeFromUtc(fixedDateTime, timeZone);
        }
    }

    public class UtcToLocalDateTimeConverter : ValueConverter<DateTime, DateTime>
    {
        public UtcToLocalDateTimeConverter(string timeZoneId)
            : base(
                v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(), // Save as UTC
                v => TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(v, DateTimeKind.Utc),
                                                     TimeZoneInfo.FindSystemTimeZoneById(timeZoneId))) // Read as Local
        {
        }
    }

    public class UtcToLocalNullableDateTimeConverter : ValueConverter<DateTime?, DateTime?>
    {
        public UtcToLocalNullableDateTimeConverter(string timeZoneId)
            : base(
                v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v.Value : v.Value.ToUniversalTime()) : v,
                v => v.HasValue
                    ? TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(v.Value, DateTimeKind.Utc),
                                                      TimeZoneInfo.FindSystemTimeZoneById(timeZoneId))
                    : v)
        {
        }
    }
}
