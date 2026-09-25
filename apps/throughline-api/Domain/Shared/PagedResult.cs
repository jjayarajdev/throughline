namespace EpicenterX.Domain.Shared
{
	public class PagedResult<T>(IEnumerable<T> items, int totalCount, int pageSize, int currentPage)
    {
        public IEnumerable<T> Items { get; set; } = items;
        public int TotalCount { get; set; } = totalCount;
        public int PageSize { get; set; } = pageSize;
        public int CurrentPage { get; set; } = currentPage;
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
		public bool HasPrevious => CurrentPage > 1;
		public bool HasNext => CurrentPage < TotalPages;
    }
}
