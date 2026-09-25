namespace EpicenterX.Application.DTOs
{
    public class ApiResponseDto<T>
    {
        public bool Status { get; set; } = true;
        public int? StatusCode { get; set; }
        public string Message { get; set; } = "Success";
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }

        public static ApiResponseDto<T> Success(T data, string message = "Success", int statusCode = 200)
        {
            return new ApiResponseDto<T>
            {
                Status = true,
                Data = data,
                Message = message,
                StatusCode = statusCode
            };
        }

        public static ApiResponseDto<T> Fail(string message, int statusCode = 500, List<string>? errors = null)
        {
            return new ApiResponseDto<T>
            {
                Status = false,
                Data = default,
                Message = message,
                StatusCode = statusCode,
                Errors = errors
            };
        }
    }
}
