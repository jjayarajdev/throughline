namespace EpicenterX.Application.Interfaces.Services
{
    public interface ITemplateService
    {
        Task<byte[]> DownloadCandidateTemplateAsync();
    }
}
