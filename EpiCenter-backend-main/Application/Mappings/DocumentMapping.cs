using System.Buffers.Text;
using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Mappings
{
    public class DocumentMapping : IMappingAction<DocumentDetails, DocumentDetailDto>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IConfiguration _configuration;
        public DocumentMapping(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
        {
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
        }

        public void Process(DocumentDetails source, DocumentDetailDto destination, ResolutionContext context)
        {
            var request = _httpContextAccessor.HttpContext?.Request;

            string baseUrl = request != null ? $"{request.Scheme}://{request.Host}" : _configuration["BaseUrl"] ?? string.Empty;

            destination.AttachmentName = source.AttachmentName;
            destination.AttachmentURL = $"{baseUrl}/api/FileServer/{source.AttachmentName}";

            destination.CreatedDate = source.CreatedAt.HasValue ? DateOnly.FromDateTime(source.CreatedAt.Value) : null;
            destination.CreatedTime = source.CreatedAt.HasValue ? TimeOnly.FromDateTime(source.CreatedAt.Value).ToString("HH:mm:ss") : null;
        }
    }

    public class DocumentReverseMapping : IMappingAction<DocumentDetailDto, DocumentDetails>
    {

        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IConfiguration _configuration;
        public DocumentReverseMapping(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
        {
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
        }

        public void Process(DocumentDetailDto source, DocumentDetails destination, ResolutionContext context)
        {
            var request = _httpContextAccessor.HttpContext?.Request;

            string baseUrl = request != null ? $"{request.Scheme}://{request.Host}" : _configuration["BaseUrl"] ?? string.Empty;

            destination.AttachmentName = source.AttachmentName;
            destination.AttachmentURL = $"{baseUrl}/api/FileServer/{source.AttachmentName}";

        }
    }

}
