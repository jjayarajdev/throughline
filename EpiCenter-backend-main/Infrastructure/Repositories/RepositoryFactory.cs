using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Infrastructure.Persistence;

namespace EpicenterX.Infrastructure.Repositories
{
	public class RepositoryFactory(AppDBContext _context) : IRepositoryFactory
	{
		public IGenericRepository<T> GetRepository<T>() where T : class
		{
			return new GenericRepository<T>(_context);
		}
	}
}
