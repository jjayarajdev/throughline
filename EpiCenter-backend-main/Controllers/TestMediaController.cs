using System.Text.RegularExpressions;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.Enums;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Application.Services;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Shared;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace EpicenterX.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestMediaController(ICommuncationService _communcationService, IEmailTemplateService _emailTemplateService, IPartnerService _partnerService, AppDBContext _context,
        IGenericRepository<Candidate> _candidateRepository) : ControllerBase
    {
        [HttpPost("/notifyemail/{partnerCode}")]
        public async Task<IActionResult> SendPartnerApprovalEmailNotification(string partnerCode, int? notificationId)
        {


            var partnerDetails = await _partnerService.GetPartnerProfile(partnerCode);

            var templateDetails = await _emailTemplateService.GetTemplateByName(PartnerEmailTemplateEnums.PartnerApprovalNotification.ToString());

            // var tokens = Utility.Utility.ObjectToDictionary(partnerDetails);

            // await _communcationService.SendNotification(templateDetails.Data.NotificationId, tokens);


            string json = JsonConvert.SerializeObject(partnerDetails.Data.PartnerDetails);

            var tokens = Utility.Utility.FlattenJsonToDictionary(json);
            var status = await _communcationService.SendNotification(notificationId, tokens);

            if (status == true)
            {
                return Ok(new ResponseDto()
                {
                    Data = "status",
                    Message = "Email Sent Succefully"
                });
            }
            return BadRequest(status);

        }

        [HttpGet("tokens")]
        public async Task<IActionResult> GetTokens([FromQuery] string types)
        {
            if (string.IsNullOrWhiteSpace(types))
                return BadRequest("Types are required");

            var typeNames = types.Split(',', StringSplitOptions.RemoveEmptyEntries);

            var assembly = AppDomain.CurrentDomain.GetAssemblies();
            var resolvedTypes = new List<Type>();

            foreach (var name in typeNames)
            {
                var type = assembly.FirstOrDefault(t => t.FullName.Equals(name.Trim(), StringComparison.OrdinalIgnoreCase)).GetType();

                if (type == null)
                    return BadRequest($"Type '{name}' not found.");

                resolvedTypes.Add(type);
            }

            var result = TokenGenerator.GenerateTokens(typeof(HiringRequest), typeof(Partner)); ;

            return Ok(result);
        }

        [HttpGet("UpdateResumes")]
        public async Task<IActionResult> UpdateResumes()
        {
            var candidateForms = _context.CandidateForms.Where(x => x.ResumeId == null && x.Id > 24244).ToList();
            string resumeFolder = @"C:\Users\imandidu\Downloads\OneDrive_Resumes\New Profile Uploads";

            List<(string, string, string)> files = FileHelper.GetFilesWithDetails(resumeFolder);

            //candidateForms.ForEach(x => x.Resume = new Domain.Shared.DocumentDetails()
            //{
            //    AttachmentName = files.FirstOrDefault(f => f.Item1 == x.FullName).Item3,
            //    IsActive = true,
            //});

            foreach (var candidate in candidateForms)
            {
                string normalizedCandidateName = NormalizeName(candidate.FullName);

                var matchingFile = files.FirstOrDefault(f =>
                {
                    string normalizedFileName = NormalizeName(f.Item1);
                    return normalizedFileName.Contains(normalizedCandidateName, StringComparison.OrdinalIgnoreCase)
                        || normalizedCandidateName.Contains(normalizedFileName, StringComparison.OrdinalIgnoreCase);
                });

                if (matchingFile.Item1 != null)
                {
                    candidate.Resume = new DocumentDetails()
                    {
                        AttachmentName = files.FirstOrDefault(f => f.Item1 == candidate.FullName).Item3,
                        IsActive = true,
                    };
                }
                else
                {
                    var matchingFile1 = files.Select(f => new
                    {
                        File = f,
                        Similarity = GetSimilarity(NormalizeName(f.Item1), NormalizeName(candidate.FullName))
                    }).OrderByDescending(x => x.Similarity).FirstOrDefault(x => x.Similarity >= 60);

                    matchingFile = matchingFile1.File;

                    if (matchingFile.Item1 != null)
                        candidate.Resume = new DocumentDetails()
                        {
                            AttachmentName = files.FirstOrDefault(f => f.Item1 == candidate.FullName).Item3,
                            IsActive = true,
                        };
                }
            }

            await _candidateRepository.UpdateListAsync(candidateForms);

            return Ok();
        }

        private string NormalizeName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return string.Empty;

            string normalized = Regex.Replace(name, @"[^A-Za-z0-9]+", " ");
            normalized = Regex.Replace(normalized, @"\s+", " ").Trim();

            return normalized.ToLowerInvariant();
        }

        /// <summary>
        /// Calculates the Levenshtein similarity (0–100%) between two strings.
        /// </summary>
        private double GetSimilarity(string s1, string s2)
        {
            if (string.IsNullOrEmpty(s1) || string.IsNullOrEmpty(s2)) return 0;

            int distance = ComputeLevenshteinDistance(s1, s2);
            int maxLen = Math.Max(s1.Length, s2.Length);

            if (maxLen == 0) return 100;

            return (1.0 - (double)distance / maxLen) * 100;
        }

        /// <summary>
        /// Levenshtein Distance implementation.
        /// </summary>
        private int ComputeLevenshteinDistance(string source, string target)
        {
            if (string.IsNullOrEmpty(source)) return target.Length;
            if (string.IsNullOrEmpty(target)) return source.Length;

            int[,] matrix = new int[source.Length + 1, target.Length + 1];

            for (int i = 0; i <= source.Length; i++)
                matrix[i, 0] = i;
            for (int j = 0; j <= target.Length; j++)
                matrix[0, j] = j;

            for (int i = 1; i <= source.Length; i++)
            {
                for (int j = 1; j <= target.Length; j++)
                {
                    int cost = source[i - 1] == target[j - 1] ? 0 : 1;

                    matrix[i, j] = Math.Min(
                        Math.Min(
                            matrix[i - 1, j] + 1,   // deletion
                            matrix[i, j - 1] + 1),  // insertion
                        matrix[i - 1, j - 1] + cost); // substitution
                }
            }

            return matrix[source.Length, target.Length];
        }

    }
}