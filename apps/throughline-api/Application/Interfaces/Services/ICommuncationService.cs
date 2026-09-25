namespace EpicenterX.Application.Interfaces.Services
{
    public interface ICommuncationService
    {
        Task<bool> SendNotification(int? notificationId, Dictionary<string, string> keyValues);

        Task<bool> AddNotification(int? notificationId, string toEmail, Dictionary<string, string> keyValues, string ccEmail = null);
        //Task<bool> GetNotificationTemplate(int? notificationId, Dictionary<string, string> tokens);

    }
}