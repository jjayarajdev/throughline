using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.ContactMatrix;
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
    public class ContactMatrixService(IGenericRepository<ContactMatrix> _contactMatrixRepository,
        IGenericRepository<Partner> _partnerRepository,
        IGenericRepository<Users> _userRepository,
        IConfiguration _configuration,
        ICommuncationService _communicationService,
        IHelperMethods _helperMethods,
        IMapper _mapper) : BaseService, IContactMatrixService
    {
        public async Task<ApiResponseDto<PagedResult<GetContactMatrixDto>>> GetPagedContactMatrices(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _contactMatrixRepository.GetPaginatedListAsync(pageData,
                     query => query
                       .Include(x => x.Status)
                       .Include(x => x.Country)
                       .Include(x => x.ContactMatrixType));
                var dtos = _mapper.Map<IEnumerable<GetContactMatrixDto>>(result.Items);
                return new PagedResult<GetContactMatrixDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Contact matrix list fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetContactMatrixDto>>> GetContactMatrices(int partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _contactMatrixRepository.GetListAsync(query => query
                       .Include(x => x.Status)
                       .Include(x => x.Country)
                       .Include(x => x.ContactMatrixType).Where(x => x.PartnerId == partnerId));
                return _mapper.Map<IEnumerable<GetContactMatrixDto>>(result);
            }, "Contact matrix list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetContactMatrixDto>> GetContactMatrix(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _contactMatrixRepository.GetAsync(query => query
                       .Include(x => x.Status)
                       .Include(x => x.Country)
                       .Include(x => x.ContactMatrixType).Where(x => x.Id == id));
                return result == null ? throw new Exception($"Contact matrix is not found with Id : {id}") : _mapper.Map<GetContactMatrixDto>(result);
            }, "Contact matrix fetched successfully.");
        }

        public async Task<ApiResponseDto<GetContactMatrixDto>> AddContactMatrix(AddContactMatrixDto contactMatrix)
        {
            return await ExecuteAsync(async () =>
            {
                var existingContact = await _helperMethods.CheckContactNumberExists(contactMatrix.ContactNumber);

                if (existingContact != null && existingContact.PartnerId != contactMatrix.PartnerId && contactMatrix.ContinueToAdd != true)
                    throw new Exception($"Contact number {contactMatrix.ContactNumber} already exists for partner {existingContact.PartnerName} with Id {existingContact.PartnerId}.");

                var entity = _mapper.Map<ContactMatrix>(contactMatrix);

                var loggedinUser = _helperMethods.GetUserDetails();

                if (loggedinUser.RoleId == 1 || loggedinUser.RoleId == 3) // Vendor/Admin adds
                {
                    entity.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                    entity.StatusId = (int)ACTIVE_STATUS.ACTIVE;
                }
                else // Normal user adds
                {
                    entity.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.PENDING;
                    entity.StatusId = (int)ACTIVE_STATUS.INACTIVE;
                }
                var addedEntity = await _contactMatrixRepository.AddAsync(entity);

                try
                {
                    if (addedEntity != null)
                    {
                        var partnerDetails = await _partnerRepository.GetAsync(contactMatrix.PartnerId);
                        var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partnerDetails.ApprovedBy));

                        if (approver != null)
                        {
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

                            await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerContactAddedMatrixApproval, toEmail, dictionary);
                        }
                    }
                }
                catch (Exception ex)
                { }

                return _mapper.Map<GetContactMatrixDto>(addedEntity);
            }, "Contact matrix added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateContactMatrix(AddContactMatrixDto contactMatrix)
        {
            return await ExecuteAsync(async () =>
            {
                var existingContact = await _helperMethods.CheckContactNumberExists(contactMatrix.ContactNumber, contactMatrix.Id);

                if (existingContact != null && existingContact.PartnerId != contactMatrix.PartnerId && contactMatrix.ContinueToAdd != true)
                    throw new Exception($"Contact number {contactMatrix.ContactNumber} already exists for partner {existingContact.PartnerName} with Id {existingContact.PartnerId}.");

                var result = await _contactMatrixRepository.GetAsync(contactMatrix.Id) ?? throw new Exception($"Contact matrix is not found with Id : {contactMatrix.Id}");

                _mapper.Map(contactMatrix, result);

                var loggedinUser = _helperMethods.GetUserDetails();
                if (loggedinUser.RoleId == 1 || loggedinUser.RoleId == 3) // Vendor/Admin adds
                {
                    // Directly Approved + Active
                    result.ApprovalStatusId = (int)CONTACT_MATRIX_STATUS.APPROVED;
                    result.StatusId = contactMatrix.StatusId == (int)ACTIVE_STATUS.INACTIVE
                                     ? (int)ACTIVE_STATUS.INACTIVE
                                     : (int)ACTIVE_STATUS.ACTIVE;
                }
                else
                {
                    // Normal user → depends on IsApprovedAction
                    if (contactMatrix.IsApprovedAction == true)
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

                await _contactMatrixRepository.UpdateAsync(result);

                if (result != null)
                {
                    try
                    {
                        var partnerDetails = await _partnerRepository.GetAsync(contactMatrix.PartnerId);
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

                        await _communicationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerContactUpdatedMatrixApproval, toEmail,
                                 dictionary, ccEmail);
                    }
                    catch (Exception ex)
                    { }
                }

            }, "Contact matrix updated successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateContactMatrixStatus(UpdateContactMatrixDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var contactMatrix = await _contactMatrixRepository.GetAsync(dto.Id)
                                        ?? throw new Exception($"Contact matrix not found with Id: {dto.Id}");

                // Only update the ApprovalStatusId, not StatusId
                contactMatrix.ApprovalStatusId = (int)dto.ApprovalStatusId;

                await _contactMatrixRepository.UpdateAsync(contactMatrix);

                return $"Contact matrix approval status updated to {dto.ApprovalStatusId}.";
            }, "Approval status updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _contactMatrixRepository.GetAsync(id);
                if (result == null)
                    throw new Exception($"Contact matrix is not found with Id : {id}");

                result.IsActive = isActive;
                await _contactMatrixRepository.UpdateAsync(result);
            }, "Contact matrix status updated successfully.");
        }

    }
}