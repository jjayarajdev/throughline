using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.JoiningRescheduleHistory;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class JoiningRescheduleHistoryService(IGenericRepository<JoiningRescheduleHistory> _historyRepository, IMapper _mapper) : BaseService, IJoiningRescheduleHistoryService
    {
        public async Task<ApiResponseDto<IEnumerable<GetJoiningRescheduleHistoryDto>>> GetHistoryDetailsList(int? personalDetailsId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _historyRepository.GetListAsync(query => query.Include(x => x.ModifiedbyUser).Where(x => x.PersonalDetailsId == personalDetailsId));

                return result == null ? throw new Exception($"History is not found with Id : {personalDetailsId}") : _mapper.Map<IEnumerable<GetJoiningRescheduleHistoryDto>>(result);

            }, "Joining rechedule history fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetJoiningRescheduleHistoryDto>>> GetPagedHistoryDetails(PageDto pageData, int? personalDetailsId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _historyRepository.GetPaginatedListAsync(pageData,
                    query => query.Include(x => x.ModifiedbyUser).Where(x => x.PersonalDetailsId == personalDetailsId));

                var dtos = _mapper.Map<IEnumerable<GetJoiningRescheduleHistoryDto>>(result.Items);
                return new PagedResult<GetJoiningRescheduleHistoryDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);

            }, "Joining rechedule history fetched successfully.");
        }
    }
}
