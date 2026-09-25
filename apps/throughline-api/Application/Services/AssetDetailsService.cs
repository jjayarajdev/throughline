using AutoMapper;
using DocumentFormat.OpenXml.Office2010.Drawing;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.AssetDetails;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class AssetDetailsService(IGenericRepository<AssetDetails> _assetDetailsRepository,
                                     IGenericRepository<CandidatePersonalDetails> _personalDetailsRepository,
                                     IGenericRepository<HiringRequest> _hiringRepository,
                                     IGenericRepository<Candidate> _candidateRepository,
                                     IMapper _mapper) : BaseService, IAssetDetailsService
    {
        public async Task<ApiResponseDto<PagedResult<GetAssetDetailsDto>>> GetPagedAssetDetails(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _assetDetailsRepository.GetPaginatedListAsync(
                    pageData,
                    query => query.Include(x => x.ModeOfPcShipment)
                                  .Include(x => x.ITAssetStatus)
                                  .Include(x => x.ComplianceFollowed)
                                  .Include(x => x.DelayCategory)
                );

                var dtos = _mapper.Map<IEnumerable<GetAssetDetailsDto>>(result.Items);
                return new PagedResult<GetAssetDetailsDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Asset Details fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetAssetDetailsDto>>> GetAssetDetailsList()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _assetDetailsRepository.GetListAsync(
                    query => query.Include(x => x.ModeOfPcShipment)
                                  .Include(x => x.ITAssetStatus)
                                  .Include(x => x.ComplianceFollowed)
                                  .Include(x => x.DelayCategory)
                );

                return _mapper.Map<IEnumerable<GetAssetDetailsDto>>(result);
            }, "Asset Details list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetAssetDetailsDto>> GetAssetDetail(int candidatePersonalDetailsId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _assetDetailsRepository.GetAsync(query => query.Include(x => x.ModeOfPcShipment)
                                  .Include(x => x.ITAssetStatus)
                                  .Include(x => x.ComplianceFollowed)
                                  .Include(x => x.DelayCategory)
                                  .Where(x => x.CandidatePersonalDetailsId == candidatePersonalDetailsId)
                );

                return result == null
                    ? throw new Exception($"Asset Details not found with Id: {candidatePersonalDetailsId}")
                    : _mapper.Map<GetAssetDetailsDto>(result);

            }, "Asset Details fetched successfully.");
        }

        public async Task<ApiResponseDto<GetAssetDetailsDto>> AddAssetDetail(AddAssetDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var existing = await _assetDetailsRepository.GetAsync(query => query
                                                                     .Where(x => x.CandidatePersonalDetailsId == dto.CandidatePersonalDetailsId)
                );

                if (existing != null)
                    throw new Exception($"Asset Details already exists for candidate.");

                if (dto.ComplianceFollowedId == (int)COMPLAINCE_FOLLOWED.Candidate_Dropped)
                {
                    var personalDetails = await _personalDetailsRepository.GetAsync(dto.CandidatePersonalDetailsId);

                    if (personalDetails?.Candidate != null)
                    {
                        // Revert Hiring Status to WIP
                        var hiring = await _hiringRepository.GetAsync(personalDetails.Candidate.HiringRequestId) ?? throw new Exception($"Hiring not found with Id {personalDetails.Candidate.HiringRequestId}");

                        hiring.HiringStatusId = (int)HIRING_STATUS.WIP;

                        await _hiringRepository.UpdateAsync(hiring);
                    }
                }
                var entity = await _assetDetailsRepository.AddAsync(_mapper.Map<AssetDetails>(dto));

                return _mapper.Map<GetAssetDetailsDto>(entity);

            }, "Asset Details added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateAssetDetail(AddAssetDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _assetDetailsRepository.GetAsync(query =>

                    query.Where(x => x.CandidatePersonalDetailsId == dto.CandidatePersonalDetailsId))
                    ?? throw new Exception($"Asset Details not found with Id: {dto.Id}");

                entity.IsJoinConfirmed = dto.IsJoinConfirmed;
                entity.IsPCAllocated = dto.IsPCAllocated;
                entity.PCRequestCreatedDate = dto.PCRequestCreatedDate;
                entity.PCRequestRefNo = dto.PCRequestRefNo;
                entity.PCSerialNo = dto.PCSerialNo;
                entity.PCAllocationDate = dto.PCAllocationDate;
                entity.ModeOfPcShipmentId = dto.ModeOfPcShipmentId;
                entity.PCReceivedOn = dto.PCReceivedOn;
                entity.PCConfigurationDate = dto.PCConfigurationDate;
                entity.ITAssetStatusID = dto.ITAssetStatusID;
                entity.ComplianceFollowedId = dto.ComplianceFollowedId;
                entity.DelayCategoryId = dto.DelayCategoryId;
                entity.Comments = dto.Comments;
                entity.CandidatePersonalDetailsId = dto.CandidatePersonalDetailsId;

                await _assetDetailsRepository.UpdateAsync(entity);

            }, "Asset Details updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleAssetStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _assetDetailsRepository.GetAsync(id)
                    ?? throw new Exception($"Asset Details not found with Id: {id}");

                entity.IsActive = isActive;
                await _assetDetailsRepository.UpdateAsync(entity);

            }, "Asset Details updated successfully.");
        }
    }
}
