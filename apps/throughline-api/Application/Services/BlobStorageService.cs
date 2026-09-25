using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Specialized;
using EpicenterX.Application.Interfaces.Services;

namespace EpicenterX.Application.Services
{
	public class BlobStorageService(string _sasUrl) : IBlobStorageService
    {

		public async Task<string> UploadFileAsync(string fileName, Stream fileStream)
		{
			try
			{
				var blobClient = new BlobClient(new Uri(_sasUrl));

				var blobContainerClient = blobClient.GetParentBlobContainerClient();
				var blobClientInstance = blobContainerClient.GetBlobClient(fileName);

				await blobClientInstance.UploadAsync(fileStream, overwrite: true);

				return blobClientInstance.Uri.ToString(); // Return file URL
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error uploading file into blob: {ex.Message}");
				return string.Empty;
			}
		}

		public async Task<Stream> DownloadFileAsync(string fileName)
		{
			try
			{
				var blobClient = new BlobClient(new Uri(_sasUrl));

				var blobContainerClient = blobClient.GetParentBlobContainerClient();
				var blobClientInstance = blobContainerClient.GetBlobClient(fileName);

				var download = await blobClientInstance.DownloadAsync();
				return download.Value.Content;
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error downloading file from blob: {ex.Message}");
				return Stream.Null;
			}
		}

		public async Task<bool> DeleteFileAsync(string fileName)
		{
			try
			{
				var blobClient = new BlobClient(new Uri(_sasUrl));

				var blobContainerClient = blobClient.GetParentBlobContainerClient();

				var blobClientInstance = blobContainerClient.GetBlobClient(fileName);

				var deleteResponse = await blobClientInstance.DeleteIfExistsAsync();

				return deleteResponse.Value;
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error deleting file in blob: {ex.Message}");
				return false;
			}
		}
	}
}
