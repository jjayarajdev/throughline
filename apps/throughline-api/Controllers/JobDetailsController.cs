using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS;
using EpicenterX.Application.DTOs.HMS.JobDetails;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class JobDetailsController(IJobDetailsService _jobDetailsService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetJobDetailsAsync([FromBody] PageDto pageData)
        {
            var result = await _jobDetailsService.GetPagedJobDetails( pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetJobDetailsListAsync(int hiringRequestId)
        {
            var result = await _jobDetailsService.GetJobDetails(hiringRequestId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobDetailAsync(int id)
        {
            var result = await _jobDetailsService.GetJobDetail(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("hiring/{hiringId}")]
        public async Task<IActionResult> GetJobDetailByHiringIdAsync(int hiringId)
        {
            var result = await _jobDetailsService.GetJobDetailByHiringId(hiringId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateJobDetail([FromBody] AddJobDetailsDto dto)
        {
            if (dto == null)
                return BadRequest("Job Details data is null.");

            var result = await _jobDetailsService.AddJobDetail(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobDetail(int id, [FromBody] AddJobDetailsDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _jobDetailsService.UpdateJobDetail(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _jobDetailsService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
