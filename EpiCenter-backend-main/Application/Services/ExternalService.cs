using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.HiringRequest;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class ExternalService(IGenericRepository<RCMSDetails> _rcmsRepository, IMapper _mapper) : BaseService, IExternalService
    {
        public async Task<ApiResponseDto<GetHiringRequestDto>> GetRCMSAsync(string rcmsProjectId, string rcMsResourceRequestId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _rcmsRepository.GetAsync(query => query.Include(x=>x.HiringManager).Where(x => x.RcMsResourceRequestId == rcMsResourceRequestId && x.ProjectId == rcmsProjectId))
                ?? throw new Exception($"RCMS details not found with ProjectId : {rcmsProjectId} && ResourceRequestId : {rcMsResourceRequestId}");

                return _mapper.Map<GetHiringRequestDto>(result);
            }, "RCMS details fetched successfully.");
        }
    }
}
