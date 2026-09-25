using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Application.Services
{
    public interface IFileService
    {
        Task<string> UploadAsync(IFormFile file);
        FileResult GetFile(string fileName, bool isDownload);
        Task<bool> DeleteFileAsync(string fileName);
    }
}
