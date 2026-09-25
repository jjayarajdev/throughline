namespace EpicenterX.Application.Interfaces.Repositories
{
	public interface IRepositoryFactory
	{
		IGenericRepository<T> GetRepository<T>() where T : class;
	}
}
