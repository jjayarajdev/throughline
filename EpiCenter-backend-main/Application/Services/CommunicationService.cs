using EpicenterX.Application.Enums;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.SqlServer.Internal;

namespace EpicenterX.Application.Services
{
    public class CommunicationService(IEmailTemplateService _emailTemplateService, AppDBContext _appDBContext, IEmailService _emailService) : BaseService, ICommuncationService
    {
        public async Task<bool> SendNotification(int? notificationId, Dictionary<string, string> keyValues)
        {
            try
            {
                var templateDetails = await _emailTemplateService.GetTemplate(notificationId);

                if (templateDetails != null)
                {
                    var subject = ReplaceTokens(templateDetails.Data.Subject, keyValues);
                    var bodyHtml = ReplaceTokens(templateDetails.Data.BodyHtml, keyValues);

                    var toEmail = "sanjay.kumar@algoleap.com";
                    return await _emailService.SendEmailViaSmtpAsync(toEmail, subject, bodyHtml);
                }
            }
            catch (Exception ex)
            {
                var t = ex.Message;
            }

            return false;
        }

        public async Task<bool> AddNotification(int? notificationId, string toEmail, Dictionary<string, string> keyValues, string ccEmail = null)
        {
            try
            {
                var templateDetails = await _emailTemplateService.GetTemplate(notificationId);

                if (templateDetails != null)
                {
                    var subject = ReplaceTokens(templateDetails.Data.Subject, keyValues);
                    var bodyHtml = ReplaceTokens(templateDetails.Data.BodyHtml, keyValues);

                    await _appDBContext.EmailNotifications.AddAsync(new Domain.Entities.EmailNotifications
                    {
                        Subject = subject,
                        BodyHtml = bodyHtml,
                        NotificationId = notificationId,
                        IsSent = false,
                        IsActive = true,
                        ToEmail = toEmail,
                        CCEmail = ccEmail, // Assuming no CC email for now
                        TemplateName = templateDetails.Data.TemplateName,
                        CreatedBy = 1, // Assuming 1 is the ID of the user creating this template
                        CreatedAt = DateTime.UtcNow
                    });
                    await _appDBContext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                var t = ex.Message;
            }

            return false;
        }


        public static void AddRangeWithoutOverwrite<TKey, TValue>(Dictionary<TKey, TValue> target, Dictionary<TKey, TValue> source)
        {
            foreach (var kvp in source)
            {
                if (!target.ContainsKey(kvp.Key))
                {
                    target.Add(kvp.Key, kvp.Value);
                }
            }
        }

        public object? GetServiceByClassName(string className)
        {
            var currentNamespace = "EpicenterX.Domain.Entities";


            // Build the full type name
            var fullTypeName = $"{currentNamespace}.{className}";

            // Get the Type object
            var type = Type.GetType(fullTypeName);

            if (type == null)
                throw new InvalidOperationException($"Type '{fullTypeName}' not found.");

            // Create an instance of the model
            return Activator.CreateInstance(type);
        }

        private string ReplaceTokens(string template, Dictionary<string, string> tokens)
        {
            foreach (var token in tokens)
            {
                template = template.Replace("{" + token.Key + "}", token.Value);
            }
            return template;
        }
    }
}