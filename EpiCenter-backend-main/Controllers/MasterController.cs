using EpicenterX.Application.DTOs;
using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    //[Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MasterController(IMasterService _masterService) : ControllerBase
    {
        [HttpPost("paged")]
        public async Task<IActionResult> GetPagedMaster([FromBody] MasterPageDto pageData)
        {
            var result = await _masterService.GetPagedMastersAsync(pageData);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("{type}")]
        public async Task<IActionResult> GetMaster(int type, int countryId, int stateId, string? domainIds, int? partnerId, int? hiringRequestId, int? roundNameId, bool? getVacant, string? roleIds, bool? isActive = true)
        {
            List<int> domains = [];
            List<int> roles = [];
            if (domainIds != null)
                domains = [.. domainIds!.Split(',').Select(int.Parse)];

            if (roleIds != null)
                roles = [.. roleIds!.Split(',').Select(int.Parse)];
            var result = await _masterService.GetMastersAsync(type, countryId, stateId, domains, partnerId, hiringRequestId, roundNameId, getVacant, roles, isActive);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpGet("listByIdList/{type}")]
        public async Task<IActionResult> GetMasterByIds(int type, string? parentIds, bool? isActive)
        {
            List<int> parentIdList = [];
            if (parentIds != null)
                parentIdList = [.. parentIds!.Split(',').Select(int.Parse)];

            var result = await _masterService.GetMasterDataByListIdsAsync(type, parentIdList, isActive);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("sub-domains")]
        public async Task<IActionResult> GetSubDomainsMaster([FromBody] List<int>? domainIds)
        {
            var result = await _masterService.GetSubDomainsMasterAsync(domainIds);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("{type}")]
        public async Task<IActionResult> CreateMaster(int type, [FromBody] MasterDto dto)
        {
            var result = await _masterService.AddMasterAsync(type, dto);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }


        [HttpPut("{type}/{id}")]
        public async Task<IActionResult> UpdateMaster(int type, int id, [FromBody] MasterDto dto)
        {
            if (id != dto.Id)
                return BadRequest("Id Mismatch");
            var result = await _masterService.UpdateMasterAsync(type, dto);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpDelete("{type}/{id}")]
        public async Task<IActionResult> DeleteMaster(int type, int id)
        {
            var result = await _masterService.DeleteMasterAsync(type, id);
            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPatch("{type}/{id}")]
        public async Task<IActionResult> ChangeMasterStatus(int type, int id, bool? isActive)
        {
            var result = await _masterService.ToggleActivationStatusMasterAsync(type, id, isActive);

            if (result.Status == true)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
