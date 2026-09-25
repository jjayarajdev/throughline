namespace EpicenterX.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            var request = context.Request;
            var requestBody = string.Empty;

            // Read body if needed
            if (request.ContentLength > 0 && request.Body.CanSeek)
            {
                request.EnableBuffering();
                using var reader = new StreamReader(request.Body, leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
                request.Body.Position = 0;
            }

            _logger.LogInformation("HTTP {Method} {Path} | Body: {Body} | Time: {Time}",
                request.Method,
                request.Path,
                requestBody,
                DateTime.UtcNow);

            await _next(context);
        }
    }
}
