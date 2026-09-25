using System.Linq.Expressions;
using EpicenterX.Application.DTOs;
using EpicenterX.Domain.Shared;
using LinqKit;

namespace EpicenterX.Application.Extensions.HelperMethods
{
    public class PaginationHelper
    {
        public static PagedResult<T> GetPagedResult<T>(PageDto pageData, IEnumerable<T> data) where T : class
        {
            ArgumentNullException.ThrowIfNull(data);
            ArgumentNullException.ThrowIfNull(pageData);
            ArgumentNullException.ThrowIfNull(pageData.PageSize);
            ArgumentNullException.ThrowIfNull(pageData.PageNumber);

            var predicate = PredicateBuilder.New<T>(x => true);

            if (!string.IsNullOrEmpty(pageData.SearchColumn) && !string.IsNullOrEmpty(pageData.SearchText))
            {
                var parameter = Expression.Parameter(typeof(T), "x");
                var property = Expression.Property(parameter, pageData.SearchColumn);

                var searchText = Expression.Constant(pageData.SearchText);
                var comparison = Expression.Constant(StringComparison.OrdinalIgnoreCase);

                var notNullCheck = Expression.NotEqual(property, Expression.Constant(null, typeof(string)));

                var indexOfMethod = typeof(string).GetMethod("IndexOf", new[] { typeof(string), typeof(StringComparison) });
                var indexOfCall = Expression.Call(property, indexOfMethod, searchText, comparison);

                var indexOfCheck = Expression.GreaterThanOrEqual(indexOfCall, Expression.Constant(0));

                var body = Expression.AndAlso(notNullCheck, indexOfCheck);

                var lambda = Expression.Lambda<Func<T, bool>>(body, parameter);

                predicate = predicate.And(lambda);

            }

            var filteredData = data.AsQueryable().Where(predicate);

            //Sorting
            IOrderedQueryable<T>? sortedQuery = null;
            if (pageData.SortColumns != null && pageData.SortColumns.Any())
            {
                foreach (var sortColumn in pageData.SortColumns)
                {
                    var parameter = Expression.Parameter(typeof(T), "x");
                    var property = Expression.Property(parameter, sortColumn.Column);
                    var lambda = Expression.Lambda<Func<T, object>>(
                        Expression.Convert(property, typeof(object)), parameter);

                    if (sortedQuery == null)
                    {
                        sortedQuery = sortColumn.Descending
                            ? filteredData.OrderByDescending(lambda)
                            : filteredData.OrderBy(lambda);
                    }
                    else
                    {
                        sortedQuery = sortColumn.Descending
                            ? sortedQuery.ThenByDescending(lambda)
                            : sortedQuery.ThenBy(lambda);
                    }
                }
            }

            var queryToPage = sortedQuery ?? filteredData;

            var totalItemCount = queryToPage.Count();

            var items = queryToPage
                .OrderByDescending(x => new[]
                {
                    typeof(T).GetProperty("CreatedAt")!.GetValue(x),
                    typeof(T).GetProperty("UpdatedAt")!.GetValue(x),
                    DateTime.MinValue
                }.Max())
                .Skip((pageData.PageNumber.Value - 1) * pageData.PageSize.Value)
                .Take(pageData.PageSize.Value)
                .ToList();

            return new PagedResult<T>(items, totalItemCount, pageData.PageSize!.Value, pageData.PageNumber!.Value);
        }

        public static IEnumerable<T> GetSortedResult<T>(IEnumerable<T> data, List<SortColumn>? sortColumns) where T : class
        {
            ArgumentNullException.ThrowIfNull(data);

            var query = data.AsQueryable();

            if (sortColumns != null && sortColumns.Any())
            {
                IOrderedQueryable<T>? sortedQuery = null;

                foreach (var sortColumn in sortColumns)
                {
                    var propInfo = typeof(T).GetProperty(sortColumn.Column);
                    if (propInfo == null) continue; // skip invalid column
                    var parameter = Expression.Parameter(typeof(T), "x");
                    var property = Expression.Property(parameter, sortColumn.Column);
                    var lambda = Expression.Lambda<Func<T, object>>(
                        Expression.Convert(property, typeof(object)), parameter);

                    if (sortedQuery == null)
                    {
                        sortedQuery = sortColumn.Descending
                            ? query.OrderByDescending(lambda)
                            : query.OrderBy(lambda);
                    }
                    else
                    {
                        sortedQuery = sortColumn.Descending
                            ? sortedQuery.ThenByDescending(lambda)
                            : sortedQuery.ThenBy(lambda);
                    }
                }

                query = sortedQuery ?? query;
            }
            return [.. query];
        }
    }
}
