using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmailTemplateController(IEmailTemplateService _emailTemplatesService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetEmailTemplatesAsync([FromBody] PageDto pageData)
        {
            var result = await _emailTemplatesService.GetPagedEmailTemplates(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetEmailTemplatesListAsync()
        {
            var result = await _emailTemplatesService.GetEmailTemplates();
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmailTemplateAsync(int id)
        {
            var result = await _emailTemplatesService.GetEmailTemplate(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmailTemplate([FromBody] EmailTemplateDetailsDto dto)
        {
            if (dto == null)
                return BadRequest("Job Details data is null.");

            var result = await _emailTemplatesService.AddEmailTemplate(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmailTemplate(int id, [FromBody] EmailTemplateDetailsDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _emailTemplatesService.UpdateEmailTemplate(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _emailTemplatesService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
