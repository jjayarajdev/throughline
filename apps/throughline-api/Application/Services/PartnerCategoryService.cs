using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS;
using EpicenterX.Application.DTOs.HMS.PartnerCategory;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class PartnerCategoryService(IGenericRepository<PartnerCategory> _partnerCategoryRepository,
        IGenericRepository<Partner> _partnerRepository,
       IConfiguration _configuration,
       IGenericRepository<Users> _userRepository,
       IGenericRepository<HiringRequest> _hiringRequest,
       IGenericRepository<ContactMatrix> _contactMatrixRepository,
       IGenericRepository<JobDetails> _jobDetailsRepository,
       IGenericRepository<M_City> _cityRepository,
        IEmailTemplateService _emailTemplateService, ICommuncationService _communicationService,
        IGenericRepository<HiringReqPartner> _hiringReqPartnerRepository, IHMSUtilities _hmsUtilities, IMapper _mapper)
        : BaseService, IPartnerCategoryService
    {
        public async Task<ApiResponseDto<PagedResult<GetPartnerCategoryDto>>> GetPagedPartnerCategories(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _partnerCategoryRepository.GetPaginatedListAsync(pageData,
                    query => query.Include(x => x.SelectedPartners));
                var dtos = _mapper.Map<IEnumerable<GetPartnerCategoryDto>>(result.Items);
                return new PagedResult<GetPartnerCategoryDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Partner categories fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetPartnerCategoryDto>>> GetPartnerCategories(int hiringRequestId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _partnerCategoryRepository.GetListAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == hiringRequestId));
                return _mapper.Map<IEnumerable<GetPartnerCategoryDto>>(result);
            }, "Partner categories list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetPartnerCategoryDto>> GetPartnerCategory(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.Id == id));
                return entity == null ? throw new Exception($"Partenr Category Details are not found with Id : {id}") : _mapper.Map<GetPartnerCategoryDto>(entity);
            }, "Partner category fetched successfully.");
        }

        public async Task<ApiResponseDto<GetPartnerCategoryDto>> GetPartnerCategoryByHiringId(int hiringId)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == hiringId));
                return entity == null ? throw new Exception($"Partenr Category Details are not found with HiringRequestId : {hiringId}") : _mapper.Map<GetPartnerCategoryDto>(entity);
            }, "Partner category fetched successfully.");
        }

        public async Task<ApiResponseDto<GetPartnerCategoryDto>> AddPartnerCategory(AddPartnerCategoryDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var isParent = await _hmsUtilities.VerifyParentHiringRequestId(dto.HiringRequestId);
                if (isParent != null)
                {
                    var entity = await _partnerCategoryRepository.AddAsync(_mapper.Map<PartnerCategory>(dto));

                    if (isParent == true)
                    {
                        if (entity != null)
                        {
                            var childHirinRequestIds = await _hmsUtilities.GetChildHiringRequestIds(entity.HiringRequestId);

                            if (childHirinRequestIds != null && childHirinRequestIds.Count() > 0)
                                foreach (var id in childHirinRequestIds)
                                {
                                    var partnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == id));

                                    if (partnerCategory == null)
                                    {
                                        partnerCategory = _mapper.Map<PartnerCategory>(dto);
                                        partnerCategory.Id = 0;
                                        partnerCategory.HiringRequestId = id;
                                        await _partnerCategoryRepository.AddAsync(partnerCategory);

                                        if (partnerCategory.SelectedPartners != null && partnerCategory.SelectedPartners.Count() > 0)
                                        {
                                            foreach (var ptnr in partnerCategory.SelectedPartners)
                                            {
                                                try
                                                {
                                                    var partner = await _partnerRepository.GetAsync(ptnr.PartnerId);
                                                    var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));
                                                    var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                                                    var hiringRequest = await _hiringRequest.GetAsync(query => query.Where(x => x.Id == id));

                                                    var jobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequest.Id));
                                                    string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;
                                                    if (jobDetails != null)
                                                    {
                                                        var city = jobDetails != null ? await _cityRepository.GetAsync(query => query.Where(x => jobDetails.PrimaryCityIds.Contains(x.Id))) : null;

                                                        if (toEmail == null)
                                                        {
                                                            toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                                                        }

                                                        var ccEmail = approver.Email;


                                                        var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partner, new JsonSerializerSettings
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


                                                        var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                                                        {
                                                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                            Formatting = Formatting.Indented,
                                                            ContractResolver = new DefaultContractResolver
                                                            {
                                                                NamingStrategy = new InitCapNamingStrategy()
                                                            }
                                                        }), "HiringRequest.");

                                                        var hiringPartdictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);


                                                        var locationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(city, new JsonSerializerSettings
                                                        {
                                                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                                            Formatting = Formatting.Indented,
                                                            ContractResolver = new DefaultContractResolver
                                                            {
                                                                NamingStrategy = new InitCapNamingStrategy()
                                                            }
                                                        }), "Location.");

                                                        var dictionary = Utility.Utility.Merge(locationDict, hiringPartdictionary);

                                                        var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                                                        dictionary.Add("ProfileLink", link);

                                                        await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerHiringAssociationStatusUpdateNotification, toEmail,
                                                          dictionary, ccEmail);

                                                    }
                                                }
                                                catch (Exception ex)
                                                { }
                                            }
                                        }
                                    }
                                }
                        }
                    }

                    var entityPartnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == dto.HiringRequestId));

                    if (entityPartnerCategory != null && entityPartnerCategory.SelectedPartners != null)
                    {
                        foreach (var partnr in entityPartnerCategory.SelectedPartners)
                        {
                            try
                            {
                                var partner = await _partnerRepository.GetAsync(partnr.PartnerId);
                                var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));
                                var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                                var hiringRequest = await _hiringRequest.GetAsync(query => query.Where(x => x.Id == dto.HiringRequestId));

                                var jobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequest.Id));
                                string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                                if (jobDetails != null)
                                {
                                    var city = jobDetails != null ? await _cityRepository.GetAsync(query => query.Where(x => jobDetails.PrimaryCityIds.Contains(x.Id))) : null;

                                    if (toEmail == null)
                                    {
                                        toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                                    }

                                    var ccEmail = approver.Email;

                                    var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partner, new JsonSerializerSettings
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


                                    var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                                    {
                                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                        Formatting = Formatting.Indented,
                                        ContractResolver = new DefaultContractResolver
                                        {
                                            NamingStrategy = new InitCapNamingStrategy()
                                        }
                                    }), "HiringRequest.");

                                    var hiringPartdictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);


                                    var locationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(city, new JsonSerializerSettings
                                    {
                                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                        Formatting = Formatting.Indented,
                                        ContractResolver = new DefaultContractResolver
                                        {
                                            NamingStrategy = new InitCapNamingStrategy()
                                        }
                                    }), "Location.");

                                    var dictionary = Utility.Utility.Merge(locationDict, hiringPartdictionary);

                                    var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                                    dictionary.Add("ProfileLink", link);

                                    await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerHiringAssociationStatusUpdateNotification, toEmail,
                                      dictionary, ccEmail);

                                }
                            }
                            catch (Exception ex)
                            { }

                        }
                    }

                    return _mapper.Map<GetPartnerCategoryDto>(entity);

                }
                throw new Exception("Error in adding PartnerCategory Details.");

            }, "Partner Category added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdatePartnerCategory(AddPartnerCategoryDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _partnerCategoryRepository.GetAsync(qyery => qyery.Include(x => x.SelectedPartners).Where(x => x.Id == dto.Id))
                            ?? throw new Exception($"Partenr Category Details are not found with Id : {dto.Id}");

                var incomingIds = dto.SelectedPartners!.ToList();

                List<HiringReqPartner> PartnersToRemove = [];
                List<HiringReqPartnerDto> PartnersToAdd = [];

                foreach (var sp in entity.SelectedPartners!)
                {
                    bool found = false;
                    foreach (var incomId in incomingIds)
                    {
                        if (sp.PartnerId == incomId.PartnerId && sp.PartnerCategoryId == incomId.PartnerCategoryId)
                        {
                            var partnCategory = dto.SelectedPartners.Where(x => x.PartnerCategoryId == incomId.PartnerCategoryId && x.PartnerId == incomId.PartnerId).FirstOrDefault();
                            partnCategory.Id = sp.Id;
                            found = true;
                            break;
                        }
                    }

                    if (!found)
                    {
                        PartnersToRemove.Add(sp);
                    }
                }

                foreach (var incomId in incomingIds)
                {
                    bool found = false;
                    foreach (var sp in entity.SelectedPartners!)
                    {
                        if (sp.PartnerId == incomId.PartnerId && sp.PartnerCategoryId == incomId.PartnerCategoryId)
                        {
                            found = true;
                            var partnCategory = dto.SelectedPartners.Where(x => x.PartnerCategoryId == incomId.PartnerCategoryId && x.PartnerId == incomId.PartnerId).FirstOrDefault();
                            partnCategory.Id = sp.Id;
                            break;
                        }
                    }

                    if (!found)
                    {
                        PartnersToAdd.Add(incomId);
                    }
                }

                var toRemove = PartnersToRemove.Select(p => p.Id).ToList();

                foreach (var prtnr in PartnersToRemove)
                {
                    try
                    {
                        var partner = await _partnerRepository.GetAsync(query => query.Where(x => x.Id == prtnr.PartnerId));
                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtnr.PartnerId));
                        var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));
                        var hiringRequest = await _hiringRequest.GetAsync(query => query.Where(x => x.Id == entity.HiringRequestId));

                        var jobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequest.Id));
                        string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                        if (jobDetails != null)
                        {
                            var city = jobDetails != null ? await _cityRepository.GetAsync(query => query.Where(x => jobDetails.PrimaryCityIds.Contains(x.Id))) : null;

                            if (toEmail == null)
                            {
                                toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                            }

                            var ccEmail = approver.Email;

                            var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partner, new JsonSerializerSettings
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


                            var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "HiringRequest.");

                            var hiringPartdictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);


                            var locationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(city, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "Location.");

                            var dictionary = Utility.Utility.Merge(locationDict, hiringPartdictionary);

                            var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                            dictionary.Add("ProfileLink", link);

                            await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerHiringRemoveAssociationNotification, toEmail,
                             dictionary, ccEmail);
                        }
                    }
                    catch (Exception ex)
                    { }
                }

                await _hiringReqPartnerRepository.DeleteListAsync(toRemove);

                _mapper.Map(dto, entity);

                await _partnerCategoryRepository.UpdateAsync(entity);


                //var hiringRequestDetails = await _hiringRequest.GetAsync(query => query.Include(q => q.PartnerCategory).Where(x => x.Id == dto.HiringRequestId));

                //await _hiringRequest.UpdateAsync(hiringRequestDetails, false);

                foreach (var partnr in PartnersToAdd)
                {
                    try
                    {
                        var partner = await _partnerRepository.GetAsync(query => query.Where(x => x.Id == partnr.PartnerId));

                        var hiringRequest = await _hiringRequest.GetAsync(query => query.Where(x => x.Id == entity.HiringRequestId));

                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partnr.PartnerId));

                        var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                        var jobDetails = await _jobDetailsRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequest.Id));

                        string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                        if (jobDetails != null)
                        {
                            var city = jobDetails != null ? await _cityRepository.GetAsync(query => query.Where(x => jobDetails.PrimaryCityIds.Contains(x.Id))) : null;

                            if (toEmail == null)
                            {
                                toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                            }

                            var ccEmail = approver.Email;

                            var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(partner, new JsonSerializerSettings
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


                            var hiringRequestDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(hiringRequest, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "HiringRequest.");

                            var hiringPartdictionary = Utility.Utility.Merge(hiringRequestDict, partHiringDict);


                            var locationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(city, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "Location.");

                            var dictionary = Utility.Utility.Merge(locationDict, hiringPartdictionary);


                            var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                            dictionary.Add("ProfileLink", link);

                            await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerHiringAssociationStatusUpdateNotification, toEmail,
                             dictionary, ccEmail);
                        }
                    }
                    catch (Exception ex)
                    { }
                }
            }, "Partner category updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _partnerCategoryRepository.GetAsync(id) ?? throw new Exception($"Partenr Category Details are not found with Id : {id}");
                entity.IsActive = isActive;
                await _partnerCategoryRepository.UpdateAsync(entity);
            }, "Partner category status updated successfully.");
        }

    }
}
