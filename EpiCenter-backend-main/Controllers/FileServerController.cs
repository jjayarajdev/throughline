using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Services;
using EpicenterX.Domain.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;

namespace EpicenterX.Controllers
{
    //[Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FileServerController : ControllerBase
    {
        private readonly IFileService _fileService;
        private readonly string _storagePath;
        private readonly IGenericRepository<DocumentDetails> _docRepository;

        public FileServerController(IOptions<DocumentSettings> options, IGenericRepository<DocumentDetails> docRepository, IFileService fileService)
        {
            _storagePath = options.Value.StoragePath;
            _docRepository = docRepository;
            _fileService = fileService;

        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument(IFormFile file)
        {
            try
            {
                var fileName = await _fileService.UploadAsync(file);
                return Ok(new { FileName = fileName });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{fileName}")]
        public IActionResult GetDocument(string fileName, [FromQuery] bool? isDownload)
        {
            var filePath = Path.Combine(_storagePath, fileName);

            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var provider = new FileExtensionContentTypeProvider();
            string mimeType;

            // Determine the content type based on the file extension

            if (!provider.TryGetContentType(filePath, out mimeType))
            {
                mimeType = "application/octet-stream";
            }

            // Download the file if isDownload is true

            if (isDownload == true)
            {
                mimeType = "application/octet-stream";
            }

            // Add Content-Disposition header for inline display
            Response.Headers["Content-Disposition"] = $"inline; filename=\"{fileName}\"; filename*=UTF-8''{Uri.EscapeDataString(fileName)}";

            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            return File(fileBytes, mimeType);
        }

        [HttpDelete("{fileName}")]
        public async Task<IActionResult> DeleteDocument(string fileName)
        {
            try
            {
                await _fileService.DeleteFileAsync(fileName);
                return Ok("File deleted successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
