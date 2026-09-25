using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Domain.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;

namespace EpicenterX.Application.Services
{
    public class FileService : IFileService
    {
        private readonly string _storagePath;
        private readonly IGenericRepository<DocumentDetails> _docRepository;

        public FileService(IOptions<DocumentSettings> options, IGenericRepository<DocumentDetails> docRepository)
        {
            _storagePath = options.Value.StoragePath;
            _docRepository = docRepository;
        }

        public async Task<string> UploadAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Invalid file");

            Directory.CreateDirectory(_storagePath);

            var fileExtension = Path.GetExtension(file.FileName);
            var fileNameWithoutExt = Regex.Replace(Path.GetFileNameWithoutExtension(file.FileName), @"[^a-zA-Z0-9_.\-]", "_");

            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var newFileName = $"{fileNameWithoutExt}_{timestamp}{fileExtension}";
            var filePath = Path.Combine(_storagePath, newFileName);

            if (System.IO.File.Exists(filePath))
                throw new IOException("File already exists");

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return newFileName;
        }

        public FileResult GetFile(string fileName, bool isDownload)
        {
            var filePath = Path.Combine(_storagePath, fileName);
            if (!System.IO.File.Exists(filePath))
                throw new FileNotFoundException("File not found", fileName);

            var provider = new FileExtensionContentTypeProvider();
            var mimeType = provider.TryGetContentType(filePath, out var contentType) ? contentType : "application/octet-stream";

            if (isDownload)
            {
                mimeType = "application/octet-stream";
            }

            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            var result = new FileContentResult(fileBytes, mimeType)
            {
                FileDownloadName = fileName
            };

            return result;
        }

        public async Task<bool> DeleteFileAsync(string fileName)
        {
            var filePath = Path.Combine(_storagePath, fileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            var docDetails = await _docRepository.GetAsync(query => query.Where(x => x.AttachmentName == fileName));
            if (docDetails != null)
            {
                await _docRepository.DeleteAsync(docDetails.Id);
            }

            return true;
        }
    }

}
