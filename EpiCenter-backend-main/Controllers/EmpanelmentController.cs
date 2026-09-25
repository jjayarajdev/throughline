using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.Empanelment;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EmpanelmentController(IEmpanelmentService _empanelmentService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetEmpanelmentsAsync([FromBody] PageDto pageData)
        {
            var result = await _empanelmentService.GetPagedPartnerEmpanels(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("paged/sow-quote-documents")]
        public async Task<IActionResult> GetSOWQuoteDocsAsync([FromBody] PageDto pageData, int? partnerempanelId)
        {
            var result = await _empanelmentService.GetPagedSOWQuoteDocs(pageData, partnerempanelId);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list/{partnerId}")]
        public async Task<IActionResult> GetEmpanelmentListAsync(int partnerId)
        {
            var result = await _empanelmentService.GetPartnerEmpanels(partnerId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("partner/{partnerId}")]
        public async Task<IActionResult> GetEmpanelmentByPartnerAsync(int partnerId)
        {
            var result = await _empanelmentService.GetPartnerEmpanlByPartnerId(partnerId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmpanelmentAsync(int id)
        {
            var result = await _empanelmentService.GetPartnerEmpanelment(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmpanelment([FromBody] AddPartnerEmpanelDto dto)
        {
            if (dto == null)
                return BadRequest("Empanelment data is null.");

            var result = await _empanelmentService.AddPartnerEmpanel(dto);

            if (result.Status == true)
            {
                return Ok(result);
            }
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmpanelment(int id, [FromBody] AddPartnerEmpanelDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");


            var existingPartner = await _empanelmentService.GetPartnerEmpanlByPartnerId(dto.Id);

            var result = await _empanelmentService.UpdatePartnerEmpanel(dto);
            if (result.Status == true)
            {
                return Ok(result);
            }
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _empanelmentService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}