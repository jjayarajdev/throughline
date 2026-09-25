using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class UserController(IUserService _userService) : ControllerBase
    {
        [HttpGet("notifications/{userId}")]
        public async Task<IActionResult> GetUserNotifications(int userId)
        {
            var notifications = await _userService.GetUserNotifcationsAsync(userId);
            return Ok(notifications);
        }

        [HttpPatch("notifications/{userId}/{notificationIds}")]
        public async Task<IActionResult> MarkAsReadNotifications(int userId, string notificationIds)
        {
            var notifications = await _userService.GetUserNotifcationsAsync(userId);
            return Ok(notifications);
        }


        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedUsers([FromBody] PageDto pageData, bool? isActive)
        {
            var result = await _userService.GetPagedUsersAsync(pageData, isActive);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetUsers(bool? isActive)
        {
            var users = await _userService.GetUsersAsync(isActive);
            return Ok(users);
        }

        [HttpGet("user-roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _userService.GetRolesAsync();
            return Ok(roles);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _userService.GetUserAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        [HttpPost("user-role-mapping")]
        public async Task<IActionResult> AddUserRole([FromBody] UserRoleDto userRole)
        {
            var result = await _userService.AddUserRoleAsync(userRole);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("user-role-mapping")]
        public async Task<IActionResult> UpdateUserRole([FromBody] UserRoleDto userRole)
        {
            var result = await _userService.UpdateUserRoleAsync(userRole);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("get-user-role")]
        public async Task<IActionResult> GetUserRole(int? userId)
        {
            var result = await _userService.GetUserRole(userId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpDelete("remove-user-role")]
        public async Task<IActionResult> DeleteUserRole(int? userId)
        {
            var result = await _userService.DeleteUserRole(userId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("emp-details-by-emp-code")]
        public async Task<IActionResult> GetEmployeeDetails(string? empCode)
        {
            var result = await _userService.GetEmployeeDetailsByEmployeeCode(empCode);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("get-bet-approver")]
        public async Task<IActionResult> GetBetApprovers()
        {
            var result = await _userService.GetBETApprover();

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
        
        [HttpPatch]
        public async Task<IActionResult> ToggleActivationUserAsync([FromBody] BaseIdentifierDto user)
        {
            var result = await _userService.ToggleActivationStatusAsync(user);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged/user-roles")]
        public async Task<IActionResult> GetPagedUserROles([FromBody] PageDto pageData, bool? isActive, int? roleId, int? userId, int? partnerId)
        {
            var result = await _userService.GetPagedUserRolesAsync(pageData, isActive, roleId, userId, partnerId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}