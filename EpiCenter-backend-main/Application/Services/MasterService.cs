using System.Data;
using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.Masters;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using EpicenterX.Domain.Shared.HelperClasses;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace EpicenterX.Application.Services
{
    public class MasterService(IRepositoryFactory _repositoryFactory,
        AppDBContext _context,
        IGenericRepository<HiringRequest> _hiringRepository,
        IGenericRepository<PartnerCategory> _partnerCategoryRepository,
        IGenericRepository<UserRole> _userRoleRepository,
        IGenericRepository<M_Country> _countryRepository, IMapper _mapper,
        IMemoryCache cache) : BaseService, IMasterService
    {
        public async Task<ApiResponseDto<MasterDto>> AddMasterAsync(int type, MasterDto master)
        {
            return await ExecuteAsync(async () =>
            {

                cache.Remove($"master_{type}_true");
                cache.Remove($"master_{type}_false");
                cache.Remove($"master_{type}_");

                if (master == null)
                    throw new Exception("Data is required");

                if (type == (int)MASTER_TYPE.COUNTRY)
                {
                    master.IsActive = master.IsActive ?? true;
                    var _repository = _repositoryFactory.GetRepository<M_Country>();
                    await _repository.AddAsync(_mapper.Map<M_Country>(master));
                }
                else if (type == (int)MASTER_TYPE.STATE)
                {
                    if (master.CountryId == null)
                        throw new Exception("CountryId is required.");

                    master.IsActive = master.IsActive ?? true;

                    var _repository = _repositoryFactory.GetRepository<M_State>();
                    await _repository.AddAsync(_mapper.Map<M_State>(master));
                }
                else if (type == (int)MASTER_TYPE.JOB_LEVEL)
                {
                    master.IsActive = master.IsActive ?? true;

                    var _repository = _repositoryFactory.GetRepository<M_JobLevel>();

                    await _repository.AddAsync(_mapper.Map<M_JobLevel>(master));
                }
                else if (type == (int)MASTER_TYPE.CITY)
                {
                    if (master.StateId == null)
                        throw new Exception("StateId is required.");

                    master.IsActive = master.IsActive ?? true;

                    var _repository = _repositoryFactory.GetRepository<M_City>();
                    await _repository.AddAsync(_mapper.Map<M_City>(master));
                }
                else if (type == (int)MASTER_TYPE.DOMAIN)
                {
                    if (master.DomainManagerId == null)
                        throw new Exception("DomainManagerId is required.");

                    var userRole = await _userRoleRepository.GetAsync(query => query.Where(x => x.UserId == master.DomainManagerId));

                    if (userRole == null)
                    {
                        await _userRoleRepository.AddAsync(new UserRole()
                        {
                            UserId = master.DomainManagerId,
                            RoleId = (int)ROLES.DomainManager,
                            IsActive = true
                        });
                    }

                    master.IsActive = master.IsActive ?? true;

                    var _repository = _repositoryFactory.GetRepository<M_Domain>();

                    await _repository.AddAsync(_mapper.Map<M_Domain>(master));
                }
                else if (type == (int)MASTER_TYPE.SUBDOMAIN)
                {
                    if (master.DomainId == null)
                        throw new Exception("DomainId is required.");

                    if (master.SubDomainManagerId == null)
                        throw new Exception("SubDomainManagerId is required.");

                    var userRole = await _userRoleRepository.GetAsync(query => query.Where(x => x.UserId == master.SubDomainManagerId));

                    if (userRole == null)
                    {
                        await _userRoleRepository.AddAsync(new UserRole()
                        {
                            UserId = master.SubDomainManagerId,
                            RoleId = (int)ROLES.DomainManager,
                            IsActive = true
                        });
                    }

                    master.IsActive = master.IsActive ?? true;

                    var _repository = _repositoryFactory.GetRepository<M_SubDomain>();

                    await _repository.AddAsync(_mapper.Map<M_SubDomain>(master));
                }
                else if (type == (int)MASTER_TYPE.SKILL)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Skill>();

                    var existingSkill = await _repository.GetAsync(query => query.Where(x => x.Name == master.Name && x.IsActive == true));
                    if (existingSkill != null)
                        throw new Exception($"Skill already exists with Name {master.Name}.");

                    await _repository.AddAsync(_mapper.Map<M_Skill>(master));
                }
                else
                {
                    if (master.MasterTypeId == null)
                        throw new Exception("MasterTypeId is required.");

                    if (type == (int)MASTER_TYPE.JOB_LEVEL)
                    {
                        if (master.ExperienceRange == null)
                            throw new Exception("ExperienceRange is required.");

                        if (master.DefaultExperience == null)
                            throw new Exception("DefaultExperience is required.");
                    }

                    bool isValid = Enum.IsDefined(typeof(MASTER_TYPE), master!.MasterTypeId!);

                    if (isValid)
                    {
                        master.Id = await GetMasterDataId(type);

                        if (master.Id > 0)
                        {
                            master.IsActive = master.IsActive ?? true;

                            var _repository = _repositoryFactory.GetRepository<M_MasterData>();
                            await _repository.AddAsync(_mapper.Map<M_MasterData>(master));
                        }
                    }
                    else
                        throw new Exception("MasterTypeId not existed.");
                }

                return new MasterDto();

            }, " Item added successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<MasterDto>>> GetMasterDataByListIdsAsync(int _masterType, List<int> parentIds, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                IEnumerable<MasterDto> result = [];

                if (_masterType == (int)MASTER_TYPE.STATE)
                {
                    var _repository = _repositoryFactory.GetRepository<M_State>();

                    var response = await _repository.GetListAsync(query => query.Where(x => x.IsActive == (isActive == null ? x.IsActive : isActive) && parentIds.Contains(x.CountryId ?? 0)));

                    result = _mapper.Map<IEnumerable<MasterDto>>(response);
                }
                else if (_masterType == (int)MASTER_TYPE.CITY)
                {
                    var _repository = _repositoryFactory.GetRepository<M_City>();

                    var response = await _repository.GetListAsync(query => query.Where(x => x.IsActive == (isActive == null ? x.IsActive : isActive) && parentIds.Contains(x.StateId ?? 0)));

                    result = _mapper.Map<IEnumerable<MasterDto>>(response);
                }

                return result;

            }, "Data fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<MasterDto>>> GetPagedMastersAsync(MasterPageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                IEnumerable<MasterDto> result = [];

                if (pageData.MasterTypeId == (int)MASTER_TYPE.CITY)
                {
                    var _repository = _repositoryFactory.GetRepository<M_City>();
                    var response = await _repository.GetPaginatedListAsync(pageData,
                        query => query.Include(x => x.State).Where(x => x.StateId == (pageData.StateId != null ? pageData.StateId : x.StateId) && x.IsActive == (pageData.ActiveStatus != null ? pageData.ActiveStatus : x.IsActive))
                        );
                    result = _mapper.Map<IEnumerable<MasterDto>>(response.Items);
                    return new PagedResult<MasterDto>(result, response.TotalCount, response.PageSize, response.CurrentPage);

                }
                else if (pageData.MasterTypeId == (int)MASTER_TYPE.COUNTRY)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Country>();
                    var response = await _repository.GetPaginatedListAsync(pageData,
                        query => query.Where(x => x.IsActive == (pageData.ActiveStatus != null ? pageData.ActiveStatus : x.IsActive))
                        );
                    result = _mapper.Map<IEnumerable<MasterDto>>(response.Items);
                    return new PagedResult<MasterDto>(result, response.TotalCount, response.PageSize, response.CurrentPage);
                }
                else if (pageData.MasterTypeId == (int)MASTER_TYPE.DOMAIN)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Domain>();
                    var response = await _repository.GetPaginatedListAsync(pageData,
                        query => query.Include(x => x.DomainManager).Where(x => x.IsActive == (pageData.ActiveStatus != null ? pageData.ActiveStatus : x.IsActive)));
                    result = _mapper.Map<IEnumerable<MasterDto>>(response.Items);
                    return new PagedResult<MasterDto>(result, response.TotalCount, response.PageSize, response.CurrentPage);
                }
                else if (pageData.MasterTypeId == (int)MASTER_TYPE.SKILL)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Skill>();
                    var response = await _repository.GetPaginatedListAsync(pageData,
                        query => query.Where(x => x.IsActive == (pageData.ActiveStatus != null ? pageData.ActiveStatus : x.IsActive)));
                    result = _mapper.Map<IEnumerable<MasterDto>>(response.Items);
                    return new PagedResult<MasterDto>(result, response.TotalCount, response.PageSize, response.CurrentPage);
                }
                else if (pageData.MasterTypeId == (int)MASTER_TYPE.STATE)
                {
                    var _repository = _repositoryFactory.GetRepository<M_State>();
                    var response = await _repository.GetPaginatedListAsync(pageData,
                        query => query.Include(x => x.Country).Where(x => x.CountryId == (pageData.CountryId != null ? pageData.CountryId : x.CountryId) && x.IsActive == (pageData.ActiveStatus != null ? pageData.ActiveStatus : x.IsActive)));
                    result = _mapper.Map<IEnumerable<MasterDto>>(response.Items);
                    return new PagedResult<MasterDto>(result, response.TotalCount, response.PageSize, response.CurrentPage);
                }
                else if (pageData.MasterTypeId == (int)MASTER_TYPE.SUBDOMAIN)
                {
                    var _repository = _repositoryFactory.GetRepository<M_SubDomain>();
                    var response = await _repository.GetPaginatedListAsync(pageData,
                        query => query.Include(x => x.SubDomainManager).Include(x => x.Domain).Where(x => x.DomainId == (pageData.DomainId != null ? pageData.DomainId : x.DomainId) && x.IsActive == (pageData.ActiveStatus != null ? pageData.ActiveStatus : x.IsActive)));
                    result = _mapper.Map<IEnumerable<MasterDto>>(response.Items);
                    return new PagedResult<MasterDto>(result, response.TotalCount, response.PageSize, response.CurrentPage);
                }
                else
                {
                    var _repository = _repositoryFactory.GetRepository<M_MasterData>();
                    var response = await _repository.GetPaginatedListAsync(pageData,
                        query => query.OrderBy(x => x.Id).Where(x => x.MasterTypeId == pageData.MasterTypeId).Where(x => x.IsActive == (pageData.ActiveStatus != null ? pageData.ActiveStatus : x.IsActive))); ;
                    result = _mapper.Map<IEnumerable<MasterDto>>(response.Items);
                    return new PagedResult<MasterDto>(result, response.TotalCount, response.PageSize, response.CurrentPage);
                }


            }, "Data fetched successfully.");
        }

        private async Task<int> GetMasterDataId(int type)
        {
            var _repository = _repositoryFactory.GetRepository<M_MasterData>();
            var item = await _repository.GetAsync(query => query.Where(x => x.MasterTypeId == type).OrderByDescending(x => x.Id));

            return item != null ? item.Id + 1 : Convert.ToInt32(type + "001");
        }

        public Task DeleteMasterAsync(string MasterType, int id)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponseDto<IEnumerable<MasterDto>>> GetMastersAsync(int _masterType, int countryId, int stateId, List<int> domainIds, int? partnerId, int? hiringRequestId, int? roundNameId, bool? getVacant, List<int> roleIds, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                if (!cache.TryGetValue($"master_{_masterType}_{(isActive?.ToString() ?? "")}", out IEnumerable<MasterDto>? result))
                {
                    result = [];

                    if (_masterType == (int)MASTER_TYPE.USERS_BY_ROLES)
                    {
                        var _repository = _repositoryFactory.GetRepository<Users>();

                        var response = await _repository.GetListAsync(query => query
                                                                              .Include(x => x.UserRoles!)
                                                                              .Where(x => x.IsActive == (isActive == null ? x.IsActive : isActive) && x.UserRoles!.Any(x => roleIds.Contains(x.RoleId ?? 0))
                                                                              ));

                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.ALL_HIRING_REQUESTS)
                    {
                        if (hiringRequestId == null)
                            throw new Exception("HiringRequestId is required");

                        var hiringRequest = await _hiringRepository.GetAsync(query => query.Where(x => x.Id == hiringRequestId && x.IsParentHRQ == true));

                        if (hiringRequest == null)
                            result = [];
                        else
                        {
                            var childHirings = (await _hiringRepository.GetListAsync(query => query.Where(x => x.ParentHrqId == hiringRequest.HrqId
                            && x.ApprovalStatusId == (int)APPROVAL_STATUS.APPROVED
                                                                                                            && (getVacant == true ? (x.HiringStatusId < (int)HIRING_STATUS.OFFER_ACCEPTED) : true)))
                            ).ToList();

                            if (hiringRequest.HiringStatusId < (int)HIRING_STATUS.OFFER_ACCEPTED && getVacant == true)
                            {
                                childHirings.Add(hiringRequest);
                            }

                            result = _mapper.Map<IEnumerable<MasterDto>>(childHirings);

                        }
                    }
                    else if (_masterType == (int)MASTER_TYPE.ACTIVE_DOMAINMANAGERS)
                    {
                        var _repository = _repositoryFactory.GetRepository<Users>();

                        var response = await _repository.GetListAsync(query => query
                                                                              .Include(x => x.UserRoles!)
                                                                              .ThenInclude(x => x.Role)
                                                                              .Where(x => x.IsActive == (isActive == null ? x.IsActive : isActive)
                                                                                        && (x.UserRoles!.Any(x => x.RoleId == (int)ROLES.DomainManager) || !x.UserRoles!.Any())
                                                                              )
                                                                      );

                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.HRQ_SPECIFIC_PARTNERS)
                    {
                        if (hiringRequestId == null)
                            throw new Exception("HiringRequestId is required");

                        var partnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Include(x => x.SelectedPartners).Where(x => x.HiringRequestId == hiringRequestId))
                        ?? throw new Exception("PartnerCategory is not found with HiringRequestId : " + hiringRequestId);

                        var _repository = _repositoryFactory.GetRepository<Partner>();

                        var response = await _repository.GetListAsync(query => query.Where(x => x.IsActive == true
                        && x.PartnerStatusId == (int)PARTNER_STATUS.ACTIVE
                        ));

                        response = response.ToList().Where(x => partnerCategory.SelectedPartners!.Any(pc => pc.PartnerId == x.Id));

                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.JOB_LEVEL)
                    {
                        var _repository = _repositoryFactory.GetRepository<M_JobLevel>();

                        var response = await _repository.GetListAsync(query => query.Where(x => x.IsActive == true).OrderBy(x => x.OrderId));

                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.CAN_ONHOLD_ROLES)
                    {
                        var _repository = _repositoryFactory.GetRepository<Role>();

                        var response = await _repository.GetListAsync(query => query.Where(x => x.IsActive == true && x.CanOnHold == true));

                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.DOMAIN_SPECIFIC_PARTNERS)
                    {
                        int domainId = 0;

                        var hiringRequest = await _hiringRepository.GetAsync(hiringRequestId);

                        if (hiringRequest != null)
                            domainId = hiringRequest.DomainId ?? 0;

                        var _repository = _repositoryFactory.GetRepository<Partner>();

                        var response = await _repository.GetListAsync(query => query
                                             .Where(x => x.PartnerStatusId == (int)PARTNER_STATUS.ACTIVE || x.PartnerStatusId == (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS));

                        result = _mapper.Map<IEnumerable<MasterDto>>(response);

                        for (int i = 0; i < result.Count(); i++)
                        {
                            var partner = response.ElementAt(i);
                            result.ToList()[i].IsRecommended = partner.DomainIds != null && partner.DomainIds.Contains(domainId);
                        }

                        result = result.OrderByDescending(x => x.IsRecommended);
                    }
                    else if (_masterType == (int)MASTER_TYPE.ACTIVE_RM_OWENER)
                    {
                        var _repository = _repositoryFactory.GetRepository<Users>();
                        var response = await _repository.GetListAsync(query => query.Include(x => x.UserRoles!)
                        .ThenInclude(x => x.Role)
                        .Where(x => x.IsActive == true && x.UserRoles!.Any(x => x.RoleId == (int)ROLES.RMOwner || x.RoleId == (int)ROLES.ADMIN || x.RoleId == (int)ROLES.HIRINGMANAGER)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.PARTNER_HIRING_REQUESTS)
                    {
                        var _repository = _repositoryFactory.GetRepository<HiringRequest>();

                        var response = await _repository.GetListAsync(query => query
                        .Include(x => x.PartnerCategory)
                        .Where(x => x.PartnerCategory != null
                                 && (x.IsParentHRQ == true || x.IsParentHRQ == null) // Include only parent HRQs
                                 && x.PartnerCategory.IsProxyPartner == false
                                 && (x.HiringStatusId == (int)HIRING_STATUS.WIP
                                 || (x.HiringStatusId == (int)HIRING_STATUS.NEW && x.ApprovalStatusId == (int)APPROVAL_STATUS.APPROVED))
                                 && (partnerId == null || x.PartnerCategory.SelectedPartners!.Any(sp => sp.PartnerId == partnerId.Value))
                        ));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.CITY)
                    {
                        //if (stateId == 0) throw new Exception("StateId is required.");
                        var _repository = _repositoryFactory.GetRepository<M_City>();
                        var response = await _repository.GetListAsync(query => query.OrderBy(x => x.Name).Where(x => x.StateId == (stateId == 0 ? x.StateId : stateId)
                        && x.IsActive == (isActive == null ? x.IsActive : isActive)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.COUNTRY)
                    {
                        var _repository = _repositoryFactory.GetRepository<M_Country>();
                        var response = await _repository.GetListAsync(query => query.OrderBy(x => x.Name).Where(x => x.IsActive == (isActive == null ? x.IsActive : isActive)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.DOMAIN)
                    {
                        var _repository = _repositoryFactory.GetRepository<M_Domain>();
                        var response = await _repository.GetListAsync(query => query.Include(x => x.DomainManager).OrderBy(x => x.Name).Where(x => x.IsActive == (isActive == null ? x.IsActive : isActive)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.SKILL)
                    {
                        var _repository = _repositoryFactory.GetRepository<M_Skill>();
                        var response = await _repository.GetListAsync(query => query.OrderBy(x => x.Name).Where(x => x.IsActive == (isActive == null ? x.IsActive : isActive)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.STATE)
                    {
                        if (countryId == 0) throw new Exception("CountryId is required.");
                        var _repository = _repositoryFactory.GetRepository<M_State>();
                        var response = await _repository.GetListAsync(query => query.OrderBy(x => x.Name).Where(x => x.CountryId == countryId && x.IsActive == (isActive == null ? x.IsActive : isActive)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.SUBDOMAIN)
                    {
                        if (domainIds.Count == 0 || domainIds.FirstOrDefault() == 0) throw new Exception("DomainIds are required.");
                        return await GetMasterDataByIdListAsync((int)MASTER_TYPE.SUBDOMAIN, domainIds ?? []);
                    }
                    else if (_masterType == (int)MASTER_TYPE.ACTIVE_PARTNERS)
                    {
                        var _repository = _repositoryFactory.GetRepository<Partner>();
                        var response = await _repository.GetListAsync(query => query.Where(x => x.IsActive == true && x.PartnerStatusId == (int)PARTNER_STATUS.ACTIVE));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.PRIMARY_SKILLS)
                    {
                        var _repository = _repositoryFactory.GetRepository<M_Skill>();
                        var response = await _repository.GetListAsync(query => query.OrderBy(x => x.Name).Where(x => x.IsActive == true && x.IsPrimary == true && x.IsActive == (isActive == null ? x.IsActive : isActive)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.SECONDARY_SKILLS)
                    {
                        var _repository = _repositoryFactory.GetRepository<M_Skill>();
                        var response = await _repository.GetListAsync(query => query.OrderBy(x => x.Name).Where(x => x.IsActive == true && x.IsPrimary == false && x.IsActive == (isActive == null ? x.IsActive : isActive)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.ACTIVE_APPROVERS)
                    {
                        var _repository = _repositoryFactory.GetRepository<Users>();
                        var response = await _repository.GetListAsync(query => query.Include(x => x.UserRoles!).ThenInclude(x => x.Role).Where(x => x.IsActive == true && x.UserRoles!.Any(x => x.RoleId == (int)ROLES.BETApprover)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.ACTIVE_PANEL)
                    {
                        var _repository = _repositoryFactory.GetRepository<Users>();
                        var response = await _repository.GetListAsync(query => query
                                                                              .Include(x => x.UserRoles!)
                                                                              .ThenInclude(x => x.Role)
                                                                              .Where(x => x.IsActive == true
                                                                              ));

                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.ACTIVE_USERS)
                    {
                        var _repository = _repositoryFactory.GetRepository<Users>();
                        var response = await _repository.GetListAsync(query => query.Include(x => x.UserRoles!).ThenInclude(x => x.Role).Where(x => x.IsActive == true));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.ACTIVE_HIRINGMANAGERS)
                    {
                        var _repository = _repositoryFactory.GetRepository<Users>();
                        var response = await _repository.GetListAsync(query => query.Include(x => x.UserRoles!).ThenInclude(x => x.Role).Where(x => x.IsActive == true && x.UserRoles!.Any(x => x.RoleId == (int)ROLES.HIRINGMANAGER)));
                        result = _mapper.Map<IEnumerable<MasterDto>>(response);
                    }
                    else if (_masterType == (int)MASTER_TYPE.HRQ_JOBLOCATIONS)
                    {
                        var mergedCities = await _context.JobDetails
                                          .Where(j => j.HiringRequestId == hiringRequestId)
                                          .Select(j =>
                                              (j.PrimaryCityIds ?? new List<int>())
                                              .Concat(j.SecondaryCityIds ?? new List<int>())
                                          )
                                          .FirstOrDefaultAsync();

                        var validCityIds = mergedCities?.Distinct().ToList() ?? new List<int>();

                        var workLocationsMap = await _context.M_Cities!.Where(c => validCityIds.Contains(c.Id)).ToListAsync();

                        result = _mapper.Map<IEnumerable<MasterDto>>(workLocationsMap);
                    }
                    else
                    {
                        if (_masterType == (int)MASTER_TYPE.INTERVIEW_MODE)
                        {
                            var response = await GetMasterDataByIdListAsync(_masterType, new List<int> { roundNameId ?? 0 });
                            result = _mapper.Map<IEnumerable<MasterDto>>(response);
                        }
                        else
                        {
                            var _repository = _repositoryFactory.GetRepository<M_MasterData>();

                            var response = await _repository.GetListAsync(query => query
                                            .Where(x => x.MasterTypeId == _masterType
                                                  && x.IsActive == (isActive == null ? x.IsActive : isActive)
                            ));

                            result = _mapper.Map<IEnumerable<MasterDto>>(response);
                        }
                    }

                    var cacheOptions = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                        SlidingExpiration = TimeSpan.FromMinutes(2),
                        Priority = CacheItemPriority.Normal
                    };

                    cache.Set($"master_{_masterType}", result, cacheOptions);

                }

                return result ?? [];

            }, "Data fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<CountryMasterDto>>> GetCountryMasterAsync(int? countryId)
        {
            return await ExecuteAsync(async () =>
            {
                var countries = await _countryRepository.GetListAsync(query => query.Include(x => x.States!).ThenInclude(x => x.Cities).Where(x => x.Id == (countryId == null ? x.Id : countryId)));
                return _mapper.Map<IEnumerable<CountryMasterDto>>(countries);
            }, "Data fetched successfully.");
        }

        public Task<ApiResponseDto<string>> ToggleActivationStatusMasterAsync(int? type, int id, bool? isActive)
        {
            return ExecuteAsync(async () =>
            {
                if (type == 0)
                    throw new Exception("Type is required");

                cache.Remove($"master_{type}_true");
                cache.Remove($"master_{type}_false");
                cache.Remove($"master_{type}_");

                if (type == (int)MASTER_TYPE.COUNTRY)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Country>();
                    var item = await _repository.GetAsync(id);
                    if (item != null)
                    {
                        item.IsActive = isActive;
                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.JOB_LEVEL)
                {
                    var _repository = _repositoryFactory.GetRepository<M_JobLevel>();
                    var item = await _repository.GetAsync(id);
                    if (item != null)
                    {
                        item.IsActive = isActive;
                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.STATE)
                {
                    var _repository = _repositoryFactory.GetRepository<M_State>();
                    var item = await _repository.GetAsync(id);
                    if (item != null)
                    {
                        item.IsActive = isActive;
                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.CITY)
                {
                    var _repository = _repositoryFactory.GetRepository<M_City>();
                    var item = await _repository.GetAsync(id);
                    if (item != null)
                    {
                        item.IsActive = isActive;
                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.DOMAIN)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Domain>();
                    var item = await _repository.GetAsync(id);
                    if (item != null)
                    {
                        item.IsActive = isActive;
                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.SUBDOMAIN)
                {
                    var _repository = _repositoryFactory.GetRepository<M_SubDomain>();
                    var item = await _repository.GetAsync(id);
                    if (item != null)
                    {
                        item.IsActive = isActive;
                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.SKILL)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Skill>();
                    var item = await _repository.GetAsync(id);
                    if (item != null)
                    {
                        item.IsActive = isActive;
                        await _repository.UpdateAsync(item);
                    }
                }
                else
                {
                    if (type == null)
                        throw new Exception("MasterTypeId is required.");

                    bool isValid = Enum.IsDefined(typeof(MASTER_TYPE), type!);

                    if (isValid)
                    {
                        var _repository = _repositoryFactory.GetRepository<M_MasterData>();
                        var item = await _repository.GetAsync(id);

                        if (item != null)
                        {
                            item.IsActive = isActive;
                            await _repository.UpdateAsync(item);
                        }
                    }
                    else
                        throw new Exception("MasterTypeId not existed.");
                }
            }, "Item updated successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateMasterAsync(int type, MasterDto master)
        {
            return await ExecuteAsync(async () =>
            {
                if (type == 0)
                    throw new Exception("Type is required");

                cache.Remove($"master_{type}_true");
                cache.Remove($"master_{type}_false");
                cache.Remove($"master_{type}_");

                if (type == (int)MASTER_TYPE.COUNTRY)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Country>();
                    var item = await _repository.GetAsync(master.Id);
                    if (item != null)
                    {
                        item.Id = master.Id;
                        item.Name = master.Name;
                        item.IsActive = master.IsActive ?? true;

                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.JOB_LEVEL)
                {
                    var _repository = _repositoryFactory.GetRepository<M_JobLevel>();
                    var item = await _repository.GetAsync(master.Id);
                    if (item != null)
                    {
                        item.Id = master.Id;
                        item.Name = master.Name;
                        item.StandardRate = master.StandardRate;
                        item.INRStandardRate = master.INRStandardRate;
                        item.ETRate = master.ETRate;
                        item.INRETRate = master.INRETRate;
                        item.IsActive = master.IsActive ?? true;

                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.STATE)
                {
                    var _repository = _repositoryFactory.GetRepository<M_State>();
                    var item = await _repository.GetAsync(master.Id);
                    if (item != null)
                    {
                        item.Id = master.Id;
                        item.Name = master.Name;
                        item.IsActive = master.IsActive ?? true;

                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.CITY)
                {
                    var _repository = _repositoryFactory.GetRepository<M_City>();
                    var item = await _repository.GetAsync(master.Id);
                    if (item != null)
                    {
                        item.Id = master.Id;
                        item.Name = master.Name;
                        item.IsActive = master.IsActive ?? true;

                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.DOMAIN)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Domain>();

                    var userRole = await _userRoleRepository.GetAsync(query => query.Where(x => x.UserId == master.DomainManagerId));

                    if (userRole == null)
                    {
                        await _userRoleRepository.AddAsync(new UserRole()
                        {
                            UserId = master.DomainManagerId,
                            RoleId = (int)ROLES.DomainManager,
                            IsActive = true
                        });
                    }

                    var item = await _repository.GetAsync(master.Id);
                    if (item != null)
                    {
                        item.Id = master.Id;
                        item.Name = master.Name!;
                        item.IsActive = master.IsActive ?? true;
                        item.DomainManagerId = master.DomainManagerId;

                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.SUBDOMAIN)
                {
                    var _repository = _repositoryFactory.GetRepository<M_SubDomain>();

                    var userRole = await _userRoleRepository.GetAsync(query => query.Where(x => x.UserId == master.SubDomainManagerId));

                    if (userRole == null)
                    {
                        await _userRoleRepository.AddAsync(new UserRole()
                        {
                            UserId = master.SubDomainManagerId,
                            RoleId = (int)ROLES.DomainManager,
                            IsActive = true
                        });
                    }

                    var item = await _repository.GetAsync(master.Id);
                    if (item != null)
                    {
                        item.Id = master.Id;
                        item.Name = master.Name;
                        item.IsActive = master.IsActive ?? true;
                        item.SubDomainManagerId = master.SubDomainManagerId;

                        await _repository.UpdateAsync(item);
                    }
                }
                else if (type == (int)MASTER_TYPE.SKILL)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Skill>();
                    var item = await _repository.GetAsync(master.Id);
                    if (item != null)
                    {
                        item.Id = master.Id;
                        item.Name = master.Name;
                        item.IsActive = master.IsActive ?? true;

                        await _repository.UpdateAsync(item);
                    }
                }
                else
                {
                    if (master.MasterTypeId == null)
                        throw new Exception("MasterTypeId is required.");

                    if (type == (int)MASTER_TYPE.JOB_LEVEL)
                    {
                        if (master.ExperienceRange == null)
                            throw new Exception("ExperienceRange is required.");

                        if (master.DefaultExperience == null)
                            throw new Exception("DefaultExperience is required.");
                    }

                    bool isValid = Enum.IsDefined(typeof(MASTER_TYPE), master!.MasterTypeId!);

                    if (isValid)
                    {
                        var _repository = _repositoryFactory.GetRepository<M_MasterData>();
                        var item = await _repository.GetAsync(master.Id);

                        if (item != null)
                        {

                            item.Id = master.Id;
                            item.Name = master.Name;
                            item.IsActive = master.IsActive ?? true;
                            item.DefaultExperience = master.DefaultExperience;
                            item.ExperienceRange = master.ExperienceRange;

                            await _repository.UpdateAsync(item);
                        }
                    }
                    else
                        throw new Exception("MasterTypeId not existed.");
                }
            }, "Item updated successfully.");
        }

        public async Task<ApiResponseDto<string>> DeleteMasterAsync(int type, int id)
        {
            return await ExecuteAsync(async () =>
            {
                if (type == 0)
                    throw new Exception("Type is required");

                if (type == (int)MASTER_TYPE.COUNTRY)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Country>();
                    var item = await _repository.GetAsync(id) ?? throw new Exception($"Country is not found with Id : {id}");

                    await _repository.DeleteAsync(item.Id);
                }
                else if (type == (int)MASTER_TYPE.STATE)
                {
                    var _repository = _repositoryFactory.GetRepository<M_State>();
                    var item = await _repository.GetAsync(id) ?? throw new Exception($"State is not found with Id : {id}"); ;
                    await _repository.DeleteAsync(item.Id);
                }
                else if (type == (int)MASTER_TYPE.CITY)
                {
                    var _repository = _repositoryFactory.GetRepository<M_City>();
                    var item = await _repository.GetAsync(id) ?? throw new Exception($"City is not found with Id : {id}");
                    await _repository.DeleteAsync(item.Id);
                }
                else if (type == (int)MASTER_TYPE.DOMAIN)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Domain>();
                    var item = await _repository.GetAsync(id) ?? throw new Exception($"Domain is not found with Id : {id}");
                    await _repository.DeleteAsync(item.Id);
                }
                else if (type == (int)MASTER_TYPE.SUBDOMAIN)
                {
                    var _repository = _repositoryFactory.GetRepository<M_SubDomain>();
                    var item = await _repository.GetAsync(id) ?? throw new Exception($"SubDomain is not found with Id : {id}");
                    await _repository.DeleteAsync(item.Id);
                }
                else if (type == (int)MASTER_TYPE.SKILL)
                {
                    var _repository = _repositoryFactory.GetRepository<M_Skill>();
                    var item = await _repository.GetAsync(id) ?? throw new Exception($"Skill is not found with Id : {id}");
                    await _repository.DeleteAsync(item.Id);
                }
                else
                {

                    bool isValid = Enum.IsDefined(typeof(MASTER_TYPE), type!);

                    if (isValid)
                    {
                        var _repository = _repositoryFactory.GetRepository<M_MasterData>();
                        var item = await _repository.GetAsync(id) ?? throw new Exception($"Type is not found with Id : {id}");

                        await _repository.DeleteAsync(item.Id);
                    }
                    else
                        throw new Exception("MasterTypeId not existed.");
                }
            }, "Item deleted successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<MasterDto>>> GetSubDomainsMasterAsync(List<int>? domainIds)
        {
            return await ExecuteAsync(async () =>
            {
                if (domainIds?.Count == 0 || domainIds?.FirstOrDefault() == 0) throw new Exception("DomainIds are required.");

                var response = await GetMasterDataByIdListAsync((int)MASTER_TYPE.SUBDOMAIN, domainIds ?? []);

                return response;

            }, "Data fetched successfully.");
        }

        public async Task<IEnumerable<MasterDto>> GetMasterDataByIdListAsync(int? masterTypeId, List<int> idList)
        {
            var result = new List<MasterDto>();

            using (var conn = _context.Database.GetDbConnection())
            {
                await conn.OpenAsync();

                using (var command = conn.CreateCommand())
                {
                    command.CommandText = "GetMasterData";
                    command.CommandType = CommandType.StoredProcedure;

                    var param1 = new SqlParameter("@MasterTypeId", SqlDbType.Int);
                    param1.Value = masterTypeId;
                    command.Parameters.Add(param1);
                    if (masterTypeId == (int)MASTER_TYPE.INTERVIEW_MODE)
                    {
                        var param2 = new SqlParameter("@RoundNameIds", SqlDbType.Structured)
                        {
                            TypeName = "IntListType",
                            Value = IntListTVP.CreateIntListTvp(idList)
                        };
                        command.Parameters.Add(param2);
                    }
                    else if (masterTypeId == (int)MASTER_TYPE.SUBDOMAIN)
                    {
                        var param2 = new SqlParameter("@DomainIds", SqlDbType.Structured)
                        {
                            TypeName = "IntListType",
                            Value = IntListTVP.CreateIntListTvp(idList)
                        };
                        command.Parameters.Add(param2);
                    }

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            result.Add(new MasterDto()
                            {
                                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                                Name = reader.GetString(reader.GetOrdinal("Name")),
                                SubDomainManagerId = reader.GetInt32(reader.GetOrdinal("SubDomainManagerId")),
                                SubDomainManagerName = reader.GetString(reader.GetOrdinal("SubDomainManagerName")),
                                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                            });
                        }
                    }
                }
            }

            return result;
        }

    }
}