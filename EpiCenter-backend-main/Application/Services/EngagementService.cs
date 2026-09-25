using AutoMapper;
using DocumentFormat.OpenXml.Vml;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.Engagement;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Graph.Models.Partners;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class EngagementService(IGenericRepository<Engagement> _engagementRepository,
    ICommuncationService _communcationService,
                                   IGenericRepository<EngagementHistory> _engagementHistoryRepository,
                                   IEmailTemplateService _emailTemplateService,
                                     IGenericRepository<ContactMatrix> _contactMatrixRepository,

                                   IGenericRepository<Users> _userRepostory,
                                   IConfiguration _configuration,
                                   IGenericRepository<M_MasterData> _masterData,
                                   IGenericRepository<Partner> _partnerRepository,
                                   IMapper _mapper) : BaseService, IEngagementService
    {
        public async Task<ApiResponseDto<PagedResult<GetEngagementDto>>> GetPagedEngagements(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _engagementRepository.GetPaginatedListAsync(pageData,
                    query => query
                       .Include(x => x.EngagementStatus!)
                       .Include(x => x.EngagementType)
                       .Include(x => x.BusinessUnit)
                       .Include(x => x.EvaluationStatus)
                       );
                var dtos = _mapper.Map<IEnumerable<GetEngagementDto>>(result.Items);
                return new PagedResult<GetEngagementDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Engagements fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetEngagementDto>>> GetPagedEngagementHistories(int? engagementId, PageDto pagedata)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _engagementHistoryRepository.GetPaginatedListAsync(pagedata,
                query => query
                .Include(x => x.EngagementStatus!)
                .Include(x => x.EngagementType)
                .Include(x => x.BusinessUnit)
                .Include(x => x.EvaluationStatus)
                .Include(x => x.CreatedUser)
                .Where(x => x.EngagementId == engagementId && x.EvaluationStatusId == (int)EVALUATION_STATUS.EXTENDED));
                var dtos = _mapper.Map<IEnumerable<GetEngagementDto>>(result.Items);
                return new PagedResult<GetEngagementDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Engagements fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetEngagementDto>>> GetEngagements(int partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _engagementRepository.GetListAsync(query => query
                   .Include(x => x.EngagementStatus!)
                   .Include(x => x.EngagementType)
                   .Include(x => x.BusinessUnit)
                   .Include(x => x.EvaluationStatus)
                   .Where(x => x.PartnerId == partnerId));
                return _mapper.Map<IEnumerable<GetEngagementDto>>(result);
            }, "Engagements fetched successfully.");
        }

        public async Task<ApiResponseDto<GetEngagementDto>> GetEngagement(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _engagementRepository.GetAsync(query => query
                       .Include(x => x.EngagementStatus!)
                       .Include(x => x.EngagementType)
                       .Include(x => x.BusinessUnit)
                       .Include(x => x.EvaluationStatus)
                       .Where(x => x.Id == id));
                return entity == null ? throw new Exception($"Engagement is not found with Id : {id}") : _mapper.Map<GetEngagementDto>(entity);
            }, "Engagement fetched successfully.");
        }

        public async Task<ApiResponseDto<GetEngagementDto>> AddEngagement(AddEngagementDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var template = PartnerEmailTemplateEnums.PartnerEvaluationInitiated;
                var engagementEntity = _mapper.Map<Engagement>(dto);

                var added = await _engagementRepository.AddAsync(engagementEntity);

                if (added != null)
                {
                    var partner = await _partnerRepository.GetAsync(added.PartnerId);

                    if (partner != null && partner.PartnerStatusId != (int)PARTNER_STATUS.ACTIVE)
                    {
                        partner.PartnerStatusId = added.EvaluationStatusId switch
                        {
                            (int)EVALUATION_STATUS.INITIATED => (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS,
                            (int)EVALUATION_STATUS.EXTENDED => (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS,
                            (int)EVALUATION_STATUS.COMPLETED => (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS,
                            //(int)EVALUATION_STATUS.REJECTED => (int)PARTNER_STATUS.REJECTED,
                            (int)EVALUATION_STATUS.EMPANELLED => (int)PARTNER_STATUS.ACTIVE,
                            _ => null
                        };

                        partner.IsEmpaneledEnabled = added.EvaluationStatusId == (int)EVALUATION_STATUS.EMPANELLED;
                        await _partnerRepository.UpdateAsync(partner, false);
                    }
                }
                else
                {
                    if (dto.EvaluationStatusId == (int)EVALUATION_STATUS.REJECTED)
                    {
                        template = PartnerEmailTemplateEnums.PartnerEvaluationRejected;
                    }
                    else
                    {
                        if (dto.EvaluationStatusId == (int)EVALUATION_STATUS.COMPLETED)
                        {
                            template = PartnerEmailTemplateEnums.PartnerEvaluationCompleted;
                        }
                    }
                }

                try
                {
                    var partnerDetails = await _partnerRepository.GetAsync(dto.PartnerId);
                    var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partnerDetails.Id));
                    var approver = await _userRepostory.GetAsync(query => query.Where(x => x.UserId == partnerDetails.ApprovedBy));

                    string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                    if (toEmail == null)
                    {
                        toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                    }

                    var ccEmail = approver.Email;

                    var engagementType = await _masterData.GetAsync(query => query.Where(x => x.Id == engagementEntity.EngagementTypeId));

                    var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partnerDetails, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "Partner.");

                    var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(approver, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "HiringManager.");

                    var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);

                    var evaluationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(engagementEntity, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "Evaluation.");

                    var engagmentDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(engagementType, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "EngagementType.");

                    var partEngemntDict = Utility.Utility.Merge(engagmentDict, evaluationDict);

                    var dictionary = Utility.Utility.Merge(partEngemntDict, partHiringDict);

                    var link = _configuration["ClientHostName"] + "/home/partner-onboarding/edit-partner?id=" + partnerDetails.Id;
                    dictionary.Add("ProfileLink", link);

                    await _communcationService.AddNotification((int)template, toEmail, dictionary, ccEmail);
                }
                catch (Exception ex)
                { }

                return _mapper.Map<GetEngagementDto>(added);

            }, "Engagement added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateEngagement(AddEngagementDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _engagementRepository.GetAsync(dto.Id) ?? throw new Exception($"Engagement is not found with Id : {dto.Id}");

                entity.EvaluationStatusId = dto.EvaluationStatusId;
                entity.EngagementStatusId = dto.EngagementStatusId;
                entity.EngagementTypeId = dto.EngagementTypeId;
                entity.EvaluationStartDate = dto.EvaluationStartDate;
                entity.EvaluationEndDate = dto.EvaluationEndDate;
                entity.EvaluationPeriod = dto.EvaluationPeriod;
                entity.EvaluatedBy = dto.EvaluatedBy;
                entity.BusinessId = dto.BusinessId;
                entity.BusinessCenter = dto.BusinessCenter;
                entity.IsCompletedEvaluation = dto.IsCompletedEvaluation;
                entity.IsExtendedEvaluation = dto.IsExtendedEvaluation;
                entity.MRUCode = dto.MRUCode;
                entity.Comments = dto.Comments;

                if (dto.EvaluationStatusId == (int)EVALUATION_STATUS.REJECTED)
                {
                    entity.IsCompletedEvaluation = dto.IsCompletedEvaluation;
                    entity.RejectionReasonId = dto.RejectionReasonId;
                    entity.RejectionReason = dto.RejectionReason;
                }
                else if (dto.EvaluationStatusId == (int)EVALUATION_STATUS.EXTENDED && dto.EvaluationExtendedDate != null)
                {
                    entity.EvaluationExtendedDate = dto.EvaluationExtendedDate;
                    entity.ExtendedComments = dto.ExtendedComments;
                    entity.IsExtendedEvaluation = dto.IsExtendedEvaluation;

                    // Add into History
                    var engagementHistory = _mapper.Map<EngagementHistory>(entity);
                    engagementHistory.Id = 0;
                    engagementHistory.EngagementId = entity.Id;

                    var updatedHistory = await _engagementHistoryRepository.AddAsync(engagementHistory);

                }
                else if (dto.EvaluationStatusId == (int)EVALUATION_STATUS.COMPLETED)
                {
                    entity.IsCompletedEvaluation = dto.IsCompletedEvaluation;
                }

                await _engagementRepository.UpdateAsync(entity);

                var partner = await _partnerRepository.GetAsync(entity.PartnerId) ?? throw new Exception($"Partner is not found with Id : {entity.PartnerId}");

                if (partner.PartnerStatusId != (int)PARTNER_STATUS.ACTIVE)
                {
                    partner.PartnerStatusId = entity.EvaluationStatusId switch
                    {
                        (int)EVALUATION_STATUS.INITIATED => (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS,
                        (int)EVALUATION_STATUS.EXTENDED => (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS,
                        (int)EVALUATION_STATUS.COMPLETED => (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS,
                        //(int)EVALUATION_STATUS.REJECTED => (int)PARTNER_STATUS.REJECTED,
                        (int)EVALUATION_STATUS.EMPANELLED => (int)PARTNER_STATUS.ACTIVE,
                        _ => null
                    };

                    partner.IsEmpaneledEnabled = entity.EvaluationStatusId == (int)EVALUATION_STATUS.EMPANELLED;

                    await _partnerRepository.UpdateAsync(partner, false);

                    var templateDetails = PartnerEmailTemplateEnums.PartnerEvaluationUpdateNotification;


                    if (entity.EvaluationStatusId == (int)EvaluationStatus.Completed)
                    {
                        templateDetails = PartnerEmailTemplateEnums.PartnerEvaluationCompleted;
                    }
                    else if (entity.EvaluationStatusId == (int)EvaluationStatus.Rejected)
                    {
                        templateDetails = PartnerEmailTemplateEnums.PartnerEvaluationRejected;
                    }

                    try
                    {
                        var partnerDetails = await _partnerRepository.GetAsync(dto.PartnerId);
                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partnerDetails.Id));

                        var approver = await _userRepostory.GetAsync(query => query.Where(x => x.UserId == partnerDetails.ApprovedBy));


                        string ccEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                        if (ccEmail == null)
                        {
                            ccEmail = contact.Count() > 1 ? contact.FirstOrDefault().Email : null;
                        }

                        var toEmail = approver.Email;

                        var engagementType = await _masterData.GetAsync(query => query.Where(x => x.Id == entity.EngagementTypeId));

                        var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partnerDetails, new JsonSerializerSettings
                        {
                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                            Formatting = Formatting.Indented,
                            ContractResolver = new DefaultContractResolver
                            {
                                NamingStrategy = new InitCapNamingStrategy()
                            }
                        }), "Partner.");

                        var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(approver, new JsonSerializerSettings
                        {
                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                            Formatting = Formatting.Indented,
                            ContractResolver = new DefaultContractResolver
                            {
                                NamingStrategy = new InitCapNamingStrategy()
                            }
                        }), "HiringManager.");

                        var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);

                        var evaluationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(entity, new JsonSerializerSettings
                        {
                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                            Formatting = Formatting.Indented,
                            ContractResolver = new DefaultContractResolver
                            {
                                NamingStrategy = new InitCapNamingStrategy()
                            }
                        }), "Evaluation.");

                        var engagmentDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(engagementType, new JsonSerializerSettings
                        {
                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                            Formatting = Formatting.Indented,
                            ContractResolver = new DefaultContractResolver
                            {
                                NamingStrategy = new InitCapNamingStrategy()
                            }
                        }), "EngagementType.");

                        var partEngemntDict = Utility.Utility.Merge(engagmentDict, evaluationDict);

                        var dictionary = Utility.Utility.Merge(partEngemntDict, partHiringDict);

                        var link = _configuration["ClientHostName"] + "/home/partner-onboarding/edit-partner?id=" + partnerDetails.Id;
                        dictionary.Add("ProfileLink", link);

                        await _communcationService.AddNotification((int)templateDetails, toEmail,
                            dictionary, ccEmail);

                    }
                    catch (Exception ex)
                    { }


                }

            }, "Engagement updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _engagementRepository.GetAsync(id) ?? throw new Exception($"Engagement is not found with Id : {id}");
                entity.IsActive = isActive;
                await _engagementRepository.UpdateAsync(entity);
            }, "Engagement status updated successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetEngagementDto>>> GetEvaluationEngagements(int? partnerId, int statusId, PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                if (statusId == 0)
                    throw new Exception("StatusId is required.");

                var baseQuery = _engagementRepository.GetPaginatedListAsync(pageData,
                query =>
                {
                    var filteredQuery = query
                        .Include(x => x.EngagementStatus!)
                        .Include(x => x.EngagementType)
                        .Include(x => x.BusinessUnit)
                        .Include(x => x.Partner)
                        .Include(x => x.EvaluationStatus)
                        .Where(x => x.PartnerId == (partnerId ?? x.PartnerId));

                    // Apply status-specific conditions
                    switch ((EVALUATION_ENGAGEMENTS)statusId)
                    {
                        case EVALUATION_ENGAGEMENTS.INPROGRESS:
                            filteredQuery = filteredQuery.Where(x =>
                                x.EvaluationStatusId == (int)EVALUATION_STATUS.INITIATED ||
                                x.EvaluationStatusId == (int)EVALUATION_STATUS.EXTENDED);
                            break;

                        case EVALUATION_ENGAGEMENTS.EXPIRING:
                            filteredQuery = filteredQuery.Where(x =>
                                (x.EvaluationStatusId == (int)EVALUATION_STATUS.INITIATED ||
                                 x.EvaluationStatusId == (int)EVALUATION_STATUS.EXTENDED) &&
                                x.EvaluationEndDate <= DateTime.UtcNow.AddDays(15));
                            break;

                        case EVALUATION_ENGAGEMENTS.COMPLETED:
                            filteredQuery = filteredQuery.Where(x =>
                                x.EvaluationStatusId == (int)EVALUATION_STATUS.COMPLETED);
                            break;

                        case EVALUATION_ENGAGEMENTS.EMPANELLED:
                            filteredQuery = filteredQuery.Where(x =>
                                x.EvaluationStatusId == (int)EVALUATION_STATUS.EMPANELLED);
                            break;

                        case EVALUATION_ENGAGEMENTS.REJECTED:
                            filteredQuery = filteredQuery.Where(x =>
                                x.EvaluationStatusId == (int)EVALUATION_STATUS.REJECTED);
                            break;
                    }

                    return filteredQuery;
                });

                var result = await baseQuery;
                var dtos = _mapper.Map<IEnumerable<GetEngagementDto>>(result.Items);
                return new PagedResult<GetEngagementDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);

            }, "Engagements fetched successfully.");
        }
    }
}