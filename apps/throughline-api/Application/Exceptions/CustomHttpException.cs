namespace EpicenterX.Application.Exceptions
{
    public class CustomHttpException(string message, int statusCode = 400) : Exception(message)
    {
        public int StatusCode { get; } = statusCode;
    }
}
