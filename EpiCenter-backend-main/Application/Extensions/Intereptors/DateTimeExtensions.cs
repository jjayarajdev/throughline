using Microsoft.EntityFrameworkCore.Diagnostics;

namespace EpicenterX.Application.Extensions.Intereptors
{
    public class UtcToLocalInterceptor : IMaterializationInterceptor
    {
        private readonly TimeZoneInfo _tz;

        public UtcToLocalInterceptor(string tzId)
        {
            _tz = TimeZoneInfo.FindSystemTimeZoneById(tzId);
        }

        public object InitializedInstance(MaterializationInterceptionData materializationData, object entity)
        {
            foreach (var prop in entity.GetType().GetProperties())
            {
                if (prop.PropertyType == typeof(DateTime))
                {
                    var value = (DateTime)prop.GetValue(entity)!;
                    var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(value, DateTimeKind.Utc), _tz);
                    local = DateTime.SpecifyKind(local, DateTimeKind.Local);
                    prop.SetValue(entity, local);
                }
                else if (prop.PropertyType == typeof(DateTime?))
                {
                    var value = (DateTime?)prop.GetValue(entity);
                    if (value.HasValue)
                    {
                        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(value.Value, DateTimeKind.Utc), _tz);
                        local = DateTime.SpecifyKind(local, DateTimeKind.Local);
                        prop.SetValue(entity, local);
                    }
                }
            }
            return entity;
        }
    }
}