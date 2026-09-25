using EpicenterX.Application.DTOs;
using EpicenterX.Application.Exceptions;

namespace EpicenterX.Application.Services
{
    public abstract class BaseService
    {
        protected async Task<ApiResponseDto<T>> ExecuteAsync<T>(Func<Task<T>> action, string successMessage = "Success", int statusCode = 200)
        {
            try
            {
                var data = await action();
                return ApiResponseDto<T>.Success(data, successMessage, statusCode);
            }
            catch (CustomHttpException ex)
            {
                return ApiResponseDto<T>.Fail(ex.Message, ex.StatusCode);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<T>.Fail(ex.InnerException == null ? ex.Message : ex.InnerException.Message, statusCode);
            }
        }

        protected async Task<ApiResponseDto<string>> ExecuteAsync(Func<Task> action, string successMessage = "Success", int statusCode = 200)
        {
            try
            {
                await action();
                return ApiResponseDto<string>.Success(successMessage, successMessage, statusCode);
            }
            catch (CustomHttpException ex)
            {
                return ApiResponseDto<string>.Fail(ex.Message, ex.StatusCode);
            }
            catch (Exception ex)
            {
                return ApiResponseDto<string>.Fail(ex.InnerException == null ? ex.Message : ex.InnerException.Message, statusCode);
            }
        }
    }
}
