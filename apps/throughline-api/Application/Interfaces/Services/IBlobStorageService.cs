namespace EpicenterX.Application.Interfaces.Services
{
	public interface IBlobStorageService
	{
		Task<string> UploadFileAsync(string fileName, Stream fileStream);
		Task<Stream> DownloadFileAsync(string fileName);
		Task<bool> DeleteFileAsync(string fileName);
	}
}
