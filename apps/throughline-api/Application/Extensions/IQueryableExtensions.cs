
using System.Linq.Expressions;
using System.Reflection;
using EpicenterX.Application.DTOs;


namespace EpicenterX.Application.Extensions
{
    public static class IQueryableExtensions
    {
        public static IOrderedQueryable<T> OrderByMultiple<T>(
            this IQueryable<T> source,
            List<SortColumn> sortColumns)
        {
            if (!sortColumns.Any())
                return (IOrderedQueryable<T>)source;

            IOrderedQueryable<T>? orderedQuery = null;

            for (int i = 0; i < sortColumns.Count; i++)
            {
                var sortColumn = sortColumns[i];
                var type = typeof(T);
                var property = type.GetProperty(sortColumn.Column, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                if (property == null) continue; // ignore invalid columns

                var parameter = Expression.Parameter(type, "x");
                var propertyAccess = Expression.MakeMemberAccess(parameter, property);
                var orderByExpression = Expression.Lambda(propertyAccess, parameter);

                string methodName;
                if (i == 0)
                    methodName = sortColumn.Descending ? "OrderByDescending" : "OrderBy";
                else
                    methodName = sortColumn.Descending ? "ThenByDescending" : "ThenBy";

                var resultExpression = Expression.Call(
                    typeof(Queryable),
                    methodName,
                    new Type[] { type, property.PropertyType },
                    (orderedQuery ?? source).Expression,
                    Expression.Quote(orderByExpression));

                orderedQuery = (IOrderedQueryable<T>)(source.Provider.CreateQuery<T>(resultExpression));
            }

            return orderedQuery!;
        }
    }

}
