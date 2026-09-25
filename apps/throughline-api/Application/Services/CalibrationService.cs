using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.Calibration;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Shared;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class CalibrationService(IGenericRepository<Calibration> _calibrationRepository,

        IGenericRepository<PartnerCategory> _partnerCategoryRepository,
        ICommuncationService _communcationService,
        IConfiguration _configuration,
        IGenericRepository<Partner> _partnerRepository,
        IGenericRepository<HiringReqPartner> _partnerReqRepository,
        IGenericRepository<ContactMatrix> _contactMatrixRepository,
        IGenericRepository<Users> _userRepository,
        IGenericRepository<HiringRequest> _hiringRequestRepository,
    IMapper _mapper) : BaseService, ICalibrationService
    {
        public async Task<ApiResponseDto<PagedResult<GetCalibrationDto>>> GetPagedCalibrations(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _calibrationRepository.GetPaginatedListAsync(pageData,
                    query => query.Include(x => x.Documents));
                var dtos = _mapper.Map<IEnumerable<GetCalibrationDto>>(result.Items);
                return new PagedResult<GetCalibrationDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }
            , "Calibrations fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetCalibrationDto>>> GetCalibrations(int hiringRequestId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _calibrationRepository.GetListAsync(query => query.Include(x => x.Documents).Where(x => x.HiringRequestId == hiringRequestId));
                return _mapper.Map<IEnumerable<GetCalibrationDto>>(result);
            }
            , "Calibrations list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetCalibrationDto>> GetCalibration(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _calibrationRepository.GetAsync(query => query.Include(x => x.Documents).Where(x => x.Id == id));
                return result == null ? throw new KeyNotFoundException($"Entity with ID {id} was not found.") : _mapper.Map<GetCalibrationDto>(result);
            }
            , "Calibration fetched successfully.");
        }

        public async Task<ApiResponseDto<GetCalibrationDto>> AddCalibration(AddCalibrationDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var added = await _calibrationRepository.AddAsync(_mapper.Map<Calibration>(dto));

                var partnerCategory = await _partnerCategoryRepository.GetAsync(query => query.Where(x => x.HiringRequestId == dto.HiringRequestId));
                var prtnerList = (await _partnerReqRepository.GetListAsync(query => query.Where(x => x.PartnerCategoryId == partnerCategory.Id))).Select(qy => qy.PartnerId);

                if (prtnerList != null)
                {
                    foreach (var partner in prtnerList)
                    {
                        try
                        {
                            var prtner = await _partnerRepository.GetAsync(partner);
                            var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtner.Id));
                            var hiringRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == dto.HiringRequestId));
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

                            var partHiringRequestDict = Utility.Utility.Merge(partHiringDict, hiringRequestDict);

                            var calibrationDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(added, new JsonSerializerSettings
                            {
                                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                                Formatting = Formatting.Indented,
                                ContractResolver = new DefaultContractResolver
                                {
                                    NamingStrategy = new InitCapNamingStrategy()
                                }
                            }), "Calibration.");

                            var dictionary = Utility.Utility.Merge(calibrationDict, partHiringRequestDict);

                            var link = _configuration["ClientHostName"] + "/home/hiring-details?hrqid=" + hiringRequest.HrqId;
                            dictionary.Add("ProfileLink", link);


                            await _communcationService.AddNotification((int)HiringEmailTemplateEnums.AddCalibrationNotification, toEmail,
                                dictionary, ccEmail);

                        }
                        catch (Exception ex)
                        { }

                    }
                }

                return _mapper.Map<GetCalibrationDto>(added);
            }
            , "Calibration added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateCalibration(AddCalibrationDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _calibrationRepository.GetAsync(query => query.Include(x => x.Documents).Where(x => x.Id == dto.Id))
                ?? throw new KeyNotFoundException($"Entity with ID {dto.Id} was not found.");
                _mapper.Map(dto, entity);
                await _calibrationRepository.UpdateAsync(entity);
            }
            , "Calibration updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _calibrationRepository.GetAsync(id) ?? throw new KeyNotFoundException($"Entity with ID {id} was not found.");
                entity.IsActive = isActive;
                await _calibrationRepository.UpdateAsync(entity);
            }
            , "Calibration status updated successfully.");
        }
    }
}
