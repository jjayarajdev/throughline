using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.PMS.ContactMatrix;
using EpicenterX.Application.DTOs.PMS.SOW;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Application.Services;
using EpicenterX.Domain.Entities.PMS;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SOWController(ISOWService _sowDetailService) : ControllerBase
    {
        [HttpPost("paged/{partnerId}")]
        public async Task<IActionResult> GetPagedSOWDetails(int partnerId, [FromBody] PageDto pageData)
        {
            var result = await _sowDetailService.GetPagedSOWDetails(pageData, partnerId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("list/{partnerId}")]
        public async Task<IActionResult> GetSOWDetailList(int partnerId)
        {
            var result = await _sowDetailService.GetSOWDetails(partnerId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSOWDetail(int id)
        {
            var result = await _sowDetailService.GetSOWDetail(id);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("partner/{partnerId}")]
        public async Task<IActionResult> GetSOWDetailByPartnerId(int partnerId)
        {
            var result = await _sowDetailService.GetSOWDetails(partnerId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSOWDetail([FromBody] AddSOWDto dto)
        {
            if (dto == null)
                return BadRequest("SOW Detail data is null.");

            var result = await _sowDetailService.AddSOWDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSOWDetail(int id, [FromBody] AddSOWDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _sowDetailService.UpdateSOWDetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _sowDetailService.TogglePOStatus(dto.Id, dto.IsActive);
            return result.Status ? Ok(result) : BadRequest(result);
        }


        [HttpPost("paged/category/{categoryId}")]
        public async Task<IActionResult> GetPagedSOWDetailsByCategoryId(int? partnerId, int categoryId, [FromBody] PageDto pageData)
        {
            var result = await _sowDetailService.GetPagedSOWDetailsByCategoryId(pageData, partnerId, categoryId);
            return result.Status ? Ok(result) : BadRequest(result);
        }








        [HttpPost("paged/poDetails/{sowId}")]
        public async Task<IActionResult> GetPagedPODetails(int sowId, [FromBody] PageDto pageData)
        {
            var result = await _sowDetailService.GetPagedPODetails(pageData, sowId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("list/poDetails/{sowId}")]
        public async Task<IActionResult> GetPODetailList(int sowId)
        {
            var result = await _sowDetailService.GetPODetails(sowId);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpGet("poDetails/{id}")]
        public async Task<IActionResult> GetPODetail(int id)
        {
            var result = await _sowDetailService.GetPODetail(id);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPost("poDetails")]
        public async Task<IActionResult> CreatePODetail([FromBody] AddPODetailDto dto)
        {
            if (dto == null)
                return BadRequest("PO Detail data is null.");

            var result = await _sowDetailService.AddPODetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPut("poDetails/{id}")]
        public async Task<IActionResult> UpdatePODetail(int id, [FromBody] AddPODetailDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _sowDetailService.UpdatePODetail(dto);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPatch("poDetails/toggle")]
        public async Task<IActionResult> TogglePOStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _sowDetailService.TogglePOStatus(dto.Id, dto.IsActive);
            return result.Status ? Ok(result) : BadRequest(result);
        }

        [HttpPatch("approval")]
        public async Task<IActionResult> ApprovalStatus([FromBody] UpdateSOWMatrixDto dto)
        {
            var result = await _sowDetailService.UpdateSOWMatrixStatus(dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
