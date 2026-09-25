using EpicenterX.Application.DTOs.PMS.PartnerProfile;

namespace EpicenterX.Application.DTOs.PMS.PartnerOverview
{
    public class PartnerProfileDto
    {
        public int TotalProfileSubmitted { get; set; }
        public int TotalClosures { get; set; }

        public double ConversionRate =>
            TotalProfileSubmitted == 0
                ? 0
                : Math.Round((double)TotalClosures / TotalProfileSubmitted, 2);

        // This is a relative rank (to be assigned externally)
        public int Rank { get; set; }

        // This is the score used to compute ranking
        public double Score =>
            5 * TotalClosures +
            2 * Math.Log(TotalProfileSubmitted == 0 ? 1 : TotalProfileSubmitted) +
            1 * (TotalProfileSubmitted == 0 ? 0 : (double)TotalClosures / TotalProfileSubmitted);

        public GetPartnerDto? PartnerDetails { get; set; }
        public List<DocumentDetailDto>? PartnerDocuments { get; set; }
    }

}
