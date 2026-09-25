using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController(INotificationService _notificationService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetNotificationsAsync([FromBody] PageDto pageData)
        {
            var result = await _notificationService.GetPagedNotifications(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetNotificationListAsync()
        {
            var result = await _notificationService.GetNotifications();
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetNotificationAsync(int id)
        {
            var result = await _notificationService.GetNotification(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] NotificationDto dto)
        {
            if (dto == null)
                return BadRequest("Notification data is null.");

            var result = await _notificationService.AddNotification(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNotification(int id, [FromBody] NotificationDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _notificationService.UpdateNotification(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _notificationService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
