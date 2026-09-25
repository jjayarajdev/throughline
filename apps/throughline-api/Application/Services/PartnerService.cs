using AutoMapper;
using ClosedXML.Excel;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS.CandidateBin;
using EpicenterX.Application.DTOs.GetAllMatrix;
using EpicenterX.Application.DTOs.HMS;
using EpicenterX.Application.DTOs.PMS;
using EpicenterX.Application.DTOs.PMS.PartnerOverview;
using EpicenterX.Application.DTOs.PMS.PartnerProfile;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class PartnerService(AppDBContext _context,
                                IGenericRepository<Partner> _partnerRepository,
                                IGenericRepository<PartnerCategory> _partnerCategoryRepository,
                                IGenericRepository<HiringReqPartner> _hiringReqPartnerRepository,
                                IGenericRepository<SOW> _sowRepository,
                                IGenericRepository<Engagement> _engagementRepository,
                                IGenericRepository<HiringRequest> _hiringRepository,
                                IGenericRepository<DocumentDetails> _documentRepository,
                                IConfiguration _configuration,
                                ICommuncationService _communicationService,
                                IGenericRepository<ContactMatrix> _contactMatrixRepository,
                                IGenericRepository<EscalationMatrix> _escalationMatrixRepository,
                                IGenericRepository<Users> _userRepository,
                                IGenericRepository<PartnerApprovalHistory> _partnerApprovalHistoryRepository,
                                IHelperMethods _helperMethods,
                                IApplicationUtilities _applicationUtilities,
                                IMapper _mapper) : BaseService, IPartnerService
    {
        public async Task<ApiResponseDto<PartnerProfileDto>> GetPartnerProfile(string? partnerCode)
        {
            return await ExecuteAsync(async () =>
            {
                List<DocumentDetailDto> documentDetails = [];

                var result = await _partnerRepository.GetAsync(query => query
                .Include(x => x.LastReinitiatedByUser)
                .Include(x => x.CapabilitiesDeckDocuments)
                .Include(x => x.PartnerTire)
                .Include(x => x.Approver)
                .Include(x => x.PartnerEmpanel)
                    .ThenInclude(x => x!.SOWQuoteDocuments)
                .Include(x => x.ContactMatrices!)
                    .ThenInclude(x => x.ContactMatrixType)
                .Include(x => x.ContactMatrices!)
                    .ThenInclude(x => x.Country)
                .Include(x => x.ContactMatrices!)
                    .ThenInclude(x => x.Status)
                .Include(x => x.EscalationMatrices!)
                    .ThenInclude(x => x.EscalationMatrixType)
                .Include(x => x.EscalationMatrices!)
                    .ThenInclude(x => x.Country)
                .Include(x => x.EscalationMatrices!)
                    .ThenInclude(x => x.Status)
                .Include(x => x.Engagements!)
                .ThenInclude(x => x.EngagementType)
                .Include(x => x.Engagements!)
                .ThenInclude(x => x.EvaluationStatus)
                .Include(x => x.Engagements!)
                    .ThenInclude(x => x.EngagementStatus)
                 .Include(x => x.Engagements!)
                    .ThenInclude(x => x.BusinessUnit)
                .Include(x => x.PartnerStatus)
                .Include(x => x.Country)
                .Include(x => x.State)
                .Include(x => x.City)
                .Include(x => x.PartnerCategory)
                .Include(x => x.SOWs!)
                    .ThenInclude(po => po.PODetails!)
                        .ThenInclude(po => po.PO_CRs)
                .Include(x => x.SOWs!)
                    .ThenInclude(po => po.SOW_CRs)
                .Where(x => x.PartnerCode == partnerCode));

                if (result?.CapabilitiesDeckDocuments != null && result?.CapabilitiesDeckDocuments.Count > 0)
                    foreach (var document in result.CapabilitiesDeckDocuments)
                    {
                        documentDetails.Add(new DocumentDetailDto()
                        {
                            AttachmentName = document.AttachmentName,
                            AttachmentURL = document.AttachmentURL,
                        });
                    }

                if (result?.PartnerEmpanel?.SOWQuoteDocuments != null && result?.PartnerEmpanel?.SOWQuoteDocuments.Count > 0)
                    foreach (var document in result.PartnerEmpanel.SOWQuoteDocuments)
                    {
                        documentDetails.Add(new DocumentDetailDto()
                        {
                            AttachmentName = document!.AttachmentName,
                            AttachmentURL = document!.AttachmentURL,
                        });
                    }

                var partnerProfiles = await _context.CandidateForms
                                            .Where(c => c.PartnerId != null)
                                            .GroupBy(c => c.Partner!)
                                            .Select(g => new PartnerProfileDto
                                            {
                                                TotalProfileSubmitted = g.Count(),
                                                TotalClosures = g.Count(c => c.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.ONBOARDED),
                                                PartnerDetails = new GetPartnerDto
                                                {
                                                    Id = g.Key.Id,
                                                    PartnerName = g.Key.PartnerName,
                                                    PartnerCode = g.Key.PartnerCode
                                                }
                                            })
                                            .ToListAsync();

                // Dynamically calculate Score & Rank
                var rankedPartners = partnerProfiles.Select(p =>
                {
                    double score = 5 * p.TotalClosures + 2 * Math.Log(p.TotalProfileSubmitted == 0 ? 1 : p.TotalProfileSubmitted)
                                   + 1 * (p.TotalProfileSubmitted == 0 ? 0 : (double)p.TotalClosures / p.TotalProfileSubmitted);

                    p.Rank = 0; // Temp, will set in next step
                    return (Profile: p, Score: score);
                })
                                                                    .OrderByDescending(p => p.Score)
                                                                    .Select((p, index) =>
                                                                    {
                                                                        p.Profile.Rank = index + 1;
                                                                        return p.Profile;
                                                                    })
                                                                    .ToList();

                var partnerDto = _mapper.Map<GetPartnerDto>(result);

                if (partnerDto != null)
                    partnerDto.PartnerTenureInDays = result != null ? _applicationUtilities.CalculateTatDays(result.CreatedAt ?? DateTime.UtcNow, null) : 0;

                var currentPartner = rankedPartners.FirstOrDefault(x => x.PartnerDetails!.Id == result!.Id);

                return new PartnerProfileDto()
                {
                    PartnerDetails = partnerDto,
                    PartnerDocuments = documentDetails,
                    TotalClosures = currentPartner?.TotalClosures ?? 0,
                    TotalProfileSubmitted = currentPartner?.TotalProfileSubmitted ?? 0,
                    Rank = currentPartner?.Rank ?? 0,
                };

            }, "Partners fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<PartnerGridViewDto>>> GetPagedPartners(PageDto pageData, List<int>? statusId, bool? isVMApproved)
        {
            return await ExecuteAsync(async () =>
               {
                   var result = await _partnerRepository.GetPaginatedListWithJoinQueryAsync<PartnerGridViewDto>(pageData,
                       query => from partner in query

                                join approver in _context.Users on partner.ApprovedBy equals approver.UserId into approvers
                                from approver in approvers.DefaultIfEmpty()

                                join status in _context.M_MasterData on partner.PartnerStatusId equals status.Id into statuses
                                from status in statuses.DefaultIfEmpty()

                                join partnerCategory in _context.M_MasterData on partner.PartnerCategoryId equals partnerCategory.Id into partnerCategories
                                from partnerCategory in partnerCategories.DefaultIfEmpty()

                                join partnerTire in _context.M_MasterData on partner.PartnerTireId equals partnerTire.Id into partnerTires
                                from partnerTire in partnerTires.DefaultIfEmpty()

                                orderby (partner.UpdatedAt ?? partner.CreatedAt ?? DateTime.MinValue) descending,
                                partner.Id descending

                                where isVMApproved == false ? partner.PartnerStatusId == null :
                                                            (statusId != null && statusId.Any() && statusId.Contains(partner.PartnerStatusId ?? 0))

                                select new PartnerGridViewDto
                                {
                                    Id = partner.Id,
                                    PartnerCode = partner.PartnerCode,
                                    StartDate = partner.StartDate,
                                    PartnerName = partner.PartnerName,
                                    Nickname = partner.Nickname,
                                    EngagementTypeName = string.Join(", ", partner.Engagements!.Where(x => x.EvaluationStatusId != (int)EVALUATION_STATUS.REJECTED).Select(e => e.EngagementType!.Name)),
                                    PartnerStatusName = partner.PartnerStatus!.Name,
                                    ApproverName = approver.FullName,
                                    ApprovedStatus = partner.ApprovedStatus,
                                    IsReintiated = !partner.ApprovedStatus,
                                    IsEmpaneled = partner.IsEmpaneledEnabled,
                                    PartnerCategoryName = partnerCategory.Name,
                                    PartnerTireName = partnerTire.Name
                                });

                   return result;

               }, "Partners fetched successfully.");
        }


        public async Task<ApiResponseDto<PagedResult<LabourHRQDetailDto>>> GetPagedHReqOpenList(PageDto pagedata, int? partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var partner = await _partnerRepository.GetAsync(partnerId);
                var closedStatuses = new[] { (int)HIRING_STATUS.CLOSED, (int)HIRING_STATUS.CANCELLED };
                var openStatuses = new[] { (int)HIRING_STATUS.CANDIDATE_IDENTIFIED, (int)HIRING_STATUS.WIP };

                var result = await _hiringRepository.GetPaginatedListWithJoinQueryAsync<LabourHRQDetailDto>(
                    pagedata,
                    query => from hiring in query

                             join status in _context.M_MasterData on hiring.HiringStatusId equals status.Id into statuses
                             from status in statuses.DefaultIfEmpty()

                             join jobDetails in _context.JobDetails on hiring.Id equals jobDetails.HiringRequestId into jobDetailsGroup
                             from jobDetails in jobDetailsGroup.DefaultIfEmpty()

                             join partnerCategory in _context.PartnerCategories on hiring.Id equals partnerCategory.HiringRequestId into partnerCategoriesGroup
                             from partnerCategory in partnerCategoriesGroup.DefaultIfEmpty()

                             join resourceType in _context.M_MasterData on jobDetails.ResourceTypeId equals resourceType.Id into resourceTypeGroup
                             from resourceType in resourceTypeGroup.DefaultIfEmpty()

                             join rmOwner in _context.Users on hiring.RmOwnerId equals rmOwner.UserId into rmOwnerGroup
                             from rmOwner in rmOwnerGroup.DefaultIfEmpty()

                             where hiring.HiringStatusId == (int)HIRING_STATUS.WIP
                                 && partner != null && partner.DomainIds.Contains(hiring.DomainId ?? 0)
                                 && hiring.IsParentHRQ == true
                                 && partnerCategory != null
                                 && partnerCategory.IsProxyPartner != true

                             orderby (hiring.UpdatedAt ?? hiring.CreatedAt ?? DateTime.MinValue) descending, hiring.Id descending

                             select new LabourHRQDetailDto
                             {
                                 IsAssignedTothePartner = partnerCategory.SelectedPartners.Any(x => x.PartnerId == partnerId),
                                 HiringRequestId = hiring.Id,
                                 HrqId = hiring.HrqId,
                                 JobTitle = hiring.JobTitle,
                                 RMOwnerName = rmOwner.FullName,
                                 NoOfPositions = hiring.NumberOfPositions ?? 1,
                                 Experience = jobDetails.RelevantExperience,
                                 ResourceTypeName = resourceType.Name,
                                 DomainName = hiring.Domain.Name,

                                 OpenPositions = _context.Hiring.Count(h =>
                                   (h.ParentHrqId == hiring.HrqId || h.HrqId == hiring.HrqId) &&
                                   openStatuses.Contains(h.HiringStatusId ?? 0)),

                                 ClosedPositions = _context.Hiring.Count(h =>
                                    (h.ParentHrqId == hiring.HrqId || h.HrqId == hiring.HrqId) &&
                                     closedStatuses.Contains(h.HiringStatusId ?? 0))
                             });

                // Removeing which are completely closed.
                result.Items = result.Items.Where(x => x.NoOfPositions != x.ClosedPositions);

                return result;

            }, "Open HReqs successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<DocumentDetailDto>>> GetPagedPartnerCapabilityDocuments(PageDto pagedata, int? partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _documentRepository.GetPaginatedListAsync(pagedata,
                query => query.Where(x => x.PartnerId == partnerId));

                return new PagedResult<DocumentDetailDto>(_mapper.Map<List<DocumentDetailDto>>(result.Items), result.TotalCount, result.PageSize, result.CurrentPage);

            }, "Partners fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetPartnerDto>>> GetPartners()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _partnerRepository.GetListAsync(query => query
                .Include(x => x.CapabilitiesDeckDocuments!)
                .Include(x => x.PartnerTire)
                .Include(x => x.Approver)
                .Include(x => x.PartnerEmpanel!)
                       .Include(x => x.Engagements!)
                       .ThenInclude(x => x.EngagementType)
                       .Include(x => x.PartnerStatus)
                       .Include(x => x.Country)
                       .Include(x => x.State)
                       .Include(x => x.City)
                       .Include(x => x.ServicingCountry)
                       .Include(x => x.PartnerCategory)
                       );
                return _mapper.Map<IEnumerable<GetPartnerDto>>(result);
            }, "Partners list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetPartnerDto>> GetPartner(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _partnerRepository.GetAsync(query => query
                       .Include(x => x.CapabilitiesDeckDocuments!)
                       .Include(x => x.Approver)
                       .Include(x => x.PartnerTire)
                       .Include(x => x.Engagements!)
                       .ThenInclude(x => x.EngagementType)
                       .Include(x => x.PartnerEmpanel!)
                       .Include(x => x.PartnerStatus)
                       .Include(x => x.Country)
                       .Include(x => x.State)
                       .Include(x => x.ServicingCountry)
                       .Include(x => x.PartnerCategory)
                       .Include(x => x.City).Where(x => x.Id == id)) ?? throw new Exception($"Partner is not found with Id : {id}");

                if (result?.CapabilitiesDeckDocuments?.Any() == true)
                {
                    result.CapabilitiesDeckDocuments = [.. result.CapabilitiesDeckDocuments
                        .OrderByDescending(d => d.UpdatedAt ?? d.CreatedAt)
                        .Take(1)];
                }

                var resultDto = _mapper.Map<GetPartnerDto>(result);

                if (resultDto?.Engagements?.Count > 0)
                {
                    var latestEngagement = resultDto.Engagements
                        .OrderByDescending(e => (e.IsExtendedEvaluation == true ? e.EvaluationExtendedDate : e.EvaluationEndDate))
                        .FirstOrDefault();

                    if (latestEngagement != null)
                    {
                        var finalDate = latestEngagement.IsExtendedEvaluation == true ? latestEngagement.EvaluationExtendedDate : latestEngagement.EvaluationEndDate;

                        // Set latest engagement details
                        resultDto.LatestEngagementId = latestEngagement.Id;
                        resultDto.LatestEngagementEvaluationEndDate = finalDate;

                        // Check if expired
                        resultDto.IsEngagementExpired = finalDate < DateTime.UtcNow.Date;
                    }
                }

                return resultDto != null ? resultDto : throw new Exception($"Error getting partner details with Id : {id}");

            }, "Partner fetched successfully.");
        }



        public async Task<ApiResponseDto<GetPartnerDto>> AddPartner(AddPartnerDto partnerDto)
        {
            return await ExecuteAsync(async () =>
            {

                var partnerEntity = _mapper.Map<Partner>(partnerDto);

                // Partner Status intially set to null, it will be updated after approved
                partnerEntity.PartnerStatusId = null;

                var addedEntity = await _partnerRepository.AddAsync(partnerEntity);

                if (addedEntity != null)
                {
                    var approverList = await _userRepository.GetListAsync(query => query.Include(x => x.UserRoles!).ThenInclude(x => x.Role).Where(x => x.IsActive == true && x.UserRoles!.Any(x => x.RoleId == (int)ROLES.BETApprover)));

                    foreach (var approver in approverList)
                    {
                        try
                        {
                            //  var templateDetails = await _emailTemplateService.GetTemplateByName();
                            var partnerDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(addedEntity, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                },


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

                            var adminUser = await _userRepository.GetAsync(query => query.Where(x => x.UserId == addedEntity.CreatedBy));
                            var adminDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(adminUser, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "Admin.");

                            var dictionary = Utility.Utility.Merge(Utility.Utility.Merge(partnerDict, hiringDict), adminDict);

                            var toEmail = approver.Email;

                            var link = _configuration["ClientHostName"] + "/home/partner-onboarding/partner-profile/" + addedEntity.PartnerCode;
                            dictionary.Add("ProfileLink", link);

                            await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerApprovalNotification, toEmail,
                              dictionary);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine(ex.Message);
                            //throw new Exception("Email failed to send to the Approvel email :" + approver.Email);
                        }
                    }
                }

                return _mapper.Map<GetPartnerDto>(addedEntity);
            }, "Partner added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdatePartner(AddPartnerDto partner)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _partnerRepository.GetAsync(query => query
                                                               .Include(x => x.CapabilitiesDeckDocuments)
                                                               .Where(x => x.Id == partner.Id))
                ?? throw new Exception($"Partner is not found with Id : {partner.Id}");

                //mapping fields
                result.IsActive = partner.IsActive;
                result.PartnerName = partner.PartnerName;
                result.Nickname = partner.Nickname;
                result.StartDate = partner.StartDate;
                result.CountryId = partner.CountryId;
                result.StateId = partner.StateId;
                result.CityId = partner.CityId;
                result.Address = partner.Address;
                result.Pincode = partner.Pincode;
                result.DomainIds = partner.DomainIds;
                result.SubDomainIds = partner.SubDomainIds;
                result.SkillIds = partner.SkillIds;
                result.PartnerCategoryId = partner.PartnerCategoryId;
                result.ServicingCountryId = partner.ServicingCountryId;
                result.PartnerTireId = partner.PartnerTireId;

                partner.CapabilitiesDeckDocuments = partner.CapabilitiesDeckDocuments?.Where(x => x.Id == 0).ToList();
                result.CapabilitiesDeckDocuments = _mapper.Map<List<DocumentDetails>>(partner.CapabilitiesDeckDocuments);

                await _partnerRepository.UpdateAsync(result);

            }, "Partner updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ChangePartnerStatus(ReIntiatePartnerDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();
                var result = await _partnerRepository.GetAsync(dto.PartnerId) ?? throw new Exception($"Partner is not found with Id : {dto.PartnerId}");

                result.PartnerStatusId = dto.PartnerStatusId;

                if (dto.PartnerStatusId == (int)PARTNER_STATUS.ACTIVE)
                {
                    result.LastActivatedDate = DateTime.UtcNow;
                    result.LastReinitiatedBy = loggedInUserDetails.UserId;
                    result.LastReinitiatedByUserComments = dto.Comments;

                    if (dto.IsExtendedEvaluation == true)
                    {
                        var engagement = await _engagementRepository.GetAsync(dto.EngagementId);
                        if (engagement != null)
                        {
                            engagement.IsExtendedEvaluation = true;
                            engagement.EvaluationExtendedDate = dto.ExtendedEvaluationDate;
                            await _engagementRepository.UpdateAsync(engagement, false);
                        }
                    }
                }

                await _partnerRepository.UpdateAsync(result, false);

            }, "Partner updated successfully.");
        }

        public async Task<int> GetPartnerStatusWhenUnfreeze(int? partnerId)
        {
            var result = await _partnerRepository.GetAsync(partnerId) ?? throw new Exception($"Partner is not found with Id : {partnerId}");
            return result.IsEmpaneledEnabled == true ? (int)PARTNER_STATUS.ACTIVE : (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS;
        }

        public async Task<ApiResponseDto<string>> ApproveOrRejectPartner(int partnerId, ApprovePartnerDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var partner = await _partnerRepository.GetAsync(partnerId) ?? throw new Exception($"Partner is not found with Id : {partnerId}");
                var template = PartnerEmailTemplateEnums.RMAcceptedNotification;

                partner.ApprovedBy = dto.ApprovedBy;
                partner.ApprovedStatus = dto.ApprovedStatus;
                partner.ApprovedDate = DateTime.UtcNow;

                // Set Partner Status based on Approval Status (If Approved then Partner goes to evaluation in progrees else null)
                partner.PartnerStatusId = dto.ApprovedStatus == true ? (int)PARTNER_STATUS.EVALUATION_IN_PROGRESS : null;

                await _partnerRepository.UpdateAsync(partner);

                await _partnerApprovalHistoryRepository.AddAsync(new PartnerApprovalHistory()
                {
                    IsReinitiated = dto.IsReintiated,
                    PartnerStatus = dto.ApprovedStatus == true ? "Approved" : "Rejected",
                    Comments = dto.Comments,
                    PartnerId = partnerId
                });

                try
                {
                    if (dto.ApprovedStatus == true)
                    {
                        template = PartnerEmailTemplateEnums.RMAcceptedNotification;
                    }
                    else
                    {
                        template = PartnerEmailTemplateEnums.RMRejectedNotification;
                    }

                    var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));
                    if (contact.Count() > 0)
                    {
                        var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

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

                        var dictionary = Utility.Utility.Merge(partnerDict, hiringDict);

                        var ccEmail = approver.Email;
                        var toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                        if (toEmail == null)
                        {
                            toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                        }

                        var link = _configuration["ClientHostName"] + "/home/partner-onboarding/partner-profile/" + partner.PartnerCode;
                        dictionary.Add("ProfileLink", link);
                        await _communicationService.AddNotification((int)template, toEmail, dictionary
                            );
                    }
                }
                catch (Exception ex)
                { }

            }, $"Partner {(dto.ApprovedStatus == true ? "approved" : "rejected")} successfully.");
        }

        public async Task<ApiResponseDto<string>> SubmitPartner(int partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                bool isEmailSent = false;

                var result = await _partnerRepository.GetAsync(partnerId) ?? throw new Exception($"Partner is not found with Id : {partnerId}");

                var response = await _userRepository.GetListAsync(query => query.Include(x => x.UserRoles!).ThenInclude(x => x.Role).Where(x => x.IsActive == true && x.UserRoles!.Any(x => x.RoleId == (int)ROLES.BETApprover)));

                if (result.IsEmailSent == false || result.IsEmailSent == null)
                {
                    foreach (var approver in response)
                    {
                        try
                        {
                            //await _emailService.SendEmailViaAzureAsync(approver.Email!, (int)NOTIFICATION_CATEGORY.PARTNER_APPROVAL, new TokensDto()
                            //{
                            //    RequestId = result.PartnerCode,
                            //    Approver = approver.FirstName + " " + approver.LastName
                            //});

                            // var templateDetails = await _emailTemplateService.GetTemplateByName(PartnerEmailTemplateEnums.PartnerApprovalNotification.ToString());

                            //var toEmail = approver.Email;
                            //await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerApprovalNotification, toEmail,
                            //    Utility.Utility.FlattenJsonToDictionary(JsonConvert.SerializeObject(result)));

                            isEmailSent = true;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine(ex.Message);
                            throw new Exception("Email failed to send to the Approvel email :" + approver.Email);
                        }
                    }

                    result.IsEmailSent = isEmailSent;
                    await _partnerRepository.UpdateAsync(result);
                }

            }, "Partner Submitted successfully.");
        }

        public async Task<ApiResponseDto<string>> UnfreezePartner(int partnerId, int? userId)
        {
            return await ExecuteAsync(async () =>
            {
                var allowedRoles = new[] { (int)ROLES.ADMIN, (int)ROLES.HIRINGMANAGER, (int)ROLES.RMOwner };

                var validRole = _context.UserRolesMapping
                    .Any(x => x.UserId == userId && allowedRoles.Contains(x.RoleId ?? 0));

                if (validRole == false)
                    throw new Exception("The current user has no privilizes to unfreeze partner");

                var result = await _partnerRepository.GetAsync(partnerId) ?? throw new Exception($"Partner is not found with Id : {partnerId}");
                result.PartnerStatusId = await GetPartnerStatusWhenUnfreeze(partnerId);
                await _partnerRepository.UpdateAsync(result);

            }, "Partner Unfreezed successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetPartnerDto>>> GetPagedPartnersWithPODetails(List<int> statusId, PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _partnerRepository.GetPaginatedListAsync(
                        pageData,
                        query => query!
                            .Include(x => x.Approver)
                            .Where(x => x.PartnerStatusId == (int)PARTNER_STATUS.ACTIVE)
                            .Where(x => x.SOWs!.Any(sow =>
                                (statusId.Contains((int)SOW_STATUS.ACTIVE) && sow.Status == true) ||
                                (statusId.Contains((int)SOW_STATUS.INACTIVE) && sow.Status == false) ||
                                (statusId.Contains((int)SOW_STATUS.ABOUT_TO_EXPIRE) &&
                                    sow.EndDate != null &&
                                    sow.EndDate <= DateTime.UtcNow.AddDays(30) &&
                                    sow.Status == true)
                            ))
                            .Include(x => x.SOWs!)
                                .ThenInclude(sow => sow.PODetails)
                );

                var partnerDtos = _mapper.Map<IEnumerable<GetPartnerDto>>(result.Items.DistinctBy(x => x.PartnerCode));

                return new PagedResult<GetPartnerDto>(partnerDtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Partners fetched successfully.");
        }


        public async Task<byte[]> ExportAllPartnersToExcel(PageDto pageData, List<int> statusId, bool? isVMApproved)
        {
            var partners = await _partnerRepository.GetListAsync(
     query => query!
         .Include(x => x.Approver)
         .Include(x => x.PartnerTire)
         .Include(x => x.PartnerStatus)
         .Include(x => x.Engagements)
             .ThenInclude(e => e.EngagementType)
         .Where(x => isVMApproved == false ? x.PartnerStatusId == null :
                     (statusId != null && statusId.Any() && statusId.Contains(x.PartnerStatusId ?? 0)))
 );

            if (statusId != null && statusId.Any())
            {
                foreach (var partner in partners)
                {
                    partner.SOWs = partner.SOWs?.Where(sow => (statusId.Contains((int)SOW_STATUS.ACTIVE) && sow.Status == true) ||
                                                              (statusId.Contains((int)SOW_STATUS.INACTIVE) && sow.Status == true) ||
                                                              (statusId.Contains((int)SOW_STATUS.ABOUT_TO_EXPIRE) && sow.EndDate != null && sow.EndDate <= DateTime.UtcNow.AddDays(30) && sow.Status == true)
                        ).ToList();
                }
            }

            var partnerDtos = _mapper.Map<IEnumerable<GetPartnerDto>>(partners.DistinctBy(x => x.PartnerCode));

            partnerDtos = PaginationHelper.GetSortedResult(partnerDtos, pageData.SortColumns);

            var allSkillIds = partnerDtos
                              .Where(p => p.SkillIds != null && p.SkillIds.Any())
                              .SelectMany(p => p.SkillIds)
                              .Distinct()
                              .ToList();

            var skills = await _context.M_Skills
                .Where(s => allSkillIds.Contains(s.Id))
                .ToListAsync();

            var skillDict = skills.ToDictionary(s => s.Id, s => s.Name);
            var allDomainIds = partnerDtos
                            .Where(p => p.DomainIds != null && p.DomainIds.Any())
                            .SelectMany(p => p.DomainIds)
                            .Distinct()
                            .ToList();

            var allSubDomainIds = partnerDtos
                                .Where(p => p.SubDomainIds != null && p.SubDomainIds.Any())
                                .SelectMany(p => p.SubDomainIds)
                                .Distinct()
                                .ToList();

            var domainDict = await _context.M_Domains
                            .Where(d => allDomainIds.Contains(d.Id))
                            .ToDictionaryAsync(d => d.Id, d => d.Name);

            var subDomainDict = await _context.M_SubDomains
                                .Where(sd => allSubDomainIds.Contains(sd.Id))
                                .ToDictionaryAsync(sd => sd.Id, sd => sd.Name);


            foreach (var partner in partnerDtos)
            {

                partner.DomainNames = partner.DomainIds != null && partner.DomainIds.Any()
                    ? string.Join(", ", partner.DomainIds.Where(id => domainDict.ContainsKey(id)).Select(id => domainDict[id]))
                    : string.Empty;

                partner.SubDomainNames = partner.SubDomainIds != null && partner.SubDomainIds.Any()
                    ? string.Join(", ", partner.SubDomainIds.Where(id => subDomainDict.ContainsKey(id)).Select(id => subDomainDict[id]))
                    : string.Empty;

                if (partner.SkillIds != null && partner.SkillIds.Any())
                {
                    partner.SkillNames = string.Join(", ",
                        partner.SkillIds.Where(id => skillDict.ContainsKey(id))
                                        .Select(id => skillDict[id]));
                }
                else
                {
                    partner.SkillNames = string.Empty;
                }
            }
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Partners");

            var headers = new[] { "Partner Code", "Partner Name", "ApproverName", "PartnerStatus", "ApprovedDate", "Approver Name", "Skills", "Domains", "SubDomains", "EngagementTypeName", "Tire Category" };

            for (int i = 0; i < headers.Length; i++)
            {
                var headerCell = ws.Cell(1, i + 1);
                headerCell.Value = headers[i];
                ws.Column(i + 1).Width = 25;

                headerCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                headerCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                headerCell.Style.Font.Bold = true;
                headerCell.Style.Font.FontColor = XLColor.White;
                headerCell.Style.Fill.BackgroundColor = XLColor.Green;
            }

            int row = 2;
            foreach (var partner in partnerDtos)
            {
                ws.Cell(row, 1).Value = partner.PartnerCode;
                ws.Cell(row, 2).Value = partner.PartnerName;
                ws.Cell(row, 3).Value = partner.ApproverName;
                ws.Cell(row, 4).Value = partner.PartnerStatusName;
                ws.Cell(row, 5).Value = partner.ApprovedDate?.Date;
                ws.Cell(row, 5).Style.DateFormat.Format = "dd-MMM-yyyy";
                ws.Cell(row, 6).Value = partner.ApproverName;
                ws.Cell(row, 7).Value = !string.IsNullOrEmpty(partner.SkillNames) ? partner.SkillNames : string.Empty;
                ws.Cell(row, 8).Value = !string.IsNullOrEmpty(partner.DomainNames) ? partner.DomainNames : string.Empty;
                ws.Cell(row, 9).Value = !string.IsNullOrEmpty(partner.SubDomainNames) ? partner.SubDomainNames : string.Empty;
                ws.Cell(row, 10).Value = partner.Engagements != null && partner.Engagements.Any()
     ? string.Join(", ",
         partner.Engagements
                .Where(e => e.EvaluationStatusId != (int)EVALUATION_STATUS.REJECTED)
                .Select(e => e.EngagementTypeName)
                .Where(n => !string.IsNullOrEmpty(n))
                .Distinct())
     : string.Empty;

                ws.Cell(row, 11).Value = partner.PartnerTireName;
                row++;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }



        public async Task<ApiResponseDto<string>> UpdatePartnerEmpanelStatus(int? partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var sendEmail = false;
                var template = (int)PartnerEmailTemplateEnums.PartnerEmpaneledCompleted;
                var engagements = await _engagementRepository.GetListAsync(query => query.Where(x => x.PartnerId == partnerId)) ?? throw new Exception($"Partner is not found with Id : {partnerId}");

                var partner = await _partnerRepository.GetAsync(partnerId);

                foreach (var engagement in engagements)
                {
                    if (engagement.EvaluationStatusId == (int)EVALUATION_STATUS.COMPLETED || engagement.EvaluationStatusId == (int)EVALUATION_STATUS.EMPANELLED || engagement.EvaluationStatusId == (int)EVALUATION_STATUS.REJECTED)
                    {
                        partner.PartnerStatusId = (int)PARTNER_STATUS.ACTIVE;

                        if (engagement.EvaluationStatusId == (int)EVALUATION_STATUS.COMPLETED)
                        {
                            partner.IsEmpaneledEnabled = true;
                            sendEmail = true;
                            template = (int)PartnerEmailTemplateEnums.PartnerEmpaneledCompleted;
                            break;
                        }

                        if (engagement.EvaluationStatusId == (int)EVALUATION_STATUS.REJECTED)
                        {
                            template = (int)PartnerEmailTemplateEnums.PartnerEmpaneledRejected;
                            sendEmail = true;
                        }
                    }
                }

                await _partnerRepository.UpdateAsync(partner, false);

                if (sendEmail)
                {

                    foreach (var engagement in partner.Engagements)
                    {
                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));

                        var toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                        if (toEmail == null)
                        {
                            toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                        }

                        var dictionary = Utility.Utility.FlattenJsonToDictionary(JsonConvert.SerializeObject(engagement));
                        var user = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                        var ccEmail = user.Email;
                        dictionary.Add("EngagementType.Name", engagement.EngagementType.Name);
                        var link = _configuration["ClientHostName"] + "/home/partner-onboarding/edit-partner?id=" + partner.Id;
                        dictionary.Add("ProfileLink", link);

                        await _communicationService.AddNotification(template, toEmail,
                            dictionary, ccEmail);
                    }
                }
            }, "Partners fetched successfully.");
        }


        public async Task<ApiResponseDto<PagedResult<MatrixDto>>> GetAllMatricesByStatus(CONTACT_MATRIX_STATUS status, PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {

                var contactMatrices = await _contactMatrixRepository.GetListAsync(
                    query => query
                        .Include(x => x.Partner)
                        .Include(x => x.ContactMatrixType)
                        .Include(x => x.Country)
                        .Include(x => x.Status)
                        .Where(x => x.ApprovalStatusId == (int)status));

                var escalationMatrices = await _escalationMatrixRepository.GetListAsync(
                    query => query
                        .Include(x => x.Partner)
                        .Include(x => x.EscalationMatrixType)
                        .Include(x => x.Country)
                        .Include(x => x.Status)
                        .Where(x => x.ApprovalStatusId == (int)status));

                var contactDtos = _mapper.Map<IEnumerable<MatrixDto>>(contactMatrices)
                    .Select(dto => { dto.Type = MATRIX_TYPE.CONTACT_MATRIX; return dto; });
                var escalationDtos = _mapper.Map<IEnumerable<MatrixDto>>(escalationMatrices)
                    .Select(dto => { dto.Type = MATRIX_TYPE.ESCALATION_MATRIX; return dto; });

                var result = contactDtos.Concat(escalationDtos);

                return PaginationHelper.GetPagedResult<MatrixDto>(pageData, result);
            }, "Matrices fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<SOWMatrix>>> GetAllSOWMatricesByStatus(CONTACT_MATRIX_STATUS status, PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var sowMatrices = await _sowRepository.GetListAsync(
                    query => query
                        .Include(x => x.Partner)
                        .Where(x => x.ApprovalStatusId == (int)status));

                var sowDtos = _mapper.Map<IEnumerable<SOWMatrix>>(sowMatrices);

                return PaginationHelper.GetPagedResult<SOWMatrix>(pageData, sowDtos);
            }, "SOW Matrices fetched successfully.");
        }


        public async Task<ApiResponseDto<string>> ApproveMatrix(ApproveMatrixDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                if (dto.Type == MATRIX_TYPE.CONTACT_MATRIX)
                {
                    var matrix = await _contactMatrixRepository.GetAsync(q => q.Where(x => x.Id == dto.Id))
                        ?? throw new Exception($"Contact matrix not found with Id: {dto.Id}");

                    // update based on approval
                    if (dto.NewStatus == CONTACT_MATRIX_STATUS.APPROVED)
                    {
                        matrix.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                        matrix.StatusId = (int)ACTIVE_STATUS.ACTIVE;
                    }
                    else if (dto.NewStatus == CONTACT_MATRIX_STATUS.PENDING)
                    {
                        matrix.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.PENDING;
                        matrix.StatusId = (int)ACTIVE_STATUS.INACTIVE;
                    }
                    else if (dto.NewStatus == CONTACT_MATRIX_STATUS.REJECTED)
                    {
                        matrix.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.REJECTED;
                        matrix.StatusId = (int)ACTIVE_STATUS.INACTIVE;
                    }

                    matrix.UpdatedAt = DateTime.UtcNow;
                    await _contactMatrixRepository.UpdateAsync(matrix);
                }
                else if (dto.Type == MATRIX_TYPE.ESCALATION_MATRIX)
                {
                    var matrix = await _escalationMatrixRepository.GetAsync(q => q.Where(x => x.Id == dto.Id))
                        ?? throw new Exception($"Escalation matrix not found with Id: {dto.Id}");

                    if (dto.NewStatus == CONTACT_MATRIX_STATUS.APPROVED)
                    {
                        matrix.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                        matrix.StatusId = (int)ACTIVE_STATUS.ACTIVE;
                    }
                    else if (dto.NewStatus == CONTACT_MATRIX_STATUS.PENDING)
                    {
                        matrix.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.PENDING;
                        matrix.StatusId = (int)ACTIVE_STATUS.INACTIVE;
                    }
                    else if (dto.NewStatus == CONTACT_MATRIX_STATUS.REJECTED)
                    {
                        matrix.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.REJECTED;
                        matrix.StatusId = (int)ACTIVE_STATUS.INACTIVE;
                    }

                    matrix.UpdatedAt = DateTime.UtcNow;
                    await _escalationMatrixRepository.UpdateAsync(matrix);
                }
                else
                {
                    throw new Exception("Invalid matrix type.");
                }
            }, "Matrix approval updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ApproveSOWMatrix(ApproveMatrixDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var matrix = await _sowRepository.GetAsync(q => q.Where(x => x.Id == dto.Id))
                    ?? throw new Exception($"SOW matrix not found with Id: {dto.Id}");

                if (dto.NewStatus == CONTACT_MATRIX_STATUS.APPROVED)
                {
                    matrix.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                    matrix.Status = true;
                }
                else if (dto.NewStatus == CONTACT_MATRIX_STATUS.PENDING)
                {
                    matrix.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.PENDING;
                    matrix.Status = false;
                }
                else if (dto.NewStatus == CONTACT_MATRIX_STATUS.REJECTED)
                {
                    matrix.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.REJECTED;
                    matrix.Status = false;
                }

                matrix.UpdatedAt = DateTime.UtcNow;
                await _sowRepository.UpdateAsync(matrix);

            }, "SOW matrix approval updated successfully.");
        }

        public async Task<ApiResponseDto<string>> AssignOpenHiringListToPartner(int partnerId, AssignOpenHiringListDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var partner = await _partnerRepository.GetAsync(partnerId) ?? throw new Exception("Invalid partnerId.");

                if (dto.HiringList?.Count > 0)
                {
                    List<HiringReqPartner> assignlist = [];

                    foreach (var hiringRequestId in dto.HiringList)
                    {
                        var partnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Where(x => x.HiringRequestId == hiringRequestId));

                        if (await _hiringReqPartnerRepository.GetAsync(query => query.Where(x => x.PartnerId == partnerId && x.PartnerCategoryId == partnerCategory.Id)) == null)
                        {
                            assignlist.Add(new HiringReqPartner()
                            {
                                AssignedOn = DateTime.Now,
                                PartnerId = partnerId,
                                PartnerCategoryId = partnerCategory.Id
                            });
                        }
                    }

                    if (assignlist.Count > 0)
                        await _hiringReqPartnerRepository.AddListAsync(assignlist);
                }


            }, "Open hiring requests added to partner successfully.");
        }
    }
}
