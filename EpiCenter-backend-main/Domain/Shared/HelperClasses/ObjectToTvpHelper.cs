using System.Reflection;
using System.Data;
namespace EpicenterX.Domain.Shared.HelperClasses
{
    public static class ObjectToTvpHelper
    {
        public static DataTable ToDataTable<T>(IEnumerable<T> items, string tableName = null)
        {
            var dataTable = new DataTable(tableName ?? typeof(T).Name);

            // Get all public properties of T
            var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);

            foreach (var prop in properties)
            {
                var propType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
                dataTable.Columns.Add(prop.Name, propType);
            }

            foreach (var item in items)
            {
                var values = new object[properties.Length];
                for (int i = 0; i < properties.Length; i++)
                {
                    values[i] = properties[i].GetValue(item) ?? DBNull.Value;
                }
                dataTable.Rows.Add(values);
            }

            return dataTable;
        }
    }
}
