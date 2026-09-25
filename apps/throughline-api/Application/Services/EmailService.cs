using System.Net;
using System.Net.Mail;
using Azure.Identity;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.Graph;
using Microsoft.Graph.Users.Item.SendMail;


namespace EpicenterX.Application.Services
{
    public class EmailService(HttpClient httpClient, IConfiguration configuration) : BaseService, IEmailService
    {

        private readonly HttpClient _httpClient = httpClient;
        private readonly IConfiguration _configuration = configuration;

        public async Task SendEmailViaAzureAsync(string? to, int? notificationId, TokensDto dto)
        {
            var functionUrl = _configuration["EmailFunction:Url"]; // e.g., from appsettings or Azure App Config

            var payload = new
            {
                To = to,
                NotificationId = notificationId,
                Tokens = dto
            };

            var response = await _httpClient.PostAsJsonAsync(functionUrl, payload);

            response.EnsureSuccessStatusCode(); // Throws if 4xx/5xx
        }

        public async Task<bool> SendEmailviaGraphAsync(string to, string subject, string bodyHtml)
        {
            var tenantId = _configuration["AzureAd:TenantId"];
            var clientId = _configuration["AzureAd:ClientId"];
            var clientSecret = _configuration["AzureAd:ClientSecret"];

            var fromEmail = _configuration["Smtp:From"];

            var clientSecretCredential = new ClientSecretCredential(
                tenantId, clientId, clientSecret);

            var graphClient = new GraphServiceClient(clientSecretCredential, new[] { "https://graph.microsoft.com/.default" });

            await graphClient.Users[fromEmail]
            .SendMail
            .PostAsync(new SendMailPostRequestBody
            {
                Message = new Microsoft.Graph.Models.Message
                {
                    Subject = subject,
                    Body = new Microsoft.Graph.Models.ItemBody
                    {
                        ContentType = Microsoft.Graph.Models.BodyType.Html,
                        Content = bodyHtml
                    },
                    ToRecipients = new List<Microsoft.Graph.Models.Recipient>
                    {
                       new Microsoft.Graph.Models.Recipient
                       {
                           EmailAddress = new Microsoft.Graph.Models.EmailAddress
                           {
                               Address = to
                           }
                       }
                    }
                },
                SaveToSentItems = true
            });

            return true;
        }

        public async Task<bool> SendEmailViaSmtpAsync(string to, string subject, string bodyHtml)
        {
            // You can fetch these from configuration
            var smtpHost = _configuration["Smtp:Host"]; // e.g., "smtp.office365.com"
            var smtpPort = int.Parse(_configuration["Smtp:Port"] ?? "587");
            var smtpUser = _configuration["Smtp:Username"];
            var smtpPass = _configuration["Smtp:Password"];
            var fromEmail = _configuration["Smtp:From"]; // e.g., "noreply@yourdomain.com"

            if (fromEmail != null)
                using (var client = new SmtpClient(smtpHost, smtpPort))
                {
                    client.EnableSsl = true;
                    client.Credentials = new NetworkCredential(smtpUser, smtpPass);

                    var mail = new MailMessage
                    {
                        From = new MailAddress(fromEmail),
                        Subject = subject,
                        Body = bodyHtml,
                        IsBodyHtml = true
                    };
                    mail.To.Add(to);

                    await client.SendMailAsync(mail);
                }

            return true;
        }
    }
}