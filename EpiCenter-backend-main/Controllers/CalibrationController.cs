using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.HMS.Calibration;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CalibrationController(ICalibrationService _calibrationService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetCalibrationsAsync([FromBody] PageDto pageData)
        {
            var result = await _calibrationService.GetPagedCalibrations(pageData);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("list/{hiringRequestId}")]
        public async Task<IActionResult> GetCalibrationListAsync(int hiringRequestId)
        {
            var result = await _calibrationService.GetCalibrations(hiringRequestId);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCalibrationAsync(int id)
        {
            var result = await _calibrationService.GetCalibration(id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCalibration([FromBody] AddCalibrationDto dto)
        {
            if (dto == null)
                return BadRequest("Calibration data is null.");

            var result = await _calibrationService.AddCalibration(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCalibration(int id, [FromBody] AddCalibrationDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch.");

            var result = await _calibrationService.UpdateCalibration(dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("toggle")]
        public async Task<IActionResult> ToggleStatus([FromBody] BaseIdentifierDto dto)
        {
            var result = await _calibrationService.ToggleStatus(dto.Id, dto.IsActive);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
