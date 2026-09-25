using System.Data;
using System.Text.RegularExpressions;
using AutoMapper;
using Dapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.CMS;
using EpicenterX.Application.DTOs.CMS.CandidateBin;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using EpicenterX.Domain.Shared.HelperClasses;
using EpicenterX.Infrastructure.Persistence;
using LinqKit;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using static EpicenterX.Utility.Utility;

namespace EpicenterX.Application.Services
{
    public class CandidateBinService(
        IEmailTemplateService _emailTemplateService,
        ICommuncationService _communicationService,
        IGenericRepository<Partner> _partnerRepository,
        IGenericRepository<CandidateBin> _candidateBinRepository,
        IGenericRepository<CandidateBinHistory> _candidateBinHistoryRepository,
        IGenericRepository<Candidate> _candidateFormRepository,
        IGenericRepository<Users> _userRepository,
        IGenericRepository<ContactMatrix> _contactMatrixRepository,
        IGenericRepository<HiringRequest> _hiringRepository,
        IConfiguration _configuration,
        IGenericRepository<CandidateHistory> _candidateFormHistoryRepository,
        ICandidateHelperMethods _candidateHelperMethods,
        IHelperMethods _helperMethods,
        AppDBContext _context,
        IConfiguration _config,
        IMapper _mapper) : BaseService, ICandidateBinService
    {
        // Email pattern (general RFC 5322 compliant)
        private static readonly Regex EmailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);

        // Phone pattern (e.g., 10 digits, Indian format starts with 6-9)
        private static readonly Regex PhoneRegex = new Regex(@"^[6-9]\d{9}$", RegexOptions.Compiled);


        public async Task<ApiResponseDto<string>> ValidateCandidatesFromProc(List<GetCandidateBinDto> candidateDtos)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var _connectionString = _config.GetConnectionString("EpicConnection");

                using var connection = new SqlConnection(_connectionString);

                DataTable tvp = ConvertToTable(candidateDtos);

                var parameters = new DynamicParameters();
                parameters.Add("@CandidatesTVP", tvp.AsTableValuedParameter("dbo.UploadCandidateType"));
                parameters.Add("@PartnerId", loggedInUserDetails.PartnerId);

                var results = await connection.QueryAsync<CandidateValidationResultDto>(
                    "ValidateCandidates",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                var invalidEntries = results.Select(x => x.ErrorMessage).ToList();

                if (invalidEntries.Count != 0)
                {
                    var _message = $"Validation failed for some candidates:\n{string.Join("\n", invalidEntries)}";
                    throw new Exception(_message);
                }

                return _mapper.Map<string>(string.Join("\n", invalidEntries));

            }, "Candidates Validated successfully.");
        }

        public DataTable ConvertToTable(List<GetCandidateBinDto> candidateDtos)
        {
            var candidateTable = new DataTable();
            candidateTable.Columns.Add("PartnerId", typeof(int));
            candidateTable.Columns.Add("PartnerCode", typeof(string));
            candidateTable.Columns.Add("HiringRequestId", typeof(int));
            candidateTable.Columns.Add("HrqId", typeof(string));
            candidateTable.Columns.Add("JobTitle", typeof(string));
            candidateTable.Columns.Add("FullName", typeof(string));
            candidateTable.Columns.Add("PhoneNumber", typeof(string));
            candidateTable.Columns.Add("Email", typeof(string));
            candidateTable.Columns.Add("RoleHiredFor", typeof(string));
            candidateTable.Columns.Add("PrimarySkillNames", typeof(string));
            candidateTable.Columns.Add("SecondarySkillNames", typeof(string));
            candidateTable.Columns.Add("PreferredWorkLocationNames", typeof(string));
            candidateTable.Columns.Add("Diversity", typeof(string));
            candidateTable.Columns.Add("CountryName", typeof(string));
            candidateTable.Columns.Add("StateName", typeof(string));
            candidateTable.Columns.Add("CityName", typeof(string));
            candidateTable.Columns.Add("NoticePeriod", typeof(int));
            candidateTable.Columns.Add("RelevantExperience", typeof(int));
            candidateTable.Columns.Add("CurrentlyWorking", typeof(string));
            candidateTable.Columns.Add("CurrentOrganisation", typeof(string));
            candidateTable.Columns.Add("LastWorkingDay", typeof(DateTime));
            candidateTable.Columns.Add("IsDuplicate", typeof(bool));
            candidateTable.Columns.Add("PrimarySkillIds", typeof(string));
            candidateTable.Columns.Add("SecondarySkillIds", typeof(string));
            candidateTable.Columns.Add("PreferredWorkLocationIds", typeof(string));
            candidateTable.Columns.Add("ExistingCandidateCode", typeof(string));
            candidateTable.Columns.Add("IsSingleEntry", typeof(bool));
            candidateTable.Columns.Add("CountryId", typeof(int));
            candidateTable.Columns.Add("StateId", typeof(int));
            candidateTable.Columns.Add("CityId", typeof(int));

            // Add rows using foreach
            foreach (var c in candidateDtos)
            {
                candidateTable.Rows.Add(
                    (object?)c.PartnerId ?? DBNull.Value,
                    c.PartnerCode ?? (object)DBNull.Value,
                    (object?)c.HiringRequestId ?? DBNull.Value,
                    c.HrqId ?? (object)DBNull.Value,
                    c.JobTitle ?? (object)DBNull.Value,
                    c.FullName ?? (object)DBNull.Value,
                    c.PhoneNumber ?? (object)DBNull.Value,
                    c.Email ?? (object)DBNull.Value,
                    c.RoleHiredFor ?? (object)DBNull.Value,
                    (c.PrimarySkillNames != null && c.PrimarySkillNames.Any()) ? string.Join(';', c.PrimarySkillNames) : (object)DBNull.Value,
                    (c.SecondarySkillNames != null && c.SecondarySkillNames.Any()) ? string.Join(';', c.SecondarySkillNames) : (object)DBNull.Value,
                    (c.PreferredWorkLocationNames != null && c.PreferredWorkLocationNames.Any()) ? string.Join(';', c.PreferredWorkLocationNames) : (object)DBNull.Value,
                    c.Diversity ?? (object)DBNull.Value,
                    c.CountryName ?? (object)DBNull.Value,
                    c.StateName ?? (object)DBNull.Value,
                    c.CityName ?? (object)DBNull.Value,
                    (object?)c.NoticePeriod ?? DBNull.Value,
                    (object?)c.RelevantExperience ?? DBNull.Value,
                    c.CurrentlyWorking ?? (object)DBNull.Value,
                    c.CurrentOrganisation ?? (object)DBNull.Value,
                    (object?)c.LastWorkingDay ?? DBNull.Value,
                    (object?)c.IsDuplicate ?? DBNull.Value,
                    c.PrimarySkillIds ?? (object)DBNull.Value,
                    c.SecondarySkillIds ?? (object)DBNull.Value,
                    c.PreferredWorkLocationIds ?? (object)DBNull.Value,
                    c.ExistingCandidateCode ?? (object)DBNull.Value,
                    (object?)c.IsSingleEntry ?? DBNull.Value,
                    (object?)c.CountryId ?? DBNull.Value,
                    (object?)c.StateId ?? DBNull.Value,
                    (object?)c.CityId ?? DBNull.Value
                );
            }

            return candidateTable;
        }

        public async Task<ApiResponseDto<string>> ValidateCandidates(List<GetCandidateBinDto> candidateDtos)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                // Get distinct input values
                var hrqIds = candidateDtos.Select(c => c.HrqId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct();
                var countryNames = candidateDtos.Select(c => c.CountryName).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var stateNames = candidateDtos.Select(c => c.StateName).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var cityNames = candidateDtos.Select(c => c.CityName).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var PartnerCodes = candidateDtos.Select(c => c.PartnerCode).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var primarySkillNames = candidateDtos.Where(c => c.PrimarySkillNames != null).SelectMany(c => c.PrimarySkillNames!).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct();
                var secondarySkillNames = candidateDtos.Where(c => c.SecondarySkillNames != null).SelectMany(c => c.SecondarySkillNames!).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct();

                // Get full matching entities
                var hiringMap = await _context.Hiring.Include(x => x.InterviewRounds)
                                                     .Include(x => x.PartnerCategory)
                                                           .ThenInclude(x => x.SelectedPartners)
                                                     .Include(x => x.JobDetails)
                                                           .ThenInclude(x => x.ResourceType)
                                                     .Where(h => h.IsParentHRQ == true && hrqIds.Contains(h.HrqId)
                                                      && (new[] { HIRING_STATUS.NEW, HIRING_STATUS.WIP, HIRING_STATUS.CANDIDATE_IDENTIFIED }.Contains((HIRING_STATUS?)h.HiringStatusId ?? default)))
                                                     .ToDictionaryAsync(h => h.HrqId, StringComparer.OrdinalIgnoreCase);

                var countryMap = await _context.M_Countries!.Where(c => countryNames!.Contains(c.Name!))
                                                            .ToDictionaryAsync(c => c!.Name!, StringComparer.OrdinalIgnoreCase);

                var stateMap = await _context.M_States.Where(s => stateNames.Contains(s.Name))
                                                      .ToDictionaryAsync(s => s!.Name!, StringComparer.OrdinalIgnoreCase);

                var cityMap = await _context!.M_Cities!.Where(c => cityNames!.Contains(c.Name!))
                                                       .ToDictionaryAsync(c => c!.Name!, StringComparer.OrdinalIgnoreCase);

                var partnerMap = await _context!.Partners!.Where(c => PartnerCodes!.Contains(c.PartnerCode!))
                                                         .ToDictionaryAsync(c => c!.PartnerCode!, StringComparer.OrdinalIgnoreCase);

                var primarySkillsMap = await _context.M_Skills!.Where(c => primarySkillNames.Contains(c.Name!.Trim().ToLower()))
                                                               .ToDictionaryAsync(c => c.Name!, StringComparer.OrdinalIgnoreCase);

                var secondarySkillsMap = await _context.M_Skills!.Where(c => secondarySkillNames.Contains(c.Name!.Trim().ToLower()))
                                                                 .ToDictionaryAsync(c => c.Name!, StringComparer.OrdinalIgnoreCase);

                // Validate and enrich candidate data
                var validationTasks = candidateDtos.Select(async candidate =>
                {
                    var errors = new List<string>();

                    //// PartnerId
                    if (loggedInUserDetails.PartnerId == null)
                    {
                        if (!string.IsNullOrWhiteSpace(candidate.PartnerCode) && partnerMap.TryGetValue(candidate.PartnerCode.Trim(), out var partner))
                            candidate.PartnerId = partner.Id;
                        else
                            errors.Add($"Invalid Partner '{candidate.PartnerName}'");
                    }
                    else
                        candidate.PartnerId = loggedInUserDetails.PartnerId;

                    //// HrqId
                    if (!string.IsNullOrWhiteSpace(candidate.HrqId) && hiringMap.TryGetValue(candidate.HrqId.Trim(), out var hiring))
                    {
                        if (hiring.PartnerCategory == null)
                            errors.Add($"Hiring Request is not associated with any partner category. HrqId : '{candidate.HrqId}'");
                        if (hiring.PartnerCategory?.IsProxyPartner == true)
                            errors.Add("Cannot add candidates to proxy hiring requests.");
                        else if (hiring.PartnerCategory?.SelectedPartners == null || !hiring.PartnerCategory.SelectedPartners.Any(x => x.PartnerId == candidate.PartnerId))
                            errors.Add($"Partner is not assigned with '{candidate.HrqId}'");

                        if (hiring.IsParentHRQ == false)
                            errors.Add($"Cannot add candidates to child hiring requests. HrqId : '{candidate.HrqId}'");

                        if (hiring.JobDetails == null)
                            errors.Add($"Please make sure JobDetails are available for the HRQ ID: '{candidate.HrqId}'.");

                        if (hiring.InterviewRounds?.Count() == 0)
                            errors.Add($"Please ensure at least one interview round is scheduled. HRQ ID: '{candidate.HrqId}'");

                        if (hiring.JobDetails != null && candidate.HiringRequestId != 0)
                        {
                            var worklocations = candidate.PreferredWorkLocationNames?
                                                     .Where(s => !string.IsNullOrWhiteSpace(s))
                                                     .Distinct()
                                                     .ToList() ?? new List<string>();

                            var mergedCities = hiring.JobDetails.PrimaryCityIds?
                                                  .Concat(hiring.JobDetails.SecondaryCityIds ?? [])
                                                  .Distinct() ?? [];

                            var workLocationsMap = await _context.M_Cities!
                                .Where(c => mergedCities.Contains(c.Id) &&
                                            worklocations.Contains(c.Name!.Trim().ToLower()))
                                .ToDictionaryAsync(c => c.Name!, StringComparer.OrdinalIgnoreCase);

                            /////// WorkLocations
                            if (candidate.PreferredWorkLocationNames?.Count > 0)
                            {
                                foreach (var location in candidate.PreferredWorkLocationNames)
                                {
                                    if (!workLocationsMap.TryGetValue(location, out var locationEntity))
                                        errors.Add($"Invalid work location : '{location}'");
                                }
                            }
                        }
                    }
                    else
                        errors.Add($"Invalid HRQID '{candidate.HrqId}'");

                    //// Email
                    if (string.IsNullOrWhiteSpace(candidate.Email) || !EmailRegex.IsMatch(candidate.Email))
                        errors.Add($"Invalid email : '{candidate.Email}'");

                    //// PhoneNumber
                    if (string.IsNullOrWhiteSpace(candidate.PhoneNumber) || !PhoneRegex.IsMatch(candidate.PhoneNumber))
                        errors.Add($"Invalid phone number format. Must be 10 digits and start with 6-9. : '{candidate.PhoneNumber}'");

                    //// CountryName
                    if (string.IsNullOrEmpty(candidate.CountryName) || !countryMap.TryGetValue(candidate.CountryName, out var country))
                        errors.Add($"Invalid Country '{candidate.CountryName}'");

                    //// StateName
                    if (string.IsNullOrWhiteSpace(candidate.StateName) || !stateMap.TryGetValue(candidate.StateName, out var state))
                        errors.Add($"Invalid State '{candidate.StateName}'");

                    //// CityName
                    if (string.IsNullOrWhiteSpace(candidate.CityName) || !cityMap.TryGetValue(candidate.CityName, out var city))
                        errors.Add($"Invalid City '{candidate.CityName}'");

                    //// PrimarySkillNames
                    if (candidate.PrimarySkillNames?.Count > 0)
                    {
                        foreach (var skill in candidate.PrimarySkillNames)
                        {
                            if (!primarySkillsMap.TryGetValue(skill, out var skillEntity))
                                errors.Add($"Invalid primary skill : '{skill}'");
                        }
                    }

                    //// SecondarySkillNames
                    if (candidate.SecondarySkillNames?.Count > 0)
                    {
                        foreach (var skill in candidate.SecondarySkillNames)
                        {
                            if (!secondarySkillsMap.TryGetValue(skill, out var skillEntity))
                                errors.Add($"Invalid secondary skill : '{skill}'");
                        }
                    }

                    //// Diversity
                    if (candidate.Diversity != null && !candidate.Diversity.Equals("yes", StringComparison.CurrentCultureIgnoreCase) && !candidate.Diversity.Equals("no", StringComparison.CurrentCultureIgnoreCase))
                        errors.Add("Invalid Diversity");

                    //// CurrentlyWorking
                    if (candidate.CurrentlyWorking != null && !candidate.CurrentlyWorking.Equals("yes", StringComparison.CurrentCultureIgnoreCase) && !candidate.CurrentlyWorking.Equals("no", StringComparison.CurrentCultureIgnoreCase))
                        errors.Add("Invalid CurrentlyWorking");

                    if (errors.Count != 0)
                        return $"Candidate [{candidate.FullName}] has invalid data: {string.Join(", ", errors)}";

                    candidate.IsSingleEntry = false;
                    return null;
                });

                // run all candidate validations concurrently
                var validationResults = await Task.WhenAll(validationTasks);

                // collect all invalid entries
                var invalidEntries = validationResults.Where(r => r != null).ToList();

                if (invalidEntries.Count != 0)
                {
                    var _message = $"Validation failed for some candidates:\n{string.Join("\n", invalidEntries)}";
                    throw new Exception(_message);
                }

                return _mapper.Map<string>(string.Join("\n", invalidEntries));

            }, "Candidates Validated successfully.");
        }

        public async Task<ApiResponseDto<GetCandidateBinDto>> UploadCandidate(AddCandidateBinDto candidateDto)
        {
            return await ExecuteAsync(async () =>
            {
                var (UserId, RoleId, PartnerId) = _helperMethods.GetUserDetails();

                Candidate addOrUpdateCandidate = new();

                if (candidateDto == null)
                    throw new Exception("Data is required");

                candidateDto.PartnerId = candidateDto.PartnerId ?? PartnerId;

                var resultDto = _candidateHelperMethods.MarkIfCandidateIsExistedInCandidateForms(candidateDto.Email, candidateDto.PhoneNumber);

                if (resultDto.IsDuplicate == true && resultDto.AllowToUpdate == false)
                {
                    candidateDto.IsDuplicate = resultDto.IsDuplicate;
                    candidateDto.ExistingCandidateCode = resultDto.ExistingCandidateCode;
                    candidateDto.ResumeUploadedOn = candidateDto.Resume != null ? DateTime.UtcNow : null;
                    candidateDto.ReUploadedCandidateOn = DateTime.UtcNow;
                    candidateDto.IsAgreedForTermsConditions = candidateDto.IsAgreedForTermsConditions;

                    var addedInBin = await _candidateBinRepository.AddAsync(_mapper.Map<CandidateBin>(candidateDto));

                    return _mapper.Map<GetCandidateBinDto>(addedInBin);
                }

                if (await _candidateHelperMethods.VerifyProfileCap(candidateDto.PartnerId, candidateDto.HiringRequestId))
                    throw new Exception("The partner has exceeded the daily limit for adding profiles. No additional profiles can be added today.");

                if (await _candidateHelperMethods.VerifyScreeningCap(candidateDto.HiringRequestId))
                    throw new Exception($"Screening cap exceeded for Hiring Request ID {candidateDto.HiringRequestId}. Please add tomorrow.");

                if (resultDto.IsDuplicate == true)
                {
                    var candidate = await _candidateFormRepository.GetAsync(query => query.Where(x => x.CandidateCode == resultDto.ExistingCandidateCode));

                    candidate.PartnerId = candidateDto.PartnerId;
                    candidate.IsSingleEntry = candidateDto.IsSingleEntry;
                    candidate.HiringRequestId = candidateDto.HiringRequestId;
                    candidate.FullName = candidateDto.FullName;
                    candidate.PhoneNumber = candidateDto.PhoneNumber;
                    candidate.Email = candidateDto.Email;
                    candidate.ResourceTypeId = candidateDto.ResourceTypeId;
                    candidate.CountryId = candidateDto.CountryId;
                    candidate.StateId = candidateDto.StateId;
                    candidate.CityId = candidateDto.CityId;
                    candidate.NoticePeriod = candidateDto.NoticePeriod;
                    candidate.RelevantExperience = candidateDto.RelevantExperience;
                    candidate.Diversity = candidateDto.Diversity != null && candidateDto.Diversity.Equals("yes", StringComparison.CurrentCultureIgnoreCase) ? "Yes" : "No";
                    candidate.CurrentlyWorking = candidateDto.CurrentlyWorking != null && candidateDto.CurrentlyWorking.Equals("yes", StringComparison.CurrentCultureIgnoreCase) ? "Yes" : "No"; ;
                    candidate.CurrentOrganisation = candidateDto.CurrentOrganisation;
                    candidate.LastOrganisation = candidateDto.LastOrganisation;
                    candidate.LastWorkingDay = candidateDto.LastWorkingDay;
                    candidate.ResumeId = candidateDto.ResumeId;
                    candidate.Resume = _mapper.Map<DocumentDetails>(candidateDto.Resume);
                    candidate.EmployeeId = candidateDto.EmployeeId;
                    candidate.PCLifecycleId = candidateDto.PCLifecycleId;
                    candidate.RequestedMicrosoftAccount = candidateDto.RequestedMicrosoftAccount;
                    candidate.ConsideredForFutureRequirements = candidateDto.ConsideredForFutureRequirements;
                    candidate.IsReferred = candidateDto.IsReferred;
                    candidate.ReferredBy = candidateDto.ReferredBy;
                    candidate.IntakeStatusId = await _candidateHelperMethods.GetIntakeStatusBasedOnHiringRequestId(candidateDto.HiringRequestId);
                    candidate.IsDuplicate = candidateDto.IsDuplicate;
                    candidate.IsAgreedForTermsConditions = candidateDto.IsAgreedForTermsConditions;
                    candidate.IsActive = candidateDto.IsActive;
                    candidate.ResumeUploadedOn = candidateDto.ResumeUploadedOn;
                    candidate.ReUploadedCandidateOn = candidateDto.ReUploadedCandidateOn ?? DateTime.UtcNow;
                    candidate.RoleHiredFor = candidateDto.RoleHiredFor;
                    candidate.PrimarySkillIds = candidateDto.PrimarySkillIdList;
                    candidate.SecondarySkillIds = candidateDto.SecondarySkillIdList;
                    candidate.PreferredWorkLocationIds = candidateDto.PreferredWorkLocationIdList;

                    await _candidateFormRepository.UpdateAsync(candidate);

                    addOrUpdateCandidate = candidate;

                    var history = new CandidateHistory(candidate);

                    var historyAdded = await _candidateFormHistoryRepository.AddAsync(history);
                }
                else
                {
                    var candidate = _mapper.Map<Candidate>(candidateDto);

                    candidate.Diversity = candidateDto.Diversity != null && candidateDto.Diversity.Equals("yes", StringComparison.CurrentCultureIgnoreCase) ? "Yes" : "No";
                    candidate.CurrentlyWorking = candidateDto.CurrentlyWorking != null && candidateDto.CurrentlyWorking.Equals("yes", StringComparison.CurrentCultureIgnoreCase) ? "Yes" : "No"; ;
                    candidate.ApprovedBy = UserId;
                    candidate.ApprovedDate = DateTime.UtcNow;
                    candidate.ResumeUploadedOn = candidateDto.Resume != null ? DateTime.UtcNow : null;
                    candidate.IntakeStatusId = await _candidateHelperMethods.GetIntakeStatusBasedOnHiringRequestId(candidateDto.HiringRequestId);

                    var added = await _candidateFormRepository.AddAsync(candidate);

                    addOrUpdateCandidate = added;

                    var history = new CandidateHistory(candidate);

                    var historyAdded = await _candidateFormHistoryRepository.AddAsync(history);
                }

                var templateDetails = await _emailTemplateService.GetTemplateByName(PartnerEmailTemplateEnums.CandidateUploadedNotification.ToString());

                try
                {
                    var prtner = await _partnerRepository.GetAsync(candidateDto.PartnerId);
                    var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtner.Id));
                    var hiringRequest = await _hiringRepository.GetAsync(query => query.Where(x => x.Id == candidateDto.HiringRequestId));
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

                    var candidateDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(addOrUpdateCandidate, new JsonSerializerSettings
                    {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented,
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new InitCapNamingStrategy()
                        }
                    }), "Candidate.");

                    var candidareHiringDict = Utility.Utility.Merge(candidateDict, hiringRequestDict);

                    var dictionary = Utility.Utility.Merge(candidareHiringDict, partHiringDict);

                    var link = _configuration["ClientHostName"] + "/home/candidate-management/candidate-profile?id=" + addOrUpdateCandidate.CandidateCode;
                    dictionary.Add("ProfileLink", link);


                    await _communicationService.AddNotification((int)CandidateEmailTemplateEnums.PartnerCandidateUpload, toEmail,
                        dictionary, ccEmail);

                }
                catch (Exception ex)
                { }

                return _mapper.Map<GetCandidateBinDto>(addOrUpdateCandidate);

            }, "Uploaded Candiate has been added to Candidate List");
        }

        public async Task<ApiResponseDto<List<GetCandidateBinDto>>> UploadCandidatesFromProc(List<GetCandidateBinDto> candidateDtos)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var _connectionString = _config.GetConnectionString("EpicConnection");

                using var connection = new SqlConnection(_connectionString);

                DataTable tvp = ConvertToTable(candidateDtos);

                var parameters = new DynamicParameters();
                parameters.Add("@CandidatesTVP", tvp.AsTableValuedParameter("dbo.UploadCandidateType"));
                parameters.Add("@PartnerId", loggedInUserDetails.PartnerId);
                parameters.Add("@UserId", loggedInUserDetails.UserId);

                var results = await connection.QueryAsync<GetCandidateBinDto>(
                    "UploadValidatedCandidates",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                results.ForEach(x =>
                {
                    x.PrimarySkillIds = string.IsNullOrWhiteSpace(x.PrimarySkillIdStr) ? new List<int>() : System.Text.Json.JsonSerializer.Deserialize<List<int>>(x.PrimarySkillIdStr);
                    x.SecondarySkillIds = string.IsNullOrWhiteSpace(x.SecondarySkillIdStr) ? new List<int>() : System.Text.Json.JsonSerializer.Deserialize<List<int>>(x.SecondarySkillIdStr);
                    x.PreferredWorkLocationIds = string.IsNullOrWhiteSpace(x.PreferredWorkLocationIdStr) ? new List<int>() : System.Text.Json.JsonSerializer.Deserialize<List<int>>(x.PreferredWorkLocationIdStr);
                    x.PrimarySkillIdStr = null;
                    x.SecondarySkillIdStr = null;
                    x.PreferredWorkLocationIdStr = null;
                });

                var invalidEntries = results.Where(x => !string.IsNullOrEmpty(x.ErrorMessage)).Select(x => x.ErrorMessage).ToList();

                if (invalidEntries != null && invalidEntries.Any())
                    throw new Exception(_mapper.Map<string>(string.Join("\n", invalidEntries)));

                return results.ToList();

            }, "Candidates Uploaded successfully.");
        }


        public async Task<ApiResponseDto<List<GetCandidateBinDto>>> UploadCandidates(List<AddCandidateBinDto> candidateDtos)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var invalidEntries = new List<string>();

                // Get distinct input values
                var hrqIds = candidateDtos.Select(c => c.HrqId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct();
                var countryNames = candidateDtos.Select(c => c.CountryName).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var stateNames = candidateDtos.Select(c => c.StateName).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var cityNames = candidateDtos.Select(c => c.CityName).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var PartnerCodes = candidateDtos.Select(c => c.PartnerCode).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct();
                var primarySkillNames = candidateDtos.Where(c => c.PrimarySkillNames != null).SelectMany(c => c.PrimarySkillNames!).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct();
                var secondarySkillNames = candidateDtos.Where(c => c.SecondarySkillNames != null).SelectMany(c => c.SecondarySkillNames!).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct();


                // Get full matching entities
                var hiringMap = await _context.Hiring
                                              .Include(x => x.PartnerCategory)
                                                 .ThenInclude(x => x.SelectedPartners)
                                              .Include(x => x.JobDetails)
                                                 .ThenInclude(x => x.ResourceType)
                                              .Where(h => h.IsParentHRQ == true &&
                                              hrqIds.Contains(h.HrqId) && (h.HiringStatusId == (int)HIRING_STATUS.NEW || h.HiringStatusId == (int)HIRING_STATUS.WIP || h.HiringStatusId == (int)HIRING_STATUS.CANDIDATE_IDENTIFIED))
                                              .ToDictionaryAsync(h => h.HrqId, StringComparer.OrdinalIgnoreCase);

                var countryMap = await _context.M_Countries!
                                               .Where(c => countryNames!.Contains(c.Name!))
                                               .ToDictionaryAsync(c => c!.Name!, StringComparer.OrdinalIgnoreCase);

                var stateMap = await _context.M_States
                                             .Where(s => stateNames.Contains(s.Name))
                                             .ToDictionaryAsync(s => s!.Name!, StringComparer.OrdinalIgnoreCase);

                var cityMap = await _context!.M_Cities!
                                             .Where(c => cityNames!.Contains(c.Name!))
                                             .ToDictionaryAsync(c => c!.Name!, StringComparer.OrdinalIgnoreCase);

                var partnerMap = await _context!.Partners!
                    .Where(c => PartnerCodes!.Contains(c.PartnerCode!))
                    .ToDictionaryAsync(c => c!.PartnerCode!, StringComparer.OrdinalIgnoreCase);

                var primarySkillsMap = await _context.M_Skills!
                                                     .Where(c => primarySkillNames.Contains(c.Name!.Trim().ToLower()))
                                                     .ToDictionaryAsync(c => c.Name!, StringComparer.OrdinalIgnoreCase);

                var secondarySkillsMap = await _context.M_Skills!
                    .Where(c => secondarySkillNames.Contains(c.Name!.Trim().ToLower()))
                    .ToDictionaryAsync(c => c.Name!, StringComparer.OrdinalIgnoreCase);

                // Validate and enrich candidate data
                foreach (var candidate in candidateDtos)
                {
                    var errors = new List<string>();

                    //// PartnerId
                    if (loggedInUserDetails.PartnerId == null)
                    {
                        if (!string.IsNullOrWhiteSpace(candidate.PartnerCode) && partnerMap.TryGetValue(candidate.PartnerCode, out var partner))
                            candidate.PartnerId = partner.Id;
                        else
                            errors.Add($"Invalid Partner '{candidate.PartnerName}'");
                    }
                    else
                        candidate.PartnerId = loggedInUserDetails.PartnerId;

                    //// HrqId
                    if (!string.IsNullOrWhiteSpace(candidate.HrqId) && hiringMap.TryGetValue(candidate.HrqId.Trim(), out var hiring))
                    {
                        var selectedPartners = hiring.PartnerCategory?.SelectedPartners;

                        if (hiring.PartnerCategory == null)
                            errors.Add($"Hiring Request is not associated with any partner category. HrqId : '{candidate.HrqId}'");

                        if (hiring.PartnerCategory?.IsProxyPartner == true)
                            errors.Add($"Cannot add candidates to proxy hiring requests.");
                        else if (selectedPartners != null && !selectedPartners!.Any(x => x.PartnerId == candidate.PartnerId))
                            errors.Add($"Partner is not assigned with '{candidate.HrqId}'");
                        else
                        {
                            candidate.HrqId = hiring.HrqId;
                            candidate.HiringRequestId = hiring.Id;
                            candidate.ResourceTypeId = hiring.JobDetails?.ResourceTypeId;
                            candidate.IntakeStatusId = await _candidateHelperMethods.GetIntakeStatusBasedOnHiringRequestId(hiring.Id);
                        }

                        if (hiring.IsParentHRQ == false)
                            errors.Add($"Cannot add candidates to child hiring requests. HrqId : '{candidate.HrqId}'");

                        if (hiring.JobDetails == null)
                            errors.Add($"Please make sure that JobDetails are available for the HRQ ID: '{candidate.HrqId}'.");

                        if (hiring.PartnerCategory == null)
                            errors.Add($"Please make sure that PartnerCategory are available for the HRQ ID: '{candidate.HrqId}'.");

                        if (hiring.InterviewRounds?.Count() == 0)
                            errors.Add($"Please ensure at least one interview round is scheduled.HRQ ID: '{candidate.HrqId}'");

                        if (candidate.HiringRequestId != 0)
                        {
                            var worklocations = candidate.PreferredWorkLocationNames?.Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList() ?? new List<string>();


                            var mergedCities = await _context.JobDetails
                                                .Where(j => j.HiringRequestId == candidate.HiringRequestId)
                                                .Select(j =>
                                                    (j.PrimaryCityIds ?? new List<int>())
                                                    .Concat(j.SecondaryCityIds ?? new List<int>())
                                                )
                                                .FirstOrDefaultAsync();

                            var validCityIds = mergedCities?.Distinct().ToList() ?? new List<int>();

                            var workLocationsMap = await _context.M_Cities!.Where(c => validCityIds.Contains(c.Id) && worklocations.Contains(c.Name!.Trim().ToLower()))
                            .ToDictionaryAsync(c => c.Name!, StringComparer.OrdinalIgnoreCase);

                            var preferedWorklocations = new List<int>();

                            /////// WorkLocations
                            if (candidate.PreferredWorkLocationNames?.Count > 0)
                            {
                                foreach (var location in candidate.PreferredWorkLocationNames)
                                {
                                    if (workLocationsMap.TryGetValue(location, out var locationEntity))
                                    {
                                        preferedWorklocations.Add(locationEntity.Id);
                                    }
                                    else
                                    {
                                        errors.Add($"Invalid work location : '{location}'");
                                    }
                                }

                                if (preferedWorklocations?.Count > 0)
                                    candidate.PreferredWorkLocationIdList = preferedWorklocations;
                            }
                        }
                    }
                    else
                        errors.Add($"Invalid HRQID '{candidate.HrqId}'");

                    //// CountryName
                    if (!string.IsNullOrWhiteSpace(candidate.CountryName) && countryMap.TryGetValue(candidate.CountryName, out var country))
                        candidate.CountryId = country.Id;
                    else
                        errors.Add($"Invalid Country '{candidate.CountryName}'");

                    //// StateName
                    if (!string.IsNullOrWhiteSpace(candidate.StateName) && stateMap.TryGetValue(candidate.StateName, out var state))
                        candidate.StateId = state.Id;
                    else
                        errors.Add($"Invalid State '{candidate.StateName}'");

                    //// CityName
                    if (!string.IsNullOrWhiteSpace(candidate.CityName) && cityMap.TryGetValue(candidate.CityName, out var city))
                        candidate.CityId = city.Id;
                    else
                        errors.Add($"Invalid City '{candidate.CityName}'");

                    var primarySkills = new List<int>();
                    var secondarySkills = new List<int>();

                    //// PrimarySkillNames
                    if (candidate.PrimarySkillNames?.Count > 0)
                    {
                        foreach (var skill in candidate.PrimarySkillNames)
                        {
                            if (primarySkillsMap.TryGetValue(skill, out var skillEntity))
                            {
                                primarySkills.Add(skillEntity.Id);
                            }
                            else
                                errors.Add($"Invalid primary skill : '{skill}'");
                        }
                    }

                    if (primarySkills?.Count > 0)
                        candidate.PrimarySkillIdList = primarySkills;

                    //// SecondarySkillNames
                    if (candidate.SecondarySkillNames?.Count > 0)
                    {
                        foreach (var skill in candidate.SecondarySkillNames)
                        {
                            if (secondarySkillsMap.TryGetValue(skill, out var skillEntity))
                            {
                                secondarySkills.Add(skillEntity.Id);
                            }
                            else
                                errors.Add($"Invalid secondary skill : '{skill}'");
                        }
                    }

                    if (secondarySkills?.Count > 0)
                        candidate.SecondarySkillIdList = secondarySkills;

                    if (errors.Count != 0)
                        invalidEntries.Add($"Candidate [{candidate.Email}] has invalid data: {string.Join(", ", errors)}");

                    candidate.IsSingleEntry = false;

                    candidate.Diversity = candidate.Diversity != null && candidate.Diversity.Equals("yes", StringComparison.CurrentCultureIgnoreCase) ? "Yes" : "No";
                    candidate.CurrentlyWorking = candidate.CurrentlyWorking != null && candidate.CurrentlyWorking.Equals("yes", StringComparison.CurrentCultureIgnoreCase) ? "Yes" : "No"; ;

                }

                if (invalidEntries.Count != 0)
                {
                    var _message = $"Validation failed for some candidates:\n{string.Join("\n", invalidEntries)}";
                    throw new Exception(_message);
                }

                var candidateBins = _mapper.Map<IEnumerable<CandidateBinBulkUploadDto>>(candidateDtos);

                DataTable tvp = ObjectToTvpHelper.ToDataTable(candidateBins, "CandidateBinDtoType");

                // Pass to SQL Server as TVP
                var candidatesParam = new SqlParameter("@Candidates", tvp)
                {
                    TypeName = "dbo.CandidateBinDtoType",  // your TVP type in SQL Server
                    SqlDbType = SqlDbType.Structured
                };

                var result = await _context.CandidateUploadResults.FromSqlRaw("EXEC dbo.InsertCandidatesFromUpload @Candidates", candidatesParam).ToListAsync();

                return _mapper.Map<List<GetCandidateBinDto>>(result);

            }, "Candidates uploaded to Review candidates successfully.");
        }

        private async Task SendCandidateUploadedEmail(int partnerId, int hiringRequestId, int template, int candidateId)
        {
            try
            {
                var prtner = await _partnerRepository.GetAsync(partnerId);
                var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtner.Id));
                var hiringRequest = await _hiringRepository.GetAsync(query => query.Where(x => x.Id == hiringRequestId));
                var hiringManager = await _userRepository.GetAsync(query => query.Where(x => x.UserId == hiringRequest.HiringMangerId));
                var candidate = await _candidateFormRepository.GetAsync(query => query.Where(x => x.Id == candidateId));

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

                var candidateDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(candidate, new JsonSerializerSettings
                {
                    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                    Formatting = Formatting.Indented,
                    ContractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new InitCapNamingStrategy()
                    }
                }), "Candidate.");

                var candidareHiringDict = Utility.Utility.Merge(candidateDict, hiringRequestDict);

                var dictionary = Utility.Utility.Merge(candidareHiringDict, partHiringDict);

                var link = _configuration["ClientHostName"] + "/home/candidate-management/candidate-profile?id=" + candidate.CandidateCode;
                dictionary.Add("ProfileLink", link);


                await _communicationService.AddNotification((int)template, toEmail,
                    dictionary, ccEmail);

            }
            catch (Exception ex)
            { }

        }

        public async Task<ApiResponseDto<PagedResult<GetCandidateBinDto>>> GetPagedCandidates(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                if (loggedInUserDetails.RoleId == null)
                    throw new Exception("The current logged in user has not been assigned to any roles.");

                var pagedResult = await _candidateBinRepository.GetPaginatedListWithJoinQueryAsync<GetCandidateBinDto>(pageData,
                     query => from c in query

                              join partner in _context.Partners on c.PartnerId equals partner.Id into partners
                              from partner in partners.DefaultIfEmpty()

                              join hiringRequest in _context.Hiring on c.HiringRequestId equals hiringRequest.Id into hiringRequests
                              from hiringRequest in hiringRequests.DefaultIfEmpty()

                              join resume in _context.DocumentDetails on c.ResumeId equals resume.Id into documents
                              from resume in documents.DefaultIfEmpty()

                              join intakeStatus in _context.M_MasterData on c.IntakeStatusId equals intakeStatus.Id into intakeStatuses
                              from intakeStatus in intakeStatuses.DefaultIfEmpty()

                              where (
                                      (loggedInUserDetails.RoleId == (int)ROLES.ADMIN) ||
                                      (loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER) ||
                                      (loggedInUserDetails.RoleId == (int)ROLES.PARTNER && c.PartnerId == loggedInUserDetails.PartnerId) ||
                                      (loggedInUserDetails.RoleId == (int)ROLES.RMOwner)
                                    ) && c.IsActive == true
                                    && c.IsManagerApproved == null
                                    && c.ExceptionApprovalStatusId == null

                              orderby (c.UpdatedAt ?? c.CreatedAt ?? DateTime.MinValue) descending,
                                       c.Id descending

                              select new GetCandidateBinDto
                              {
                                  PartnerId = c.PartnerId,
                                  PartnerName = partner.PartnerName,
                                  NickName = partner.Nickname,
                                  PartnerCode = c.Partner!.PartnerCode,

                                  CandidateBinId = c.Id,
                                  FullName = c.FullName,
                                  Email = c.Email,
                                  PhoneNumber = c.PhoneNumber,
                                  RoleHiredFor = c.RoleHiredFor,
                                  RelevantExperience = c.RelevantExperience,
                                  Resume = resume != null ? _mapper.Map<DocumentDetailDto>(resume) : null,
                                  IsAgreedForTermsConditions = c.IsAgreedForTermsConditions,
                                  IsRequestException = c.IsRequestException,

                                  HiringRequestId = c.HiringRequestId ?? 0,
                                  HiringStatusId = hiringRequest.HiringStatusId,
                                  JobTitle = hiringRequest.JobTitle,
                                  HrqId = hiringRequest.HrqId,

                                  IsSingleEntry = c.IsSingleEntry,
                                  ResourceTypeId = c.ResourceTypeId,
                                  CountryId = c.CountryId,
                                  StateId = c.StateId,
                                  CityId = c.CityId,
                                  Diversity = c.Diversity,
                                  NoticePeriod = c.NoticePeriod,
                                  CurrentlyWorking = c.CurrentlyWorking,
                                  CurrentOrganisation = c.CurrentOrganisation,
                                  LastOrganisation = c.LastOrganisation,
                                  LastWorkingDay = c.LastWorkingDay,
                                  IsManagerApproved = c.IsManagerApproved,
                                  ManagerApprovedOn = c.ManagerApprovedOn,
                                  ManagerApprovalComments = c.ManagerApprovalComments,
                                  ResumeId = c.ResumeId,
                                  EmployeeId = c.EmployeeId,
                                  PCLifecycleId = c.PCLifecycleId,
                                  RequestedMicrosoftAccount = c.RequestedMicrosoftAccount ?? false,
                                  ConsideredForFutureRequirements = c.ConsideredForFutureRequirements ?? false,
                                  IsReferred = c.IsReferred,
                                  ReferredBy = c.ReferredBy,
                                  IntakeStatusId = c.IntakeStatusId,
                                  IsDuplicate = c.IsDuplicate,
                                  IsActive = c.IsActive,
                                  ExistingCandidateCode = c.ExistingCandidateCode,
                                  ResumeUploadedOn = c.ResumeUploadedOn,
                                  PartnerComments = c.PartnerComments,
                                  ProfileCreatedAt = c.CreatedAt
                              });

                return pagedResult;

            }, "Candidates Bin fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<GetCandidateBinDto>>> GetManagerApprovalCandidates(CandidateExceptionsPageDto pageData, int? partnerId)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var result = await _candidateBinRepository.GetPaginatedListAsync(pageData,
                    query => query
                    .Include(x => x.Resume)
                    .Include(x => x.Partner)
                    .Include(x => x.HiringRequest)
                    .ThenInclude(x => x!.HiringStatus)
                    .Where(x => x.IsRequestException == true
                                && x.IsActive == true
                                && x.IsManagerApproved == null
                                && x.ExceptionApprovalStatusId == null
                                && (x.PartnerId == (partnerId == null ? x.PartnerId : partnerId))
                                && (loggedInUserDetails.RoleId != (int)ROLES.PARTNER || loggedInUserDetails.RoleId == (int)ROLES.ADMIN || loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER || loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER || x.PartnerId == loggedInUserDetails.PartnerId)
                    ));

                var dtos = _mapper.Map<IEnumerable<GetCandidateBinDto>>(result.Items);

                return new PagedResult<GetCandidateBinDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);

            }, "candidate fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> AddToRequestForExceptionList(int id, CandidateBinRequestForExceptionDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateBinRepository.GetAsync(id) ?? throw new Exception($"Candidate is not found in Bin with CandidateBinId : {id}");

                if (result.IsRequestException == true)
                    throw new Exception("This candidate is already request for exception");

                result.IsRequestException = true;
                result.PartnerComments = dto.PartnerComments;

                await _candidateBinRepository.UpdateAsync(result);

            }, "candidate updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ApproveBulkUploadCandidateFromBin(CandidateApprovalDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var result = await _candidateBinRepository.GetAsync(dto.Id)
                             ?? throw new Exception($"Candidate is not found in Bin with CandidateBinId : {dto.Id}");

                result.IsManagerApproved = dto.IsManagerApproved;
                result.ManagerApprovedOn = DateTime.Now;
                result.ManagerApprovalComments = dto.ManagerApprovalComments;
                result.ExceptionApprovalStatusId = dto.IsManagerApproved == true ? (int)EXCEPTION_APPROVAL_STATUS.Accepted : (int)EXCEPTION_APPROVAL_STATUS.Declined;
                result.ApprovedOrDeclinedByUserId = loggedInUserDetails.UserId;

                await _candidateBinRepository.UpdateAsync(result);

                var history = new CandidateBinHistory
                {
                    Id = result.Id,
                    PartnerId = result.PartnerId,
                    HiringRequestId = result.HiringRequestId,
                    IsSingleEntry = result.IsSingleEntry,
                    FullName = result.FullName,
                    PhoneNumber = result.PhoneNumber,
                    Email = result.Email,
                    CountryId = result.CountryId,
                    StateId = result.StateId,
                    CityId = result.CityId,
                    Diversity = result.Diversity,
                    NoticePeriod = result.NoticePeriod,
                    CurrentlyWorking = result.CurrentlyWorking,
                    CurrentOrganisation = result.CurrentOrganisation,
                    LastOrganisation = result.LastOrganisation,
                    LastWorkingDay = result.LastWorkingDay,
                    IsRequestException = result.IsRequestException,
                    ResumeUploadedOn = result.ResumeUploadedOn,
                    ResumeId = result.ResumeId,
                    IntakeStatusId = result.IntakeStatusId,
                    ExceptionApprovalStatusId = result.ExceptionApprovalStatusId,
                    ApprovedOrDeclinedByUserId = result.ApprovedOrDeclinedByUserId,
                    RelevantExperience = result.RelevantExperience,
                    RoleHiredFor = result.RoleHiredFor,
                    PrimarySkillIds = result.PrimarySkillIds,
                    SecondarySkillIds = result.SecondarySkillIds,
                    PreferredWorkLocationIds = result.PreferredWorkLocationIds,
                    IsDuplicate = result.IsDuplicate,
                    ExistingCandidateCode = result.ExistingCandidateCode,

                    IsActive = true,
                    CreatedBy = result.UpdatedBy,
                    CreatedAt = result.CreatedAt,
                    UpdatedBy = result.UpdatedBy,
                    UpdatedAt = result.UpdatedAt,
                    IsManagerApproved = result.IsManagerApproved,
                    ManagerApprovedOn = result.ManagerApprovedOn,
                    ManagerApprovalComments = result.ManagerApprovalComments
                };

                await _candidateBinHistoryRepository.AddAsync(history);

                return dto.IsManagerApproved == true ? "Candidate approved successfully" : $"Candidate rejected and moved to history with Id {history.Id}";

            }, "Candidate processed successfully.");
        }

        public async Task<ApiResponseDto<string>> MoveCandidateFromBin(int id, ConfirmCandidateBinDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                var result = await _candidateBinRepository.GetAsync(id) ?? throw new Exception($"Candidate is not found in Bin with CandidateBinId : {id}");

                if (loggedInUserDetails.RoleId != (int)ROLES.ADMIN && loggedInUserDetails.RoleId != (int)ROLES.HIRINGMANAGER && loggedInUserDetails.RoleId != (int)ROLES.VENDORMANAGER && loggedInUserDetails.RoleId != (int)ROLES.RMOwner)
                    throw new Exception("You do not have permission to reject this candidate.");

                var partner = result.PartnerId.HasValue ? await _partnerRepository.GetAsync(result.PartnerId.Value) : null;

                if (dto.IsApproved == true)
                {
                    var hiringRequest = await _hiringRepository.GetAsync(result.HiringRequestId) ?? throw new Exception($"Hiring rquest is not found.");

                    if (hiringRequest.HiringStatusId != (int)HIRING_STATUS.WIP && hiringRequest.HiringStatusId != (int)HIRING_STATUS.CANDIDATE_IDENTIFIED && hiringRequest.HiringStatusId != (int)HIRING_STATUS.OFFER_ACCEPTED)
                        throw new Exception($"Hiring request is not valid.");

                    var addedCandidateResult = _context.CandidateResult
                        .FromSqlRaw("EXEC dbo.AddCandidateForm @ReviewCandidateId = {0}, @IsAcknoledged = {1}, @IsDuplicate = {2}, @AllowedToUpdate = {3}, @ExistingCandidateCode = {4}, @IsRequestException = {5}",
                                    dto.CandidateBinId, true, true, true, result.ExistingCandidateCode ?? (object)DBNull.Value, true)
                        .ToList();

                    var addedCandidate = addedCandidateResult.FirstOrDefault();

                    if (addedCandidate?.ErrorMessage != null)
                        throw new Exception(addedCandidate.ErrorMessage);
                }

                result.IsManagerApproved = dto.IsApproved;
                result.ManagerApprovedOn = DateTime.Now;
                result.ManagerApprovalComments = dto.ManagerApprovalComments;
                result.ExceptionApprovalStatusId = dto.IsApproved == true ? (int)EXCEPTION_APPROVAL_STATUS.Accepted : (int)EXCEPTION_APPROVAL_STATUS.Declined;
                result.ApprovedOrDeclinedByUserId = loggedInUserDetails.UserId;

                await _candidateBinRepository.UpdateAsync(result, false);

                var history = new CandidateBinHistory
                {
                    Id = result.Id,
                    PartnerId = result.PartnerId,
                    HiringRequestId = result.HiringRequestId,
                    IsSingleEntry = result.IsSingleEntry,
                    FullName = result.FullName,
                    PhoneNumber = result.PhoneNumber,
                    Email = result.Email,
                    CountryId = result.CountryId,
                    StateId = result.StateId,
                    CityId = result.CityId,
                    Diversity = result.Diversity,
                    NoticePeriod = result.NoticePeriod,
                    CurrentlyWorking = result.CurrentlyWorking,
                    CurrentOrganisation = result.CurrentOrganisation,
                    LastOrganisation = result.LastOrganisation,
                    LastWorkingDay = result.LastWorkingDay,
                    IsRequestException = result.IsRequestException,
                    ResumeUploadedOn = result.ResumeUploadedOn,
                    ResumeId = result.ResumeId,
                    IntakeStatusId = result.IntakeStatusId,
                    ExceptionApprovalStatusId = dto.IsApproved == true ? (int)EXCEPTION_APPROVAL_STATUS.Accepted : (int)EXCEPTION_APPROVAL_STATUS.Declined,
                    RelevantExperience = result.RelevantExperience,
                    RoleHiredFor = result.RoleHiredFor,
                    PrimarySkillIds = result.PrimarySkillIds,
                    SecondarySkillIds = result.SecondarySkillIds,
                    PreferredWorkLocationIds = result.PreferredWorkLocationIds,
                    IsDuplicate = result.IsDuplicate,
                    ExistingCandidateCode = result.ExistingCandidateCode,

                    IsActive = true,
                    CreatedBy = result.UpdatedBy,
                    CreatedAt = result.CreatedAt,
                    UpdatedBy = result.UpdatedBy,
                    UpdatedAt = result.UpdatedAt,
                    IsManagerApproved = result.IsManagerApproved,
                    ManagerApprovedOn = result.ManagerApprovedOn,
                    ManagerApprovalComments = result.ManagerApprovalComments
                };

                await _candidateBinHistoryRepository.AddAsync(history);

            }, "Candidate processed successfully.");
        }


        public async Task<ApiResponseDto<PagedResult<CandidateBinHistoryDto>>> GetCandidateApprovedOrRejectedExceptionList(int? partnerId, CandidateExceptionsPageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUserDetails = _helperMethods.GetUserDetails();

                return await _candidateBinRepository.GetPaginatedListWithJoinQueryAsync<CandidateBinHistoryDto>(pageData,
                              query => from candidate in query

                                       join hiring in _context.Hiring on candidate.HiringRequestId equals hiring.Id into hiringGroup
                                       from hiring in hiringGroup.DefaultIfEmpty()

                                       join personalDetails in _context.CandidatePersonalDetails on candidate.Id equals personalDetails.CandidateId into personalDetailsGroup
                                       from personalDetails in personalDetailsGroup.DefaultIfEmpty()

                                       join partner in _context.Partners on candidate.PartnerId equals partner.Id into partnerGroup
                                       from partner in partnerGroup.DefaultIfEmpty()

                                       join intake in _context.M_MasterData on candidate.IntakeStatusId equals intake.Id into intakeGroup
                                       from intake in intakeGroup.DefaultIfEmpty()

                                       orderby (candidate.UpdatedAt ?? candidate.CreatedAt ?? DateTime.MinValue) descending,
                                       candidate.Id descending

                                       where (loggedInUserDetails.RoleId == (int)ROLES.ADMIN ||
                                               loggedInUserDetails.RoleId == (int)ROLES.HIRINGMANAGER ||
                                               loggedInUserDetails.RoleId == (int)ROLES.VENDORMANAGER ||
                                               loggedInUserDetails.RoleId == (int)ROLES.RMOwner ||
                                               (loggedInUserDetails.RoleId == (int)ROLES.PARTNER && candidate.PartnerId == loggedInUserDetails.PartnerId)
                                             ) && (candidate.ExceptionApprovalStatusId == pageData.CandidateExceptionStatusId)
                                                && candidate.IsRequestException == true
                                                && (partnerId == null || candidate.PartnerId == partnerId)

                                       select new CandidateBinHistoryDto
                                       {
                                           PartnerId = candidate.PartnerId,
                                           HiringRequestId = candidate.HiringRequestId,
                                           HrqId = hiring.HrqId,
                                           FullName = candidate.FullName,
                                           PhoneNumber = candidate.PhoneNumber,
                                           Email = candidate.Email,
                                           ResumeId = candidate.ResumeId,
                                           IntakeStatusId = candidate.IntakeStatusId,
                                           IsRequestException = candidate.IsRequestException,
                                           ExistingCandidateCode = candidate.ExistingCandidateCode,
                                           RelevantExperience = candidate.RelevantExperience,
                                           Resume = _mapper.Map<DocumentDetailDto>(candidate.Resume),
                                           PartnerName = partner.Nickname,
                                           RoleHiredFor = candidate.RoleHiredFor ?? hiring.JobTitle,
                                           CreatedBy = candidate.UpdatedBy,
                                           CreatedAt = DateTime.UtcNow,
                                           IsActive = true,
                                           IsManagerApproved = candidate.IsManagerApproved,
                                           ManagerApprovedOn = candidate.ManagerApprovedOn,
                                           ManagerApprovalComments = candidate.ManagerApprovalComments,
                                           ApprovedOrDeclinedByName = candidate.ApprovedOrDeclinedBy.FullName
                                       }

                       );
            }, "Candidate exception list fetched successfully.");
        }


        public async Task<ApiResponseDto<string>> DeleteFromBin(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateBinRepository.GetAsync(id) ?? throw new Exception($"Candidate is not found in Bin with CandidateBinId : {id}");

                await _candidateBinRepository.DeleteAsync(id);

            }, "candidate deleted from bin successfully.");
        }

        public async Task<ApiResponseDto<GetCandidateBinDto>> GetCandidateById(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateBinRepository.GetAsync(query => query
                .Include(x => x.Resume)
                .Include(x => x.HiringRequest)
                .ThenInclude(x => x!.HiringStatus)
                .Include(x => x.Partner)
                .Where(x => x.Id == id)) ?? throw new Exception($"Candidate is not found in Bin with CandidateBinId : {id}");

                var dto = _mapper.Map<GetCandidateBinDto>(result);

                var mergedCities = await _context.JobDetails
                                     .Where(j => j.HiringRequestId == result.HiringRequestId)
                                     .Select(j =>
                                         (j.PrimaryCityIds ?? new List<int>())
                                         .Concat(j.SecondaryCityIds ?? new List<int>())
                                     )
                                     .FirstOrDefaultAsync();

                var validCityIds = mergedCities?.Distinct().ToList() ?? new List<int>();

                var workLocationsMap = await _context.M_Cities!.Where(c => validCityIds.Contains(c.Id)).ToListAsync();

                dto.PreferredWorkLocations = _mapper.Map<List<MasterDto>>(_context.M_Cities.Where(x => (validCityIds ?? new List<int>()).Contains(x.Id)).ToList());

                return dto;

            }, "candidate fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateCandidate(bool? isEditFromGrid, AddCandidateBinDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _candidateBinRepository.GetAsync(dto.CandidateBinId) ?? throw new Exception($"Candidate is not found in Bin with CandidateBinId : {dto.CandidateBinId}");

                result.PartnerId = dto.PartnerId;
                result.IsSingleEntry = dto.IsSingleEntry;
                result.HiringRequestId = dto.HiringRequestId;
                result.FullName = dto.FullName;
                result.PhoneNumber = dto.PhoneNumber;
                result.Email = dto.Email;
                result.ResourceTypeId = dto.ResourceTypeId;
                result.CountryId = dto.CountryId;
                result.StateId = dto.StateId;
                result.CityId = dto.CityId;
                result.Diversity = dto.Diversity;
                result.NoticePeriod = dto.NoticePeriod;
                result.RelevantExperience = dto.RelevantExperience;
                result.CurrentlyWorking = dto.CurrentlyWorking;
                result.CurrentOrganisation = dto.CurrentOrganisation;
                result.LastOrganisation = dto.LastOrganisation;
                result.LastWorkingDay = dto.LastWorkingDay;
                result.IsManagerApproved = dto.IsManagerApproved;
                result.ResumeId = dto.ResumeId;
                result.Resume = _mapper.Map<DocumentDetails>(dto.Resume);
                result.EmployeeId = dto.EmployeeId;
                result.PCLifecycleId = dto.PCLifecycleId;
                result.RequestedMicrosoftAccount = dto.RequestedMicrosoftAccount;
                result.ConsideredForFutureRequirements = dto.ConsideredForFutureRequirements;
                result.IsReferred = dto.IsReferred;
                result.ReferredBy = dto.ReferredBy;
                result.IntakeStatusId = dto.IntakeStatusId;
                result.IsDuplicate = dto.IsDuplicate;
                result.IsAgreedForTermsConditions = dto.IsAgreedForTermsConditions;
                result.IsRequestException = dto.IsRequestException;
                result.ResumeUploadedOn = dto.ResumeUploadedOn;
                result.PartnerComments = dto.PartnerComments;
                result.RoleHiredFor = dto.RoleHiredFor;

                if (result.ResumeId != null && dto.IsAgreedForTermsConditions == true && result.IsDuplicate == false && result.IsRequestException == false)
                {
                    if (await _candidateHelperMethods.VerifyProfileCap(result.PartnerId, result.HiringRequestId))
                        throw new Exception("The partner has exceeded the daily limit for adding profiles. No additional profiles can be added today.");

                    if (await _candidateHelperMethods.VerifyScreeningCap(result.HiringRequestId))
                        throw new Exception($"Screening cap exceeded for Hiring Request ID {result.HiringRequestId}. Please add tomorrow.");

                    Candidate? candidateForm = new();

                    _mapper.Map(result, candidateForm);

                    candidateForm!.Id = 0;
                    candidateForm.IsActive = true;
                    candidateForm.IntakeStatusId = await _candidateHelperMethods.GetIntakeStatusBasedOnHiringRequestId(result.HiringRequestId);
                    var newCandidate = await _candidateFormRepository.AddAsync(candidateForm);

                    if (newCandidate != null)
                        await _candidateBinRepository.DeleteAsync(result.Id);

                    var templateDetails = await _emailTemplateService.GetTemplateByName(PartnerEmailTemplateEnums.CandidateUploadedNotification.ToString());

                    try
                    {
                        var prtner = await _partnerRepository.GetAsync(candidateForm.PartnerId);
                        var contact = await _contactMatrixRepository.GetListAsync(query => query.Where(x => x.PartnerId == prtner.Id));
                        var hiringRequest = await _hiringRepository.GetAsync(query => query.Where(x => x.Id == candidateForm.HiringRequestId));
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

                        var candidateDict = Utility.Utility.GetTopLevelProperties(JsonConvert.SerializeObject(candidateForm, new JsonSerializerSettings
                        {
                            ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                            Formatting = Formatting.Indented,
                            ContractResolver = new DefaultContractResolver
                            {
                                NamingStrategy = new InitCapNamingStrategy()
                            }
                        }), "Candidate.");

                        var candidareHiringDict = Utility.Utility.Merge(candidateDict, hiringRequestDict);

                        var dictionary = Utility.Utility.Merge(candidareHiringDict, partHiringDict);

                        var link = _configuration["ClientHostName"] + "/home/candidate-management/candidate-profile?id=" + candidateForm.CandidateCode;
                        dictionary.Add("ProfileLink", link);


                        await _communicationService.AddNotification((int)CandidateEmailTemplateEnums.PartnerCandidateUpload, toEmail,
                            dictionary, ccEmail);

                        return;
                    }
                    catch (Exception ex)
                    { }
                }

                await _candidateBinRepository.UpdateAsync(result);

            }, "candidate updated successfully.");
        }

        public async Task<ApiResponseDto<string>> CandidateResumeUpload(int candidateBinId, CandidateBinResumeUploadDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                if (dto == null || dto.Resume == null)
                    throw new Exception("Resume details is required");

                var result = await _candidateBinRepository.GetAsync(candidateBinId) ?? throw new Exception($"Candidate is not found in Bin with CandidateBinId : {candidateBinId}");

                result.Resume = _mapper.Map<DocumentDetails>(dto.Resume);

                await _candidateBinRepository.UpdateAsync(result);

            }, "candidate resume uploaded successfully.");
        }

        public async Task<bool> UpdateExistingCandidate(int? BinId)
        {
            var result = await _candidateBinRepository.GetAsync(BinId) ?? throw new Exception($"Candidate is not found in Bin with CandidateBinId : {BinId}");


            var existingCandidate = await _candidateFormRepository.GetAsync(query => query.Include(x => x.HiringRequest).Where(x => x.CandidateCode == result.ExistingCandidateCode))
                                        ?? throw new Exception($"No candidate found with candidate Id : {result.ExistingCandidateCode}");

            if (existingCandidate.IntakeStatusId != null && (
                        existingCandidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.SCREENING ||
                        existingCandidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.INTERVIEWING ||
                        existingCandidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.FEEDBACK_PENDING ||
                        existingCandidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.CANDIDATE_IDENTIFIED ||
                        existingCandidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ROLLED_OUT ||
                        existingCandidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.OFFER_ACCEPTED ||
                        existingCandidate.IntakeStatusId == (int)CANDIDATE_INTAKE_STATUS.ONBOARDED
                    ))
                throw new Exception($"This candidate is still in active with HrqId : \"{existingCandidate?.HiringRequest?.HrqId}\". Please close the existing profile before assigning a new one.");

            existingCandidate.PartnerId = result.PartnerId;
            existingCandidate.HiringRequestId = result.HiringRequestId;
            existingCandidate.IsSingleEntry = result.IsSingleEntry;
            existingCandidate.FullName = result.FullName;
            existingCandidate.PhoneNumber = result.PhoneNumber;
            existingCandidate.Email = result.Email;

            existingCandidate.CountryId = result.CountryId;
            existingCandidate.StateId = result.StateId;
            existingCandidate.CityId = result.CityId;

            existingCandidate.Diversity = result.Diversity;
            existingCandidate.NoticePeriod = result.NoticePeriod;
            existingCandidate.RelevantExperience = result.RelevantExperience;
            existingCandidate.CurrentlyWorking = result.CurrentlyWorking;
            existingCandidate.CurrentOrganisation = result.CurrentOrganisation;
            existingCandidate.LastOrganisation = result.LastOrganisation;
            existingCandidate.LastWorkingDay = result.LastWorkingDay;

            existingCandidate.ResumeId = result.ResumeId;
            existingCandidate.PCLifecycleId = result.PCLifecycleId;
            existingCandidate.ResourceTypeId = result.ResourceTypeId;
            existingCandidate.ApprovedBy = null;
            existingCandidate.ApprovedDate = null;
            existingCandidate.IsScreeningCompleted = null;
            existingCandidate.ScreeningCompletedOn = null;
            existingCandidate.InterviewCompletedOn = null;
            existingCandidate.CandidateIdentifiedOn = null;
            existingCandidate.CandidateDroppedOn = null;
            existingCandidate.CandidateFreezedOn = null;
            existingCandidate.OfferDeclinedOn = null;
            existingCandidate.OfferRolledOutOn = null;
            existingCandidate.CandidateOnholdOn = null;
            existingCandidate.CandidateRejectedOn = null;
            existingCandidate.CandidateJoinedOn = null;
            existingCandidate.CandidateRescheduledOn = null;
            existingCandidate.ScreeningStatus = null;
            existingCandidate.CandidateStatusId = null;

            existingCandidate.CandidateRateCardId = null;
            existingCandidate.OriginalHiringRequestId = null;

            existingCandidate.RequestedMicrosoftAccount = result.RequestedMicrosoftAccount;
            existingCandidate.ConsideredForFutureRequirements = result.ConsideredForFutureRequirements;

            existingCandidate.IsReferred = result.IsReferred;
            existingCandidate.ReferredBy = result.ReferredBy;

            existingCandidate.IsAgreedForTermsConditions = true;
            existingCandidate.RoleHiredFor = result.RoleHiredFor;
            existingCandidate.PrimarySkillIds = result.PrimarySkillIds;
            existingCandidate.SecondarySkillIds = result.SecondarySkillIds;
            existingCandidate.PreferredWorkLocationIds = result.PreferredWorkLocationIds;
            existingCandidate.ReUploadedCandidateOn = DateTime.UtcNow;

            existingCandidate.IntakeStatusId = await _candidateHelperMethods.GetIntakeStatusBasedOnHiringRequestId(result.HiringRequestId);

            await _candidateFormRepository.UpdateAsync(existingCandidate, false);

            var history = new CandidateHistory(existingCandidate);

            var historyAdded = await _candidateFormHistoryRepository.AddAsync(history);

            if (historyAdded != null)
                await _candidateBinRepository.DeleteAsync(result.Id);
            else
                throw new Exception("Error in moving candidate");

            return await Task.FromResult(true);
        }


        public async Task<ApiResponseDto<string>> AckonwledgeCandidate(int candidateBinId, CandidateApprovalDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                if (candidateBinId == 0)
                    throw new Exception("CandidateBinId is required");

                var result = await _candidateBinRepository.GetAsync(candidateBinId) ?? throw new Exception($"Candidate is not found in Bin with CandidateBinId : {candidateBinId}");

                var duplicateCheckDto = _candidateHelperMethods.MarkIfCandidateIsExistedInCandidateForms(result.Email, result.PhoneNumber);

                var hiring = await _hiringRepository.GetAsync(result.HiringRequestId) ?? throw new Exception($"No hiring request found with HiringRequestId: {result.HiringRequestId}");

                if (hiring.HiringStatusId == (int)HIRING_STATUS.CANCELLED || hiring.HiringStatusId == (int)HIRING_STATUS.CLOSED || hiring.HiringStatusId == (int)HIRING_STATUS.ON_HOLD || hiring.HiringStatusId == (int)HIRING_STATUS.CALLED_OFF)
                    throw new Exception("Cannot add candidates to cancelled / onhold / called off / closed hiring requests.");

                //result.IsAgreedForTermsConditions = dto.IsAcknoledged;
                //result.AgreedForTermsConditionsOn = DateTime.Now;

                if (await _candidateHelperMethods.VerifyProfileCap(result.PartnerId, result.HiringRequestId))
                    throw new Exception("The partner has exceeded the daily limit for adding profiles. No additional profiles can be added today.");

                if (await _candidateHelperMethods.VerifyScreeningCap(result.HiringRequestId))
                    throw new Exception($"Screening cap exceeded for Hiring Request ID {result.HiringRequestId}. Please add tomorrow.");

                if (dto.IsAcknoledged == true && duplicateCheckDto != null)
                {
                    var addedCandidateResult = _context.CandidateResult.FromSqlRaw("EXEC dbo.AddCandidateForm @ReviewCandidateId = {0}, @IsAcknoledged = {1}, @IsDuplicate = {2}, @AllowedToUpdate = {3}, @ExistingCandidateCode = {4}, @IsRequestException = {5}",
                                            candidateBinId, dto.IsAcknoledged, duplicateCheckDto.IsDuplicate ?? (object)DBNull.Value, duplicateCheckDto.AllowToUpdate ?? (object)DBNull.Value, duplicateCheckDto.ExistingCandidateCode ?? (object)DBNull.Value, false)
                                            .ToList();
                    var addedCandidate = addedCandidateResult.FirstOrDefault();

                    if (addedCandidate?.ErrorMessage != null)
                        throw new Exception(addedCandidate.ErrorMessage);

                    //result.ExceptionApprovalStatusId = (int)ExceptionApprovalStatus.Accepted;
                }

                //await _candidateBinRepository.UpdateAsync(result);

            }, "candidate updated successfully.");
        }

    }
}
