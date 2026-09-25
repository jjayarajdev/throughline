using System.Reflection;
using EFCore.BulkExtensions;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.Extensions;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Domain.Shared;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Infrastructure.Repositories
{
    public class GenericRepository<T>(AppDBContext _context) : IGenericRepository<T> where T : class
    {
        private readonly DbSet<T> _dbSet = _context.Set<T>();

        public async Task<int> GetCountAsync(Func<IQueryable<T>, IQueryable<T>>? includeQuery = null)
        {
            var query = _dbSet.AsQueryable();

            if (includeQuery != null)
                query = includeQuery(query);

            return await query.CountAsync();
        }

        public async Task<PagedResult<TResult>> GetPaginatedListWithJoinQueryAsync<TResult>(
                        PageDto pageData,
                        Func<IQueryable<T>, IQueryable<TResult>> joinQuery)
        {
            var query = _dbSet.AsQueryable();

            if (!string.IsNullOrEmpty(pageData?.SearchColumn) && !string.IsNullOrEmpty(pageData?.SearchText))
            {
                var predicate = SearchExpressionHelper.BuildSearchExpression<T>(pageData.SearchColumn, pageData.SearchText);
                query = query.Where(predicate);
            }

            var projectedQuery = joinQuery(query.AsNoTracking());

            if (pageData != null && pageData.SortColumns != null && pageData.SortColumns.Any())
            {
                var sortedQuery = projectedQuery.OrderByMultiple(pageData.SortColumns);
                projectedQuery = sortedQuery != null ? sortedQuery : projectedQuery;
            }

            var totalCount = await projectedQuery.CountAsync();

            if (pageData != null && pageData.PageNumber.HasValue && pageData.PageSize.HasValue)
            {
                projectedQuery = projectedQuery
                    .Skip((pageData.PageNumber.Value - 1) * pageData.PageSize.Value)
                    .Take(pageData.PageSize.Value);
            }

            var items = await projectedQuery.ToListAsync();

            return new PagedResult<TResult>(items, totalCount, pageData.PageSize ?? 0, pageData.PageNumber ?? 0);
        }


        public async Task<PagedResult<T>> GetPaginatedListAsync(PageDto pageData, Func<IQueryable<T>, IQueryable<T>>? includeQuery = null, string type = "")
        {
            var query = _dbSet.AsQueryable();

            if (includeQuery != null)
                query = includeQuery(query);

            query = query.OrderByDescending(e =>
                    EF.Property<DateTime>(e, "UpdatedAt") > EF.Property<DateTime>(e, "CreatedAt") ?
                    EF.Property<DateTime>(e, "UpdatedAt") : EF.Property<DateTime>(e, "CreatedAt"))
                    .ThenByDescending(e => EF.Property<int>(e, $"{type}Id"));

            if (!string.IsNullOrEmpty(pageData.SearchColumn) && !string.IsNullOrEmpty(pageData.SearchText))
            {
                var predicate = SearchExpressionHelper.BuildSearchExpression<T>(pageData.SearchColumn, pageData.SearchText);
                query = query.Where(predicate);
            }

            int totalCount = await query.CountAsync();

            if (pageData != null && pageData.PageNumber != null && pageData.PageSize != null)
            {
                query = query.Skip((pageData.PageNumber!.Value - 1) * pageData.PageSize!.Value)
                             .Take(pageData.PageSize!.Value);
            }

            var items = await query
                .AsNoTracking()
                .ToListAsync();

            return new PagedResult<T>(items, totalCount, pageData.PageSize ?? 0, pageData.PageNumber ?? 0);
        }

        public async Task<IEnumerable<T>> GetListAsync(string type = "", bool defaultOrder = true)
        {
            var query = _dbSet.AsQueryable().AsNoTracking();

            if (defaultOrder == true)
            {
                query = query
                  .OrderByDescending(e => EF.Property<DateTime>(e, "UpdatedAt") > EF.Property<DateTime>(e, "CreatedAt") ? EF.Property<DateTime>(e, "UpdatedAt") : EF.Property<DateTime>(e, "CreatedAt"))
                  .ThenByDescending(e => EF.Property<int>(e, $"{type}Id"));
            }

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<TResult>> GetListWithJoinAsync<TResult>(
                       Func<IQueryable<T>, IQueryable<TResult>> joinQuery, string type = "", bool defaultOrder = true)
        {
            var query = _dbSet.AsQueryable();
            if (defaultOrder == true)
            {
                query = query.OrderByDescending(e =>
                    EF.Property<DateTime>(e, "UpdatedAt") > EF.Property<DateTime>(e, "CreatedAt") ?
                    EF.Property<DateTime>(e, "UpdatedAt") : EF.Property<DateTime>(e, "CreatedAt"))
                    .ThenByDescending(e => EF.Property<int>(e, $"{type}Id"));
            }
            var projectedQuery = joinQuery(query.AsNoTracking());

            var items = await projectedQuery.ToListAsync();

            return items;
        }

        public async Task<IEnumerable<T>> GetListAsync(Func<IQueryable<T>, IQueryable<T>> includeQuery, string type = "", bool defaultOrder = true)
        {
            IQueryable<T> query = _dbSet;

            query = includeQuery(query);

            //if (defaultOrder == true)
            //{
            //    query = query.OrderByDescending(e =>
            //        EF.Property<DateTime>(e, "UpdatedAt") > EF.Property<DateTime>(e, "CreatedAt") ?
            //        EF.Property<DateTime>(e, "UpdatedAt") : EF.Property<DateTime>(e, "CreatedAt"))
            //        .ThenByDescending(e => EF.Property<int>(e, $"{type}Id"));
            //}

            return await query.AsNoTracking().ToListAsync();
        }

        public async Task<T> GetAsync(int? id, string type = "")
        {
            var result = await _dbSet.AsNoTracking().FirstOrDefaultAsync(e => EF.Property<int>(e, $"{type}Id") == id);

            return result!;
        }

        public async Task<T> GetAsync(Func<IQueryable<T>, IQueryable<T>>? includeQuery = null)
        {
            IQueryable<T> query = _dbSet;

            if (includeQuery != null)
                query = includeQuery(query);

            var result = await query.AsNoTracking().FirstOrDefaultAsync();

            return result!;
        }

        public async Task<TResult> GetItemWithJoinAsync<TResult>(Func<IQueryable<T>, IQueryable<TResult>> joinQuery,
                                                                    string type = "") where TResult : class, new()
        {
            var query = _dbSet.AsQueryable();

            // Apply projection
            var projectedQuery = joinQuery(query.AsNoTracking());

            // Get the first item
            var item = await projectedQuery.FirstOrDefaultAsync();

            // Return new TResult if null (requires TResult : new())
            return item ?? new TResult();
        }

        public async Task<T> AddAsync(T entity)
        {
            //// Check if the entity is already being tracked
            //var existingEntity = _context.Set<T>().Local
            //    .FirstOrDefault(e => EF.Property<int>(e, "Id") == EF.Property<int>(entity, "Id"));

            //if (existingEntity != null)
            //{
            //    // Detach the existing tracked entity
            //    _context.Entry(existingEntity).State = EntityState.Detached;
            //}

            await _dbSet.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(T entity, bool updateChildren = true)
        {
            _dbSet.Entry(entity).State = EntityState.Modified;
            _dbSet.Update(entity);
            if (updateChildren)
                UpdateChildrenState(entity);
            await _context.SaveChangesAsync();
        }

        private void UpdateChildrenState(object entity)
        {
            var entry = _context.Entry(entity);

            // Determine and set state based on primary key
            var primaryKey = entry.Metadata.FindPrimaryKey();
            var keyProperty = primaryKey!.Properties.First();
            var keyValue = entry.Property(keyProperty.Name).CurrentValue;

            if (keyValue == null || keyValue.Equals(Activator.CreateInstance(keyProperty.ClrType)))
            {
                entry.State = EntityState.Added;
            }
            else
            {
                entry.State = EntityState.Modified;
            }

            foreach (var navigation in entry.Navigations)
            {
                if (navigation.CurrentValue is IEnumerable<object> children)
                {
                    foreach (var child in children)
                    {
                        UpdateChildrenState(child); // Recursively update children
                    }
                }
                else if (navigation.CurrentValue != null)
                {
                    UpdateChildrenState(navigation.CurrentValue);
                }
            }
        }

        //public async Task UpdateAsync(T entity, bool updateChildren = true)
        //{
        //    if (entity == null)
        //        throw new ArgumentNullException(nameof(entity));

        //    _dbSet.Attach(entity); // Attach without assuming it's modified yet

        //    if (updateChildren)
        //    {
        //        UpdateChildrenState(entity);
        //    }
        //    else
        //    {
        //        _context.Entry(entity).State = EntityState.Modified;
        //    }

        //    await _context.SaveChangesAsync();
        //}

        //private void UpdateChildrenState(object entity)
        //{
        //    var entry = _context.Entry(entity);

        //    // Detect if it's new or existing based on primary key
        //    var key = entry.Metadata.FindPrimaryKey();
        //    if (key != null)
        //    {
        //        var keyProperty = key.Properties.First();
        //        var keyValue = entry.Property(keyProperty.Name).CurrentValue;

        //        bool isDefault = keyValue == null || keyValue.Equals(Activator.CreateInstance(keyProperty.ClrType));

        //        entry.State = isDefault ? EntityState.Added : EntityState.Modified;
        //    }

        //    // Handle navigation properties recursively
        //    foreach (var navigation in entry.Navigations)
        //    {
        //        if (navigation.Metadata.IsCollection)
        //        {
        //            if (navigation.CurrentValue is IEnumerable<object> children)
        //            {
        //                foreach (var child in children)
        //                {
        //                    if (child != null)
        //                        UpdateChildrenState(child);
        //                }
        //            }
        //        }
        //        else
        //        {
        //            if (navigation.CurrentValue != null)
        //            {
        //                UpdateChildrenState(navigation.CurrentValue);
        //            }
        //        }
        //    }
        //}


        public async Task DeleteAsync(int? id)
        {
            var entity = await GetAsync(id) ?? throw new Exception("Entity not found");

            if (entity != null)
            {
                _dbSet.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        public async Task ToggleActivationAsync(int? id, bool? status)
        {
            var entity = await GetAsync(id) ?? throw new Exception("Entity not found");

            var property = typeof(T).GetProperty("IsActive", BindingFlags.Public | BindingFlags.Instance);

            if (property != null && property.CanWrite)
            {
                try
                {
                    property.SetValue(entity, status);
                }
                catch (Exception ex)
                {
                    throw new Exception(ex.Message);
                }
            }
            else
            {
                throw new Exception($"Column 'IsActive' not found or not writable");
            }

            _context.Entry(entity).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<T>> AddListAsync(IEnumerable<T> entities)
        {
            var entityList = entities.ToList(); // EFCore.BulkExtensions requires a List<T>

            foreach (var entity in entityList)
            {
                // Assuming 'CreatedAt' is a property of type DateTime
                var createdAtProperty = entity.GetType().GetProperty("CreatedAt");
                if (createdAtProperty != null && createdAtProperty.CanWrite)
                {
                    createdAtProperty.SetValue(entity, DateTime.UtcNow);
                }
            }

            await _context.AddRangeAsync(entityList);
            await _context.SaveChangesAsync();

            return entityList;
        }

        public async Task<IEnumerable<T>> UpdateListAsync(IEnumerable<T> entities)
        {
            var entityList = entities.ToList(); // EFCore.BulkExtensions requires a List<T>

            foreach (var entity in entityList)
            {
                // Assuming 'CreatedAt' is a property of type DateTime
                var UpdatedAtProperty = entity.GetType().GetProperty("UpdatedAt");
                if (UpdatedAtProperty != null && UpdatedAtProperty.CanWrite)
                {
                    UpdatedAtProperty.SetValue(entity, DateTime.UtcNow);
                }
            }

            await _context.BulkUpdateAsync(entityList);
            await _context.BulkSaveChangesAsync();

            return entityList;
        }

        public async Task DeleteListAsync(List<int>? ids)
        {
            if (ids == null || !ids.Any())
                return;

            var entities = await _context.Set<T>()
                .Where(e => ids.Contains(EF.Property<int>(e, "Id")))
                .ToListAsync();

            if (entities.Any())
            {
                _context.Set<T>().RemoveRange(entities);
                await _context.SaveChangesAsync();
            }
        }
    }
}
