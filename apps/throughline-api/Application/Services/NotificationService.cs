using AutoMapper;
using DocumentFormat.OpenXml.Office2010.Excel;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Services
{
    public class NotificationService(IGenericRepository<Notifications> _notificationRepository,IMapper _mapper) : BaseService, INotificationService
    {
        public async Task<ApiResponseDto<PagedResult<NotificationDto>>> GetPagedNotifications(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _notificationRepository.GetPaginatedListAsync(pageData);
                var dtos = _mapper.Map<IEnumerable<NotificationDto>>(result.Items);
                return new PagedResult<NotificationDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Notifications fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<NotificationDto>>> GetNotifications()
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _notificationRepository.GetListAsync();
                return _mapper.Map<IEnumerable<NotificationDto>>(result);
            }, "Notifications list fetched successfully.");
        }

        public async Task<ApiResponseDto<NotificationDto>> GetNotification(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _notificationRepository.GetAsync(id);
                return entity == null ? throw new Exception($"Notification is not found with Id : {id}") : _mapper.Map<NotificationDto>(entity);
            }, "Notification fetched successfully.");
        }

        public async Task<ApiResponseDto<NotificationDto>> AddNotification(NotificationDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _notificationRepository.AddAsync(_mapper.Map<Notifications>(dto));
                return _mapper.Map<NotificationDto>(entity);
            }, "Notification added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateNotification(NotificationDto dto)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _notificationRepository.GetAsync(dto.Id) ?? throw new Exception($"Notification is not found with Id : {dto.Id}");
                _mapper.Map(dto, entity);
                await _notificationRepository.UpdateAsync(entity);
            }, "Notification updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _notificationRepository.GetAsync(id) ?? throw new Exception($"Notification is not found with Id : {id}");
                entity.IsActive = isActive;
                await _notificationRepository.UpdateAsync(entity);
            }, "Notification status updated successfully.");
        }
    }
}
