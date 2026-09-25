using Microsoft.EntityFrameworkCore;
﻿using System.Linq.Expressions;
using System.Reflection;

namespace EpicenterX.Application.Extensions.HelperMethods
{
    public static class SearchExpressionHelper
    {
        public static Expression<Func<T, bool>> BuildSearchExpression<T>(string searchColumn, string searchText)
        {
            if (string.IsNullOrWhiteSpace(searchColumn))
                throw new ArgumentException("Search column cannot be null or empty.", nameof(searchColumn));

            var parameter = Expression.Parameter(typeof(T), "e");
            Expression body = BuildNestedExpression(parameter, typeof(T), searchColumn.Split('.'), 0, searchText);
            return Expression.Lambda<Func<T, bool>>(body, parameter);
        }

        private static string EscapeLike(string text) => text.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

        private static Expression BuildNestedExpression(Expression currentExpression, Type currentType, string[] pathParts, int index, string searchText)
        {
            var propName = pathParts[index];
            var propInfo = currentType.GetProperty(propName, BindingFlags.Public | BindingFlags.Instance);
            if (propInfo == null)
                throw new Exception($"Property '{propName}' not found in type '{currentType.Name}'");

            var nextExpression = Expression.Property(currentExpression, propInfo);
            var nextType = propInfo.PropertyType;

            bool isLast = (index == pathParts.Length - 1);

            // If it's a collection, we need to use Any
            if (typeof(System.Collections.IEnumerable).IsAssignableFrom(nextType) && nextType != typeof(string))
            {
                var elementType = nextType.IsGenericType
                    ? nextType.GetGenericArguments().FirstOrDefault()
                    : typeof(object); // fallback, though this should be rare

                if (elementType == null)
                    throw new Exception($"Cannot determine element type of collection property '{propName}'");

                var lambdaParam = Expression.Parameter(elementType, "x");

                Expression lambdaBody = BuildNestedExpression(lambdaParam, elementType, pathParts, index + 1, searchText);
                var anyLambda = Expression.Lambda(lambdaBody, lambdaParam);

                var anyMethod = typeof(Enumerable).GetMethods()
                    .First(m => m.Name == "Any" && m.GetParameters().Length == 2)
                    .MakeGenericMethod(elementType);

                return Expression.Call(anyMethod, nextExpression, anyLambda);
            }

            // If it's the last property and it's a string
            if (isLast)
            {
                if (nextType != typeof(string))
                    throw new Exception($"Search target property '{propName}' must be a string.");

                // Case-insensitive contains, translated to PostgreSQL ILIKE (SQL Server was case-insensitive by collation).
                // Only used on IQueryable (GenericRepository), so EF translates it; never evaluate this in memory.
                var pattern = Expression.Constant("%" + EscapeLike(searchText) + "%", typeof(string));
                var ilikeMethod = typeof(NpgsqlDbFunctionsExtensions).GetMethod(nameof(NpgsqlDbFunctionsExtensions.ILike), new[] { typeof(DbFunctions), typeof(string), typeof(string) })!;
                return Expression.Call(null, ilikeMethod, Expression.Constant(EF.Functions), nextExpression, pattern);
            }

            // Otherwise, go deeper
            return BuildNestedExpression(nextExpression, nextType, pathParts, index + 1, searchText);
        }
    }
}
