using EpicenterX.Application.DTOs;

namespace EpicenterX.Middleware
{
    public class ExceptionMiddleware(RequestDelegate _next, ILogger<ExceptionMiddleware> _logger)
    {
        private const string error = "Unhandled exception occurred. ";

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                // Log the exception
                _logger.LogError(ex, $"{error} {ex.Message}  Inner Exception Details : {ex.InnerException?.Message}" ?? "");

                // Set response status code and message
                httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
                httpContext.Response.ContentType = "application/json";

                // Return a custom error response

                var errorResponse = ApiResponseDto<string>.Fail(ex.InnerException == null ? ex.Message : ex.InnerException.Message, 500);

                await httpContext.Response.WriteAsJsonAsync(errorResponse);
            }
        }
    }
}
