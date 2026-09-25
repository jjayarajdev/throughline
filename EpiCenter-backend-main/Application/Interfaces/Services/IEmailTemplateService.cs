using EpicenterX.Application.DTOs;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IEmailTemplateService
    {
        Task<ApiResponseDto<EmailTemplateDetailsDto>> GetTemplate(int? notificationId);
        Task<ApiResponseDto<EmailTemplateDetailsDto>> GetTemplateByName(string? templateName);
        Task<ApiResponseDto<PagedResult<EmailTemplateDetailsDto>>> GetPagedEmailTemplates(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<EmailTemplateDetailsDto>>> GetEmailTemplates();
        Task<ApiResponseDto<EmailTemplateDetailsDto>> GetEmailTemplate(int id);
        Task<ApiResponseDto<EmailTemplateDetailsDto>> AddEmailTemplate(EmailTemplateDetailsDto dto);
        Task<ApiResponseDto<string>> UpdateEmailTemplate(EmailTemplateDetailsDto dto);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
    }
}