using System.Data;

namespace EpicenterX.Domain.Shared.HelperClasses
{
    public class IntListTVP
    {
        public static DataTable CreateIntListTvp(IEnumerable<int> ids)
        {
            var table = new DataTable();
            table.Columns.Add("Id", typeof(int));

            foreach (var id in ids)
            {
                table.Rows.Add(id);
            }

            return table;
        }
    }
}
