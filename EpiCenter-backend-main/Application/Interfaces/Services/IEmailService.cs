using EpicenterX.Application.DTOs;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IEmailService
    {
        Task SendEmailViaAzureAsync(string? to, int? notificationId, TokensDto dto);
        Task<bool> SendEmailviaGraphAsync(string to, string subject, string bodyHtml);
        Task<bool> SendEmailViaSmtpAsync(string to, string subject, string bodyHtml);
    }
}