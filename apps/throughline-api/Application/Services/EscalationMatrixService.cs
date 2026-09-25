using AutoMapper;
using DocumentFormat.OpenXml.Office2010.Excel;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.EscalationMatrix;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class EscalationMatrixService(IGenericRepository<EscalationMatrix> _escalationMatrixRepository,
        IGenericRepository<Partner> _partnerRepository,
        IGenericRepository<ContactMatrix> _contactMatrixRepository,
                IGenericRepository<Users> _userRepository,
                IHelperMethods _helperMethods,
           IConfiguration _configuration,
        ICommuncationService _communicationService,
        IMapper _mapper) : BaseService, IEscalationMatrixService
    {
        public async Task<ApiResponseDto<PagedResult<GetEscalationMatrixDto>>> GetPagedEscalationMatrices(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _escalationMatrixRepository.GetPaginatedListAsync(pageData,
                    query => query
                       .Include(x => x.Status)
                       .Include(x => x.Country)
                       .Include(x => x.EscalationMatrixType));
                var escalationMatrixDtos = _mapper.Map<IEnumerable<GetEscalationMatrixDto>>(result.Items);
                return new PagedResult<GetEscalationMatrixDto>(escalationMatrixDtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Escalation matrix list fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetEscalationMatrixDto>>> GetEscalationMatrices(int partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _escalationMatrixRepository.GetListAsync(query => query
                       .Include(x => x.Status)
                       .Include(x => x.Country)
                       .Include(x => x.EscalationMatrixType).Where(x => x.PartnerId == partnerId));
                return _mapper.Map<IEnumerable<GetEscalationMatrixDto>>(result);
            }, "Escalation matrix list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetEscalationMatrixDto>> GetEscalationMatrix(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _escalationMatrixRepository.GetAsync(query => query
                       .Include(x => x.Status)
                       .Include(x => x.Country)
                       .Include(x => x.EscalationMatrixType).Where(x => x.Id == id));
                return result == null ? throw new Exception($"Escalation matrix is not found with Id : {id}") : _mapper.Map<GetEscalationMatrixDto>(result);
            }, "Escalation matrix fetched successfully.");
        }

        public async Task<ApiResponseDto<GetEscalationMatrixDto>> AddEscalationMatrix(AddEscalationMatrixDto escalationMatrix)
        {
            return await ExecuteAsync(async () =>
            {
                var existingContact = await _helperMethods.CheckContactNumberExists(escalationMatrix.ContactNumber);

                if (existingContact != null && existingContact.PartnerId != escalationMatrix.PartnerId && escalationMatrix.ContinueToAdd != true)
                    throw new Exception($"Contact number {escalationMatrix.ContactNumber} already exists for partner {existingContact.PartnerName} with Id {existingContact.PartnerId}.");

                var entity = _mapper.Map<EscalationMatrix>(escalationMatrix);

                var loggedinUser = _helperMethods.GetUserDetails();

                if (loggedinUser.RoleId == (int)ROLES.ADMIN || loggedinUser.RoleId == (int)ROLES.VENDORMANAGER) // Vendor/Admin adds
                {
                    entity.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                    entity.StatusId = escalationMatrix.StatusId;
                }
                else // Normal user adds
                {
                    entity.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.PENDING;
                    entity.StatusId = (int)ACTIVE_STATUS.INACTIVE;
                }

                var addedEntity = await _escalationMatrixRepository.AddAsync(entity);

                if (addedEntity != null)
                {
                    try
                    {
                        var partnerDetails = await _partnerRepository.GetAsync(escalationMatrix.PartnerId);
                        var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partnerDetails.ApprovedBy));
                        var toEmail = approver.Email;

                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partnerDetails.Id));

                        string ccEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                        if (ccEmail == null)
                        {
                            ccEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                        }

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


                        var dictionary = Utility.Utility.Merge(partnerDict, hiringDict);

                        var link = _configuration["ClientHostName"] + "/home/partner-onboarding/edit-partner?id=" + partnerDetails.Id;
                        dictionary.Add("ProfileLink", link);

                        await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerEscalationAddedMatrixApproval, toEmail, dictionary
                            , ccEmail);
                    }
                    catch (Exception ex)
                    { }

                }
                return _mapper.Map<GetEscalationMatrixDto>(addedEntity);
            }, "Escalation matrix added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateEscalationMatrix(AddEscalationMatrixDto escalationMatrix)
        {
            return await ExecuteAsync(async () =>
            {
                var existingContact = await _helperMethods.CheckContactNumberExists(escalationMatrix.ContactNumber, escalationMatrix.Id);

                if (existingContact != null && existingContact.PartnerId != escalationMatrix.PartnerId && escalationMatrix.ContinueToAdd != true)
                    throw new Exception($"Contact number {escalationMatrix.ContactNumber} already exists for partner {existingContact.PartnerName} with Id {existingContact.PartnerId}.");


                var result = await _escalationMatrixRepository.GetAsync(escalationMatrix.Id) ?? throw new Exception($"Escalation matrix is not found with Id : {escalationMatrix.Id}");
                _mapper.Map(escalationMatrix, result);
                var loggedinUser = _helperMethods.GetUserDetails();
                if (loggedinUser.RoleId == (int)ROLES.ADMIN || loggedinUser.RoleId == (int)ROLES.VENDORMANAGER) // Vendor/Admin adds
                {
                    result.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                    result.StatusId = escalationMatrix.StatusId;
                }
                else
                {
                    if (escalationMatrix.IsApprovedAction == true)
                    {
                        result.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                        result.StatusId = (int)ACTIVE_STATUS.ACTIVE;
                    }
                    else
                    {
                        result.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.PENDING;
                        result.StatusId = (int)ACTIVE_STATUS.INACTIVE;
                    }
                }

                await _escalationMatrixRepository.UpdateAsync(result);

                if (result != null)
                {
                    try
                    {
                        var partnerDetails = await _partnerRepository.GetAsync(escalationMatrix.PartnerId);
                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partnerDetails.Id));

                        string ccEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                        if (ccEmail == null)
                        {
                            ccEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                        }

                        var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partnerDetails.ApprovedBy));

                        var toEmail = approver.Email;

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
                        var dictionary = Utility.Utility.Merge(partnerDict, hiringDict);


                        var link = _configuration["ClientHostName"] + "/home/partner-onboarding/edit-partner?id=" + partnerDetails.Id;
                        dictionary.Add("ProfileLink", link);

                        await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerEscalationUpdatedMatrixApproval, toEmail, dictionary, ccEmail);

                    }
                    catch (Exception ex)
                    { }
                }
            }, "Escalation matrix updated successfully.");
        }
        public async Task<ApiResponseDto<string>> UpdateEscalationMatrixStatus(UpdateEscalationMatrixDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                
                var escalationMatrix = await _escalationMatrixRepository.GetAsync(dto.Id)
                    ?? throw new Exception($"Escalation matrix not found with Id: {dto.Id}");

                
                escalationMatrix.ApprovalStatusId = (int)dto.ApprovalStatusId;

               
                await _escalationMatrixRepository.UpdateAsync(escalationMatrix);

                return "Escalation matrix status updated successfully.";
            });
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _escalationMatrixRepository.GetAsync(id) ?? throw new Exception($"Escalation matrix is not found with Id : {id}");
                result.IsActive = isActive;
                await _escalationMatrixRepository.UpdateAsync(result);
            }, "Escalation matrix status updated successfully.");
        }

    }
}