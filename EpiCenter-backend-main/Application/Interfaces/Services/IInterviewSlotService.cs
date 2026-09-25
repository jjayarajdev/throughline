using EpicenterX.Application.DTOs.Panel;
using EpicenterX.Application.DTOs;
using EpicenterX.Domain.Shared;
using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Application.DTOs.CMS.InterviewSlot;
using EpicenterX.Application.DTOs.CMS;

namespace EpicenterX.Application.Interfaces.Services
{
    public interface IInterviewSlotService
    {
        Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetInterviewScreeningList(InterviewSlotScreeningPageDto pageData);
        Task<ApiResponseDto<string>> UpdateCandidateScreeningSlot(AddScreeningSlotDto dto);
        Task<ApiResponseDto<GetInterviewSlotDto>> ScheduleCandidateInterviewSlot(AddInterviewSlotDto candidateForm);
        Task<ApiResponseDto<string>> EditCandidateInterviewSlot(EditInterviewSlotDto dto);


        Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetPartnerInterviewSlotPendingApprovalRequests(int? partnerId, int? categoryId, PageDto pageData, int? durationId);
        Task<ApiResponseDto<string>> PartnerUpdateCandidateInterviewSlot(int interviewSlotId, bool isAccepted, string comments);
        Task<ApiResponseDto<string>> PartnerUpdateCandidateInterviewStatus(CandidateInterviewUpdateDto dto);
        Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetCandidateInterviewSlotList(InterviewSlotListPageDto pageData);
        Task<ApiResponseDto<string>> UpdateInterviewFeedback(AddFeedbackDto candidateForm);
        Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetInterviewFeedbackPendingList(InterviewFeedbackPendingListPageDto pageData);
        Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetInterviewSelectedList(InterviewSelectedListPageDto pageData);



        Task<ApiResponseDto<GetPanelFeedFormDto>> GetInterviewSlotFeedbackDetails(int? InterviewSlotId);
        Task<ApiResponseDto<GetCandidateInterviewFeedbackDetailsDto>> GetCandidateInterviewFeedbackDetails(int? candidateId);
        Task<ApiResponseDto<string>> UpdateInterviewSlotFeedbackDetails(List<UpdatePanelFeedbackFormDto> dtos);
        Task<IEnumerable<GetInterviewSlotDto>> GetUpcomingInterviewList(int? hiringRequestId);

        Task<ApiResponseDto<PagedResult<GetInterviewSlotDto>>> GetUnallocatedPartnerCandidatesList(CandidateAwaitingSlotListPageDto pageData);

        Task<ApiResponseDto<string>> ReconsiderCandidate(ReconsiderCandidateDto dto);
    }
}
