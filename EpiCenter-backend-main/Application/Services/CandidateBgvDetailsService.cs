using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.Onboarding.CandidateBgvDetails;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class CandidateBgvDetailsService(IGenericRepository<CandidateBgvDetails> _repository,
         IGenericRepository<DocumentDetails> _documentRepository,
        IMapper _mapper
        ) : BaseService, ICandidateBgvService
    {
        public async Task<ApiResponseDto<GetCandidateBgvDetailsDto>> GetBgvDetail(int candidatePersonalDetailsId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _repository.GetAsync(query => query.Include(x => x.Vendor)
                                                                      .Include(x => x.PGU)
                                                                      .Include(x => x.NDAAvailabilityDoc)
                                                                      .Include(x => x.CDAAvailabilityDoc)
                                                                      .Include(x => x.UploadBGVDocs)
                                                                      .Include(x => x.AdditionalDocs)
                                                                      .Where(x => x.CandidatePersonalDetailsId == candidatePersonalDetailsId)
                );

                return result == null
                    ? throw new Exception($"BGV details not found with Id: {candidatePersonalDetailsId}")
                    : _mapper.Map<GetCandidateBgvDetailsDto>(result);
            }, "Background Verification detail fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<DocumentDetailDto>>> GetPagedBGVDocs(PageDto pagedata, int? bgvDocId, int? docTypeId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _documentRepository.GetPaginatedListAsync(pagedata,
                query => query.Where(x => docTypeId == 1 ? x.UploadBGVDocId == bgvDocId : x.AdditionalDocId == bgvDocId));

                return new PagedResult<DocumentDetailDto>(_mapper.Map<List<DocumentDetailDto>>(result.Items), result.TotalCount, result.PageSize, result.CurrentPage);

            }, "Partners fetched successfully.");
        }

        public async Task<ApiResponseDto<GetCandidateBgvDetailsDto>> AddBgvDetail(AddCandidateBgvDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {

                dto.IsUploadedBGVDocs = dto.NDAAvailabilityDoc != null && dto.NDAAvailabilityDoc != null;

                var addedEntity = await _repository.AddAsync(_mapper.Map<CandidateBgvDetails>(dto));

                return _mapper.Map<GetCandidateBgvDetailsDto>(addedEntity);

            }, "BGV details added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateBgvDetail(AddCandidateBgvDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _repository.GetAsync(query => query.Include(x => x.Vendor)
                                                                      .Include(x => x.PGU)
                                                                      .Include(x => x.NDAAvailabilityDoc)
                                                                      .Include(x => x.CDAAvailabilityDoc)
                                                                      .Include(x => x.UploadBGVDocs)
                                                                      .Include(x => x.AdditionalDocs)
                    .Where(x => x.Id == dto.Id))
                    ?? throw new Exception($"BGV details not found with Id: {dto.Id}");

                entity.VendorId = dto.VendorId;
                entity.PGUId = dto.PGUId;
                entity.StartDate = dto.StartDate;
                entity.NDAAvailability = dto.NDAAvailability;
                entity.CDAAvailability = dto.CDAAvailability;
                entity.IsBGVAvailableWithPartner = dto.IsBGVAvailableWithPartner;
                entity.BGVStatusId = dto.BGVStatusId;
                entity.BGVStatusName = dto.BGVStatusName;
                entity.BGVCategoryId = dto.BGVCategoryId;
                entity.BGVCategoryName = dto.BGVCategoryName;
                entity.BGVCompletionDate = dto.BGVCompletionDate;

                entity.CandidatePersonalDetailsId = dto.CandidatePersonalDetailsId;

                if(dto.CDAAvailabilityDoc?.AttachmentName != entity.CDAAvailabilityDoc?.AttachmentName)
                {
                    entity.CDAAvailabilityDocId = dto.CDAAvailabilityDocId;
                    entity.CDAAvailabilityDoc = _mapper.Map<DocumentDetails>(dto.CDAAvailabilityDoc);
                    entity.LastUpdated = DateTime.UtcNow;
                }
                if (dto.NDAAvailabilityDoc?.AttachmentName != entity.NDAAvailabilityDoc?.AttachmentName)
                {
                    entity.NDAAvailabilityDocId = dto.NDAAvailabilityDocId;
                    entity.NDAAvailabilityDoc = _mapper.Map<DocumentDetails>(dto.NDAAvailabilityDoc);
                    entity.LastUpdated = DateTime.UtcNow;
                }
                dto.UploadBGVDocs = dto.UploadBGVDocs?.Where(x => x.Id == 0).ToList();
                entity.UploadBGVDocs = _mapper.Map<List<DocumentDetails>>(dto.UploadBGVDocs);

                dto.AdditionalDocs = dto.AdditionalDocs?.Where(x => x.Id == 0).ToList();
                entity.AdditionalDocs = _mapper.Map<List<DocumentDetails>>(dto.AdditionalDocs);

                entity.IsUploadedBGVDocs = entity.CandidateBGVCompleted != true && dto.NDAAvailabilityDoc != null && dto.CDAAvailabilityDoc != null;

                await _repository.UpdateAsync(entity);

            }, "BGV details updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _repository.GetAsync(id);
                if (result == null)
                    throw new Exception($"BGV details not found with Id: {id}");

                result.IsActive = isActive;
                await _repository.UpdateAsync(result);
            }, "BGV details status updated successfully.");
        }
    }
}
