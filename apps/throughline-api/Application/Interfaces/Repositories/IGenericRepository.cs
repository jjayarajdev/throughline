using EpicenterX.Application.DTOs;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Repositories
{
    public interface IGenericRepository<T> where T : class
    {
        /// <summary>
        /// Retrieves a count of all entities of type <typeparamref name="T"/> from the database.
        /// </summary>
        /// <returns>A task that represents an asynchronous operation. The task result contains count <see cref="int"/>.</returns>
        Task<int> GetCountAsync(Func<IQueryable<T>, IQueryable<T>>? includeQuery = null);

        /// <summary>
        /// Retrieves a list of all entities of type <typeparamref name="T"/> from the database.
        /// </summary>
        /// <returns>A task that represents an asynchronous operation. The task result contains an <see cref="IEnumerable{T}"/> collection of entities.</returns>
        Task<PagedResult<TResult>> GetPaginatedListWithJoinQueryAsync<TResult>(PageDto pageData, Func<IQueryable<T>, IQueryable<TResult>> joinQuery);

        /// <summary>
        /// Retrieves a list of all entities of type <typeparamref name="T"/> from the database.
        /// </summary>
        /// <returns>A task that represents an asynchronous operation. The task result contains an <see cref="IEnumerable{T}"/> collection of entities.</returns>
        Task<PagedResult<T>> GetPaginatedListAsync(PageDto pageData, Func<IQueryable<T>, IQueryable<T>>? includeQuery = null, string type = "");

        /// <summary>
        /// Retrieves a list of all entities of type <typeparamref name="T"/> from the database.
        /// </summary>
        /// <returns>A task that represents an asynchronous operation. The task result contains an <see cref="IEnumerable{T}"/> collection of entities.</returns>
        Task<IEnumerable<T>> GetListAsync(string type = "", bool deafaultOrder = true);

        Task<IEnumerable<TResult>> GetListWithJoinAsync<TResult>(
                       Func<IQueryable<T>, IQueryable<TResult>> joinQuery, string type = "", bool defaultOrder = true);

        /// <summary>
        /// Retrieves a list of entities of type <typeparamref name="T"/> from the database with specified query inclusions.
        /// </summary>
        /// <param name="includeQuery">A function that defines the query to include related entities.</param>
        /// <returns>A task that represents an asynchronous operation. The task result contains an <see cref="IEnumerable{T}"/> collection of entities with related data included.</returns>
        Task<IEnumerable<T>> GetListAsync(Func<IQueryable<T>, IQueryable<T>> includeQuery, string type = "", bool defaultOrder = true);

        /// <summary>
        /// Retrieves a single entity of type <typeparamref name="T"/> from the database by its ID.
        /// </summary>
        /// <param name="id">The unique identifier of the entity to retrieve. Can be nullable.</param>
        /// <returns>A task that represents an asynchronous operation. The task result contains the entity of type <typeparamref name="T"/>, or null if not found.</returns>
        Task<T> GetAsync(int? id, string type = "");

        /// <summary>
        /// Retrieves a single entity of type <typeparamref name="T"/> from the database with specified query inclusions.
        /// </summary>
        /// <param name="includeQuery">A function that defines the query to include related entities.</param>
        /// <returns>A task that represents an asynchronous operation. The task result contains the entity of type <typeparamref name="T"/> with related data included, or null if not found.</returns>
        Task<T> GetAsync(Func<IQueryable<T>, IQueryable<T>> includeQuery);

        /// <summary>
        /// Retrieves a single entity of type <typeparamref name="T"/> from the database with specified query joins.
        /// </summary>
        /// <param name="joinQuery">A function that defines the query to include related entities.</param>
        /// <returns>A task that represents an asynchronous operation. The task result contains the entity of type <typeparamref name="T"/> with related data included, or null if not found.</returns>
        Task<TResult> GetItemWithJoinAsync<TResult>(Func<IQueryable<T>, IQueryable<TResult>> joinQuery, string type = "") where TResult : class, new();

        /// <summary>
        /// Adds a new entity of type <typeparamref name="T"/> to the database.
        /// </summary>
        /// <param name="entity">The entity to be added.</param>
        /// <returns>A task that represents an asynchronous operation. The task result contains the added entity.</returns>
        Task<T> AddAsync(T entity);

        /// <summary>
        /// Adds list of new entities of type <typeparamref name="T"/> to the database.
        /// </summary>
        /// <param name="entities">List of entities to be added.</param>
        /// <returns>A task that represents an asynchronous operation. The task result contains the added entity.</returns>
        Task<IEnumerable<T>> AddListAsync(IEnumerable<T> entities);

        /// <summary>
        /// Updates list of new entities of type <typeparamref name="T"/> to the database.
        /// </summary>
        /// <param name="entities">List of entities to be updated.</param>
        /// <returns>A task that represents an asynchronous operation. The task result contains the updated entities.</returns>
        Task<IEnumerable<T>> UpdateListAsync(IEnumerable<T> entities);

        /// <summary>
        /// Updates an existing entity of type <typeparamref name="T"/> in the database.
        /// </summary>
        /// <param name="entity">The entity to be updated with modified values.</param>
        /// <returns>A task that represents an asynchronous operation.</returns>
        Task UpdateAsync(T entity, bool updateChildren = true);

        /// <summary>
        /// Deletes an entity of type <typeparamref name="T"/> from the database by its ID.
        /// </summary>
        /// <param name="id">The unique identifier of the entity to delete. Can be nullable.</param>
        /// <returns>A task that represents an asynchronous operation.</returns>
        Task DeleteAsync(int? id);

        /// <summary>
        /// Deletes an entity of type <typeparamref name="T"/> from the database by its ID.
        /// </summary>
        /// <param name="ids">The unique identifier of the entity to delete. Can be nullable.</param>
        /// <returns>A task that represents an asynchronous operation.</returns>
        Task DeleteListAsync(List<int>? ids);

        /// <summary>
        /// Toggles the activation status of an entity of type <typeparamref name="T"/> in the database.
        /// </summary>
        /// <param name="id">The unique identifier of the entity whose activation status will be changed.</param>
        /// <param name="status">The desired activation status: true for activate, false for deactivate. Can be nullable.</param>
        /// <returns>A task that represents an asynchronous operation.</returns>
        Task ToggleActivationAsync(int? id, bool? status);

    }
}
