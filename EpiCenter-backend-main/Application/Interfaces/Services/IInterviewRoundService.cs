using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.InterviewRound;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IInterviewRoundService
    {
        Task<ApiResponseDto<PagedResult<GetInterviewRoundDto>>> GetPagedInterviewRounds(PageDto pageData);
        Task<ApiResponseDto<IEnumerable<GetInterviewRoundDto>>> GetInterviewRounds(int hiringRequestId);
        Task<ApiResponseDto<GetInterviewRoundDto>> GetInterviewRound(int id);
        Task<ApiResponseDto<GetInterviewRoundDto>> AddInterviewRound(AddInterviewRoundDto interviewRound);
        Task<ApiResponseDto<string>> UpdateInterviewRound(AddInterviewRoundDto interviewRound);
        Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive);
    }
}
