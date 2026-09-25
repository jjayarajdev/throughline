using System.Data.Entity;
using System.Net;
using System.Net.Mail;
using Azure.Identity;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.Graph;
using Microsoft.Graph.Users.Item.SendMail;

namespace EpicenterX.BackgroundServices
{
    public class EpicenterEmailService(IServiceProvider _serviceProvider,
                                       ILogger<EpicenterEmailService> _logger) : BackgroundService
    {
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var startDate = DateTime.UtcNow.AddDays(-30).Date;
            var endDate = DateTime.UtcNow.Date;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<AppDBContext>();
                        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                        var pendingNotifications = await dbContext.EmailNotifications.Where(x => x.IsSent == false).ToListAsync(stoppingToken);

                        foreach (var pending in pendingNotifications)
                        {
                            if (await emailService.SendEmailviaGraphAsync(bodyHtml: pending.BodyHtml, subject: pending.Subject, to: pending.ToEmail))
                            {
                                pending.IsSent = true;
                                pending.UpdatedAt = DateTime.UtcNow;

                            }
                            dbContext.EmailNotifications.Update(pending);
                            await dbContext.SaveChangesAsync(stoppingToken);
                        }
                    }

                    _logger.LogInformation("Emails sent at: {time}", DateTimeOffset.Now);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing sending emails.");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("Email background service is stopping...");
                    break;
                }
            }
        }
    }
}