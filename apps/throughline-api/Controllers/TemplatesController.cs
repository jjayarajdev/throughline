using EpicenterX.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EpicenterX.Controllers
{
    //[Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TemplatesController(ITemplateService _templateService) : ControllerBase
    {
        [HttpGet("candidate/template-download")]
        public async Task<IActionResult> DownloadCandidateExcelTemplate()
        {
            var fileBytes = await _templateService.DownloadCandidateTemplateAsync();
            return File(fileBytes,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "CandidateTemplate.xlsx");
        }

    }
}
