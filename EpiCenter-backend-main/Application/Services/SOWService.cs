using AutoMapper;
using DocumentFormat.OpenXml.Office2010.Excel;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS;
using EpicenterX.Application.DTOs.PMS.ContactMatrix;
using EpicenterX.Application.DTOs.PMS.SOW;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class SOWService(
        IGenericRepository<SOW> _sowRepository,
        IEmailTemplateService _emailTemplateService,
        IGenericRepository<Partner> _partnerRepository,
                IGenericRepository<ContactMatrix> _contactMatrixRepository,
        IGenericRepository<Users> _userRepository,
        IConfiguration _configuration,
        ICommuncationService _communicationService,
        IGenericRepository<PODetail> _sowPODetailRepository,
        IGenericRepository<SOWHistory> _sowHistoryRepository,
        IGenericRepository<PODetailHistory> _sowPODetailHistoryRepository,
        IHelperMethods _helperMethods,
        IMapper _mapper) : BaseService, ISOWService
    {
        public async Task<ApiResponseDto<PagedResult<GetSOWDto>>> GetPagedSOWDetails(PageDto pageData, int partnerId)
        {
            return await ExecuteAsync(async () =>
                {
                    var result = await _sowRepository.GetPaginatedListAsync(
                        pageData,
                        query => query.Include(x => x.SOW_CRs).Include(x => x.PODetails!).ThenInclude(x => x.PO_CRs).Where(x => x.PartnerId == partnerId)
                    );
                    var dtos = _mapper.Map<IEnumerable<GetSOWDto>>(result.Items);
                    return new PagedResult<GetSOWDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
                }, "SOW details fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetSOWDto>>> GetSOWDetails(int partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _sowRepository.GetListAsync(
                    query => query.Include(x => x.SOW_CRs.OrderByDescending(cr => cr.UpdatedAt ?? cr.CreatedAt ?? DateTime.MinValue))
                                  .Include(x => x.PODetails!.OrderByDescending(cr => cr.UpdatedAt ?? cr.CreatedAt ?? DateTime.MinValue))
                                  .ThenInclude(x => x.PO_CRs.OrderByDescending(cr => cr.UpdatedAt ?? cr.CreatedAt ?? DateTime.MinValue))
                                  .Where(x => x.PartnerId == partnerId)
                );
                return _mapper.Map<IEnumerable<GetSOWDto>>(result);
            }, "SOW details list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetSOWDto>> GetSOWDetail(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _sowRepository.GetAsync(query => query.Include(x => x.SOW_CRs.OrderByDescending(cr => cr.UpdatedAt ?? cr.CreatedAt))
                                                                         .Include(x => x.PODetails!.OrderByDescending(cr => cr.UpdatedAt ?? cr.CreatedAt))
                                                                         .ThenInclude(x => x.PO_CRs.OrderByDescending(cr => cr.UpdatedAt ?? cr.CreatedAt))
                                                                        .Where(x => x.Id == id));
                return entity == null
                    ? throw new Exception($"SOW is not found with Id : {id}")
                    : _mapper.Map<GetSOWDto>(entity);

            }, "SOW detail fetched successfully.");
        }

        public async Task<ApiResponseDto<GetSOWDto>> AddSOWDetail(AddSOWDto sowDetail)
        {
            return await ExecuteAsync(async () =>
            {

                var existingEntity = await _sowRepository.GetAsync(query => query.Where(x => x.SOWNumber == sowDetail.SOWNumber));

                if (existingEntity != null)
                    throw new Exception($"SOW is already existed with the SOWNumber : {sowDetail.SOWNumber}");

                var entity = _mapper.Map<SOW>(sowDetail);
                var loggedinUser = _helperMethods.GetUserDetails();

                if (loggedinUser.RoleId == 1 || loggedinUser.RoleId == 3) // Vendor/Admin adds
                {
                    entity.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                    entity.Status = sowDetail.Status ?? entity.Status ?? true;
                }
                else // Normal user adds
                {
                    entity.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.PENDING;
                    entity.Status = false;
                }
                entity = await _sowRepository.AddAsync(entity);

                try
                {
                    var partner = await _partnerRepository.GetAsync(entity.PartnerId);

                    var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));

                    var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));


                    string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

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

                    var sowDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(entity, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "SOW.");

                    var dictionary = Utility.Utility.Merge(sowDict, partHiringDict);

                    var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                    dictionary.Add("ProfileLink", link);


                    await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerSOWAddedNotification, toEmail,
                       dictionary, ccEmail);
                }
                catch (Exception ex)
                { }


                return _mapper.Map<GetSOWDto>(entity);
            }, "SOW detail added successfully.");
        }

        public Task<ApiResponseDto<string>> ToggleSOWStatus(int id, bool isActive)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponseDto<string>> UpdateSOWDetail(AddSOWDto sowDetail)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _sowRepository.GetAsync(sowDetail.Id)
                    ?? throw new Exception($"SOW is not found with Id : {sowDetail.Id}");

                var template = PartnerEmailTemplateEnums.PartnerSowDetailUpdatedNotification.ToString();

                await _sowHistoryRepository.AddAsync(_mapper.Map<SOWHistory>(entity));

                _mapper.Map(sowDetail, entity);

                var loggedinUser = _helperMethods.GetUserDetails();
                if (loggedinUser.RoleId == 1 || loggedinUser.RoleId == 3) // Vendor/Admin adds
                {
                    entity.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                    entity.Status = sowDetail.Status ?? entity.Status ?? true;
                }
                else
                {
                    if (sowDetail.IsApprovedAction == true)
                    {
                        entity.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                        entity.Status = false;
                    }
                    else
                    {
                        entity.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.PENDING;
                        entity.Status = false;
                    }
                }

                await _sowRepository.UpdateAsync(entity);



                if (entity.Status == false)
                {
                    var childPOs = await _sowPODetailRepository.GetListAsync(query => query.Where(x => x.Status == true && x.SowId == entity.Id));
                    if (childPOs?.Count() > 0)
                    {
                        foreach (var po in childPOs)
                        {
                            po.Status = false;
                        }

                        await _sowPODetailRepository.UpdateListAsync(childPOs);

                        template = PartnerEmailTemplateEnums.PartnerSowPODetailUpdateNotification.ToString();
                    }
                }

                //var partner = await _partnerRepository.GetAsync(entity.PartnerId);

                //var dictionary = Utility.Utility.FlattenJsonToDictionary(JsonConvert.SerializeObject(entity));

                //var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));

                //var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                //string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                //if (toEmail == null)
                //{
                //    toEmail = partner.ContactMatrices.Count() > 0 ? partner.ContactMatrices.FirstOrDefault().Email : null;
                //}

                //var ccEmail = approver.Email;
                //dictionary.Add("Approver.UserName", approver.Username);
                //dictionary.Add("Partner.PartnerName", partner.PartnerName);

                //var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                //dictionary.Add("ProfileLink", link);

                //await _communicationService.AddNotification(templateDetails.Data.NotificationId, toEmail,
                //    Utility.Utility.FlattenJsonToDictionary(JsonConvert.SerializeObject(sowDetail)), ccEmail);

            }, "SOW detail updated successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetSOWDto>>> GetPagedSOWDetailsByCategoryId(PageDto pageData, int? partnerId, int categoryId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _sowRepository.GetPaginatedListAsync(
                    pageData,
                    query => query.Include(x => x.SOW_CRs).Include(x => x.PODetails).Include(x => x.Partner).Where(x => x.PartnerId == (partnerId == null ? x.PartnerId : partnerId) && (
                    categoryId == (int)PO_CATEGORY_TYPE.ACTIVE ? x.Status == true : (categoryId == (int)PO_CATEGORY_TYPE.EXPIRING ?
                    (x.Status == true && x.EndDate <= DateTime.UtcNow.AddDays(30))
                    : x.Status == false)
                    ))
                );
                var dtos = _mapper.Map<IEnumerable<GetSOWDto>>(result.Items);
                return new PagedResult<GetSOWDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "SOW details fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetPODetailDto>>> GetPagedPODetails(PageDto pageData, int sowId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _sowPODetailRepository.GetPaginatedListAsync(
                    pageData,
                    query => query.Include(x => x.PO_CRs).Include(x => x.Sow).Where(x => x.SowId == sowId)
                );
                var dtos = _mapper.Map<IEnumerable<GetPODetailDto>>(result.Items);
                return new PagedResult<GetPODetailDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "PO details fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetPODetailDto>>> GetPODetails(int sowId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _sowPODetailRepository.GetListAsync(
                    query => query.Include(x => x.PO_CRs).Include(x => x.Sow).Where(x => x.SowId == sowId)
                );
                return _mapper.Map<IEnumerable<GetPODetailDto>>(result);
            }, "PO details list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetPODetailDto>> GetPODetail(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _sowPODetailRepository.GetAsync(
                    query => query.Include(x => x.PO_CRs).Include(x => x.Sow).Where(x => x.Id == id)
                );
                return _mapper.Map<GetPODetailDto>(result);
            }, "PO details fetched successfully.");
        }

        public async Task<ApiResponseDto<GetPODetailDto>> AddPODetail(AddPODetailDto sowPODetail)
        {
            return await ExecuteAsync(async () =>
            {
                var existingEntity = await _sowPODetailRepository.GetAsync(query => query.Where(x => x.PONumber == sowPODetail.PONumber));

                if (existingEntity != null)
                    throw new Exception($"PO is already existed with the PONumber : {sowPODetail.PONumber}");

                // Retrieve the SOW entity by its ID
                var sow = await _sowRepository.GetAsync(sowPODetail.SowId) ?? throw new Exception("SOW not found.");

                // Calculate the total value of existing POs related to this SOW
                var existingPOs = await _sowPODetailRepository
                    .GetListAsync(query => query.Include(x => x.PO_CRs).Where(po => po.SowId == sowPODetail.SowId));


                var totalPOValue = existingPOs.Sum(po => po.POValue ?? 0);

                // Check if adding this new PO exceeds the SOW's TCValue
                if (totalPOValue + sowPODetail.POValue > sow.TCValue)
                    throw new Exception("Total PO value exceeds SOW's TCValue.");

                foreach (var po in existingPOs)
                {
                    po.Status = false;
                }

                await _sowPODetailRepository.UpdateListAsync(existingPOs);

                var entity = await _sowPODetailRepository.AddAsync(_mapper.Map<PODetail>(sowPODetail));

                try
                {

                    var partner = await _partnerRepository.GetAsync(sow.PartnerId);

                    var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partner.Id));

                    var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partner.ApprovedBy));

                    string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

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

                    var sowDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(sow, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "SOW.");


                    var sowPODict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(entity, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "PO.");

                    var sowsPODict = Utility.Utility.Merge(sowDict, sowPODict);
                    var dictionary = Utility.Utility.Merge(partHiringDict, sowsPODict);

                    var link = _configuration["ClientHostName"] + "/home/partner-podetails";
                    dictionary.Add("ProfileLink", link);

                    await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerSowPODetailAddNotification, toEmail,
                       dictionary, ccEmail);
                }
                catch (Exception ex)
                { }



                return _mapper.Map<GetPODetailDto>(entity);

            }, "PO details added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdatePODetail(AddPODetailDto sowPODetail)
        {
            return await ExecuteAsync(async () =>
            {
                if (sowPODetail == null)
                    throw new Exception("Data is required");

                // Retrieve the SOW entity by its ID
                var sow = await _sowRepository.GetAsync(sowPODetail.SowId) ?? throw new Exception("SOW not found.");

                // Calculate the total value of existing POs related to this SOW
                var existingPOs = await _sowPODetailRepository
                    .GetListAsync(query => query.Include(x => x.PO_CRs).Where(po => po.SowId == sowPODetail.SowId && po.Id != sowPODetail.Id));

                var totalPOValue = existingPOs.Sum(po => po.POValue ?? 0);

                // Check if adding this new PO exceeds the SOW's TCValue
                if (totalPOValue + sowPODetail.POValue > sow.TCValue)
                    throw new Exception("Total PO value exceeds SOW's TCValue.");

                var entity = await _sowPODetailRepository.GetAsync(sowPODetail.Id)
                    ?? throw new Exception($"PO Details are not found with Id : {sowPODetail.Id}");

                _mapper.Map(sowPODetail, entity);

                await _sowPODetailHistoryRepository.AddAsync(_mapper.Map<PODetailHistory>(entity));

                await _sowPODetailRepository.UpdateAsync(entity);

                //try
                //{
                //    //var templateDetails = await _emailTemplateService.GetTemplateByName(PartnerEmailTemplateEnums.PartnerSowPODetailUpdateNotification.ToString());

                //    //var partnerDetails = await _partnerRepository.GetAsync(sow.PartnerId);

                //    //string ccEmail = partnerDetails.ContactMatrices.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                //    //if (ccEmail == null)
                //    //{
                //    //    ccEmail = partnerDetails.ContactMatrices.Count() > 1 ? partnerDetails.ContactMatrices.FirstOrDefault().Email : null;
                //    //}

                //    //var toEmail = partnerDetails.Approver.Email;
                //    //await _communicationService.AddNotification(templateDetails.Data.NotificationId, toEmail,
                //    //    Utility.Utility.FlattenJsonToDictionary(JsonConvert.SerializeObject(sowPODetail)), ccEmail);

                //}
                //catch (Exception ex)
                //{ }

            }, "PO details updated successfully.");
        }

        public async Task<ApiResponseDto<string>> TogglePOStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _sowPODetailRepository.GetAsync(id)
                    ?? throw new Exception($"PO Details are not found with Id : {id}");

                entity.IsActive = isActive;

                await _sowPODetailRepository.UpdateAsync(entity);
            }, "PO details updated successfully.");
        }


        public async Task<ApiResponseDto<string>> UpdateSOWMatrixStatus(UpdateSOWMatrixDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var sowMatrix = await _sowRepository.GetAsync(dto.Id)
                                        ?? throw new Exception($"Contact matrix not found with Id: {dto.Id}");

                // Only update the ApprovalStatusId, not StatusId
                sowMatrix.ApprovalStatusId = (int)dto.ApprovalStatusId;

                await _sowRepository.UpdateAsync(sowMatrix);

                return $"SOW matrix approval status updated to {dto.ApprovalStatusId}.";
            }, "Approval status updated successfully.");
        }


    }
}