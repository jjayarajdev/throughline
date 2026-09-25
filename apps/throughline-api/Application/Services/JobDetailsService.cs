using System.Net;
using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS;
using EpicenterX.Application.DTOs.HMS.JobDetails;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph.Models.Partners;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class JobDetailsService(IGenericRepository<JobDetails> _jobDetailsRepository,
        IGenericRepository<Partner> _partnerRepository,
        IGenericRepository<ContactMatrix> _contactMatrixRepository,
        IGenericRepository<PartnerCategory> _partnerCategory,
        IGenericRepository<HiringRequest> _hiringRequest,
        IGenericRepository<HiringReqPartner> _hirinReqPartner,
        IGenericRepository<Users> _userRepository,
        IEmailTemplateService _emailTemplateService,
        ICommuncationService _communicationService,
        IConfiguration _configuration,
        IHMSUtilities _hmsUtilities,
        IMapper _mapper)
        : BaseService, IJobDetailsService
    {
        public async Task<ApiResponseDto<PagedResult<GetJobDetailsDto>>> GetPagedJobDetails(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _jobDetailsRepository.GetPaginatedListAsync(pageData);
                var dtos = _mapper.Map<IEnumerable<GetJobDetailsDto>>(result.Items);
                return new PagedResult<GetJobDetailsDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Job details fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetJobDetailsDto>>> GetJobDetails(int hiringRequestId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _jobDetailsRepository.GetListAsync(query => query.Where(x => x.HiringRequestId == hiringRequestId));
                return _mapper.Map<IEnumerable<GetJobDetailsDto>>(result);
            }, "Job details list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetJobDetailsDto>> GetJobDetail(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _jobDetailsRepository.GetAsync(query => query
                                                                        .Include(x => x.SubDomain)
                                                                        .ThenInclude(x => x!.SubDomainManager)
                                                                        .Where(x => x.Id == id))
                ?? throw new Exception($"JobDetails are not found with Id : {id}");

                return _mapper.Map<GetJobDetailsDto>(entity);
            }, "Job detail fetched successfully.");
        }

        public async Task<ApiResponseDto<GetJobDetailsDto>> GetJobDetailByHiringId(int hiringId)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _jobDetailsRepository.GetAsync(query => query
                                                                        .Include(x => x.SubDomain)
                                                                        .ThenInclude(x => x!.SubDomainManager)
                                                                        .Where(x => x.HiringRequestId == hiringId))
                ?? throw new Exception($"JobDetails are not found with HiringRequestId : {hiringId}");

                return _mapper.Map<GetJobDetailsDto>(entity);

            }, "Job detail fetched successfully.");
        }

        public async Task<ApiResponseDto<GetJobDetailsDto>> AddJobDetail(AddJobDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var isParent = await _hmsUtilities.VerifyParentHiringRequestId(dto.HiringRequestId);
                var entity = await _jobDetailsRepository.AddAsync(_mapper.Map<JobDetails>(dto));

                if (isParent == true)
                {
                    if (entity != null)
                    {
                        var childHirinRequestIds = await _hmsUtilities.GetChildHiringRequestIds(entity.HiringRequestId);

                        if (childHirinRequestIds != null && childHirinRequestIds.Count() > 0)
                            foreach (var hiringRequestId in childHirinRequestIds)
                            {
                                var jobDetail = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequestId));

                                if (jobDetail == null)
                                {
                                    jobDetail = _mapper.Map<JobDetails>(dto);
                                    jobDetail.Id = 0;
                                    jobDetail.HiringRequestId = hiringRequestId;
                                    await _jobDetailsRepository.AddAsync(jobDetail);
                                }
                            }
                    }

                }

                var hiringRequest = await _hiringRequest.GetAsync(query => query.Include(q => q.PartnerCategory).Where(x => x.Id == dto.HiringRequestId));

                var partnerCategory = await _partnerCategory.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequest.Id));
                if (partnerCategory != null)
                {
                    var selectedPartnes = await _hirinReqPartner.GetListAsync(query => query.Where(x => x.PartnerCategoryId == partnerCategory.Id));
                    if (selectedPartnes != null && selectedPartnes.Count() > 0)
                    {
                        foreach (var partner in selectedPartnes)
                        {
                            try
                            {
                                var prtner = await _partnerRepository.GetAsync(partner.PartnerId);
                                var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtner.Id));

                                var hiringManager = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));

                                string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                                if (toEmail == null)
                                {
                                    toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                                }

                                var ccEmail = hiringManager.Email;

                                var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partner, new JsonSerializerSettings
                                {
                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                    Formatting = Formatting.Indented,

                                }), "Partner.");

                                var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringManager, new JsonSerializerSettings
                                {
                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                    Formatting = Formatting.Indented,
                                    ContractResolver = new DefaultContractResolver
                                    {
                                        NamingStrategy = new InitCapNamingStrategy()
                                    }
                                }), "HiringManager.");

                                var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);

                                var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                                {
                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                    Formatting = Formatting.Indented,
                                    ContractResolver = new DefaultContractResolver
                                    {
                                        NamingStrategy = new InitCapNamingStrategy()
                                    }
                                }), "HiringRequest.");

                                var dictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);

                                var link = _configuration["ClientHostName"] + "/home/hiring-details?hrqid=" + hiringRequest.HrqId;
                                dictionary.Add("ProfileLink", link);


                                await _communicationService.AddNotification((int)HiringEmailTemplateEnums.HiringRequestJobDetailsUpdatedNotification, toEmail,
                                    dictionary, ccEmail);

                            }
                            catch (Exception ex)
                            { }
                        }
                    }
                }

                return _mapper.Map<GetJobDetailsDto>(entity);

                throw new Exception("Error in adding JobDetails");

            }, "Job detail added successfully.");
        }
        
        public async Task<ApiResponseDto<string>> UpdateJobDetail(AddJobDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _jobDetailsRepository.GetAsync(dto.Id) ?? throw new Exception($"JobDetails are not found with HiringRequestId : {dto.Id}");
                //_mapper.Map(dto, entity);

                entity.JobDescription = dto.JobDescription;
                entity.HiringActivityId = dto.HiringActivityId;
                entity.JobPriorityId = dto.JobPriorityId;
                entity.HiringDate = dto.HiringDate;
                entity.JobLevelId = dto.JobLevelId;
                entity.RelevantExperience = dto.RelevantExperience;
                entity.TotalExperience = dto.TotalExperience;
                entity.ResourceTypeId = dto.ResourceTypeId;
                entity.BadgeRecId = dto.BadgeRecId;

                entity.CountryId = dto.CountryId;

                entity.StateIds = dto.StateIds;
                entity.PrimaryCityIds = dto.PrimaryCityIds;
                entity.SecondaryCityIds = dto.SecondaryCityIds;

                entity.JobLocation = dto.JobLocation;

                entity.SubDomainId = dto.SubDomainId;

                // Skills mapping (store as JSON, CSV, or relational depending on schema)
                entity.PrimarySkills = dto.PrimarySkills;
                entity.SecondarySkills = dto.SecondarySkills;

                entity.MandatoryCertification = dto.MandatoryCertification;

                entity.HiringRequestId = dto.HiringRequestId;

                await _jobDetailsRepository.UpdateAsync(entity);

                var hiringRequest = await _hiringRequest.GetAsync(query => query.Include(q => q.PartnerCategory).Where(x => x.Id == dto.HiringRequestId));

                if (hiringRequest.PartnerCategory != null)
                {
                    var partnerCategory = hiringRequest.PartnerCategory;

                    var selectedPartnes = await _hirinReqPartner.GetListAsync(query => query.Where(x => x.PartnerCategoryId == partnerCategory.Id));

                    if (partnerCategory != null && selectedPartnes != null && selectedPartnes.Count() > 0)
                    {
                        foreach (var partner in selectedPartnes)
                        {
                            try
                            {
                                var prtner = await _partnerRepository.GetAsync(partner.PartnerId);
                                var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtner.Id));

                                var hiringManager = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));

                                string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                                if (toEmail == null)
                                {
                                    toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                                }

                                var ccEmail = hiringManager.Email;

                                var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(prtner, new JsonSerializerSettings
                                {
                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                    Formatting = Formatting.Indented,

                                }), "Partner.");

                                var hiringDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringManager, new JsonSerializerSettings
                                {
                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                    Formatting = Formatting.Indented,
                                    ContractResolver = new DefaultContractResolver
                                    {
                                        NamingStrategy = new InitCapNamingStrategy()
                                    }
                                }), "HiringManager.");

                                var partHiringDict = Utility.Utility.Merge(partnerDict, hiringDict);

                                var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                                {
                                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                    Formatting = Formatting.Indented,
                                    ContractResolver = new DefaultContractResolver
                                    {
                                        NamingStrategy = new InitCapNamingStrategy()
                                    }
                                }), "HiringRequest.");

                                var dictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);

                                var link = _configuration["ClientHostName"] + "/home/hiring-details?hrqid=" + hiringRequest.HrqId;
                                dictionary.Add("ProfileLink", link);


                                await _communicationService.AddNotification((int)HiringEmailTemplateEnums.HiringRequestJobPrioirtyUpdatedNotification, toEmail,
                                    dictionary, ccEmail);

                            }
                            catch (Exception ex)
                            { }
                        }
                    }
                }
            }, "Job detail updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _jobDetailsRepository.GetAsync(id) ?? throw new Exception($"JobDetails are not found with Id : {id}");
                entity.IsActive = isActive;
                await _jobDetailsRepository.UpdateAsync(entity);
            }, "Job detail status updated successfully.");
        }
    }
}
