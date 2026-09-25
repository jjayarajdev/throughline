using AutoMapper;
using DocumentFormat.OpenXml.Office2010.Excel;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.InterviewRound;
using EpicenterX.Application.DTOs.PMS;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph.Models;

namespace EpicenterX.Application.Services
{
    public class EmailTemplateService(IGenericRepository<EmailTemplate> _emailTemplateRepository, IMapper _mapper) : BaseService, IEmailTemplateService
    {
        public async Task<ApiResponseDto<EmailTemplateDetailsDto>> GetTemplate(int? notificationId)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _emailTemplateRepository.GetAsync(query => query
                .Where(x => x.NotificationId == notificationId)
                );

                return _mapper.Map<EmailTemplateDetailsDto>(result);

            }, "Email Template fetched successfully.");
        }


        public async Task<ApiResponseDto<EmailTemplateDetailsDto>> GetTemplateByName(string? templateName)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _emailTemplateRepository.GetAsync(query => query
                .Where(x => x.TemplateName == templateName)
                );

                return _mapper.Map<EmailTemplateDetailsDto>(result);

            }, "Email Template fetched successfully.");
        }

        public async Task<ApiResponseDto<PagedResult<EmailTemplateDetailsDto>>> GetPagedEmailTemplates(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _emailTemplateRepository.GetPaginatedListAsync(pageData);

                var dtos = _mapper.Map<IEnumerable<EmailTemplateDetailsDto>>(result.Items);

                return new PagedResult<EmailTemplateDetailsDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);

            }, "Email Template fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<EmailTemplateDetailsDto>>> GetEmailTemplates()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _emailTemplateRepository.GetListAsync();

                var dtos = _mapper.Map<IEnumerable<EmailTemplateDetailsDto>>(result);

                return dtos;

            }, "Email Templates fetched successfully.");
        }

        public async Task<ApiResponseDto<EmailTemplateDetailsDto>> GetEmailTemplate(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _emailTemplateRepository.GetAsync(query => query
                        .Where(x => x.Id == id)) ?? throw new Exception($"Email template is not found with Id : {id}");

                var dto = _mapper.Map<EmailTemplateDetailsDto>(entity);

                return dto;

            }, "Email template fetched successfully.");
        }
      
        public async Task<ApiResponseDto<EmailTemplateDetailsDto>> AddEmailTemplate(EmailTemplateDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = _mapper.Map<EmailTemplate>(dto);

                var added = await _emailTemplateRepository.AddAsync(entity);

                return dto;

            }, "Email template fetched successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateEmailTemplate(EmailTemplateDetailsDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _emailTemplateRepository.GetAsync(dto.Id) ?? throw new Exception($"Email template is not found with Id : {dto.Id}");

                entity.NotificationId = dto.NotificationId;
                entity.Subject = dto.Subject;
                entity.TemplateName = dto.TemplateName;
                entity.BodyHtml = dto.BodyHtml; 

                await _emailTemplateRepository.UpdateAsync(entity);

            }, "Email template fetched successfully.");
        }


        public Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            throw new NotImplementedException();
        }

    }
}