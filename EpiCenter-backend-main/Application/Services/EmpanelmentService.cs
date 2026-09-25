using AutoMapper;
using DocumentFormat.OpenXml.Vml;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.Empanelment;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using Irony.Parsing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph.Models;
using Microsoft.Graph.Models.Partners;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class EmpanelmentService(IGenericRepository<PartnerEmpanel> _empanelmentRepository,
                                    IGenericRepository<Partner> _partnerRepository,
                                    IGenericRepository<DocumentDetails> _documentRepository,

                                                  IGenericRepository<M_MasterData> _masterData,
        IGenericRepository<ContactMatrix> _contactMatrixRepository,
        IGenericRepository<Users> _userRepository,
        IConfiguration _configuration,
        ICommuncationService _communcationService,
        IGenericRepository<Engagement> _engagementRepository,
                                    IMapper _mapper) : BaseService, IEmpanelmentService
    {
        public async Task<ApiResponseDto<GetPartnerEmpanelDto>> AddPartnerEmpanel(AddPartnerEmpanelDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _empanelmentRepository.AddAsync(_mapper.Map<PartnerEmpanel>(dto));

                var added = _mapper.Map<GetPartnerEmpanelDto>(entity);

                if (added.IsEmpaneledPartner == true)
                {
                    var partner = await _partnerRepository.GetAsync(added.PartnerId);
                    partner.PartnerStatusId = (int)PARTNER_STATUS.ACTIVE;
                    partner.IsEmpaneledEnabled = true;
                    await _partnerRepository.UpdateAsync(partner, false);

                    try
                    {
                        var partnerDetails = await _partnerRepository.GetAsync(added.PartnerId);
                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == partnerDetails.Id));
                        var approver = await _userRepository.GetAsync(query => query.Where(x => x.UserId == partnerDetails.ApprovedBy));

                        string toEmail = contact.Where(x => x.ContactMatrixTypeId == 4001).FirstOrDefault()?.Email;

                        if (toEmail == null)
                        {
                            toEmail = contact.Count() > 0 ? contact.FirstOrDefault().Email : null;
                        }

                        var ccEmail = approver.Email;

                        var partnerEngagment = (await _engagementRepository.GetListAsync(query => query.Where(x => x.PartnerId == entity.PartnerId))).OrderByDescending(x => x.EvaluationStartDate).FirstOrDefault();

                        var engagementType = await _masterData.GetAsync(query => query.Where(x => x.Id == partnerEngagment.EngagementTypeId));

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

                        var engagmentDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(engagementType, new JsonSerializerSettings
                        {
                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                            Formatting = Formatting.Indented,
                            ContractResolver = new DefaultContractResolver
                            {
                                NamingStrategy = new InitCapNamingStrategy()
                            }
                        }), "EngagementType.");

                        var dictionary = Utility.Utility.Merge(engagmentDict, partHiringDict);

                        var link = _configuration["ClientHostName"] + "/home/partner-onboarding/edit-partner?id=" + partnerDetails.Id;
                        dictionary.Add("ProfileLink", link);

                        await _communcationService.AddNotification((int)PartnerEmailTemplateEnums.PartnerEmpaneledCompleted, toEmail, dictionary
                            , ccEmail);
                    }
                    catch (Exception ex)
                    { }
                }

                return added;

            }, "Partner empanelment added successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetPartnerEmpanelDto>>> GetPagedPartnerEmpanels(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _empanelmentRepository.GetPaginatedListAsync(pageData,
                    query => query.Include(x => x.AgreementType)
                                   .Include(x => x.SOWQuoteDocuments)
                                  .Include(x => x.RejectionReasonType));
                var dtos = _mapper.Map<IEnumerable<GetPartnerEmpanelDto>>(result.Items);
                return new PagedResult<GetPartnerEmpanelDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Partner empanelment fetched successfully.");
        }

        public async Task<ApiResponseDto<GetPartnerEmpanelDto>> GetPartnerEmpanlByPartnerId(int partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _empanelmentRepository.GetAsync(query => query
                       .Include(x => x.SOWQuoteDocuments)
                       .Include(x => x.AgreementType)
                       .Include(x => x.RejectionReasonType).Where(x => x.PartnerId == partnerId));
                return _mapper.Map<GetPartnerEmpanelDto>(result);
            }, "Partner empanelment fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetPartnerEmpanelDto>>> GetPartnerEmpanels(int partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _empanelmentRepository.GetListAsync(query => query
                       .Include(x => x.SOWQuoteDocuments)
                       .Include(x => x.AgreementType)
                       .Include(x => x.RejectionReasonType).Where(x => x.PartnerId == partnerId));
                return _mapper.Map<IEnumerable<GetPartnerEmpanelDto>>(result);
            }, "Partner empanelment list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetPartnerEmpanelDto>> GetPartnerEmpanelment(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _empanelmentRepository.GetAsync(query => query
                       .Include(x => x.SOWQuoteDocuments.OrderByDescending(x=>x.UpdatedAt ?? x.CreatedAt).Take(1))
                       .Include(x => x.AgreementType)
                       .Include(x => x.RejectionReasonType).Where(x => x.Id == id));
                return entity == null ? throw new Exception($"Empanelment details are not found with Id : {id}") : _mapper.Map<GetPartnerEmpanelDto>(entity);
            }, "Partner empanelment  fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _empanelmentRepository.GetAsync(id) ?? throw new Exception($"Contact matrix is not found with Id : {id}");
                entity.IsActive = isActive;
                await _empanelmentRepository.UpdateAsync(entity);
            }, "Partner empanelment  status updated successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdatePartnerEmpanel(AddPartnerEmpanelDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _empanelmentRepository.GetAsync(query => query
                                                                          .Include(x => x.SOWQuoteDocuments)
                                                                          .Where(x => x.Id == dto.Id))
                ?? throw new Exception($"Empanelment details are not found with Id : {dto.Id}");

                entity.EmpanelmentStartDate = dto.EmpanelmentStartDate;
                entity.IsThisGPApproved = dto.IsThisGPApproved;

                if (entity.IsThisGPApproved == true)
                {
                    entity.GPApprovalDate = dto.EmpanelmentStartDate;
                    entity.SOWSigningDate = dto.SOWSigningDate;
                    entity.GPId = dto.GPId;
                    entity.AgreementTypeId = dto.AgreementTypeId;
                    entity.ContractId = dto.ContractId;
                    entity.PANID = dto.PANID;
                    entity.TANID = dto.TANID;
                    entity.GSTID = dto.GSTID;
                    entity.EmpanelmentComments = dto.EmpanelmentComments;
                     
                    dto.SOWQuoteDocuments = dto.SOWQuoteDocuments?.Where(x => x.Id == 0).ToList();
                    entity.SOWQuoteDocuments = _mapper.Map<List<DocumentDetails>>(dto.SOWQuoteDocuments);
                }

                await _empanelmentRepository.UpdateAsync(entity);

            }, "Partner empanelment updated successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<DocumentDetailDto>>> GetPagedSOWQuoteDocs(PageDto pagedata, int? partnerEmpanelId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _documentRepository.GetPaginatedListAsync(pagedata,
                query => query.Where(x => x.PartnerEmpanelId == partnerEmpanelId));

                return new PagedResult<DocumentDetailDto>(_mapper.Map<List<DocumentDetailDto>>(result.Items), result.TotalCount, result.PageSize, result.CurrentPage);

            }, "Partners fetched successfully.");
        }
    }
}