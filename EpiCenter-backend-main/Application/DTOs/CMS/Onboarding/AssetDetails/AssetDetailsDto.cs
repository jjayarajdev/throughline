namespace EpicenterX.Application.DTOs.CMS.Onboarding.AssetDetails
{
    public class AddAssetDetailsDto : BaseIdentifierDto
    {
        public bool? IsJoinConfirmed { get; set; }
        public bool? IsPCAllocated { get; set; }
        public DateTime? PCRequestCreatedDate { get; set; }
        public string? PCRequestRefNo { get; set; }
        public string? PCSerialNo { get; set; }
        public DateTime? PCAllocationDate { get; set; }
        public int? ModeOfPcShipmentId { get; set; }
        public DateTime? PCReceivedOn { get; set; }
        public DateTime? PCConfigurationDate { get; set; }
        public int? ITAssetStatusID { get; set; }
        public int? ComplianceFollowedId { get; set; }
        public int? DelayCategoryId { get; set; }
        public string? Comments { get; set; }

        public int CandidatePersonalDetailsId { get; set; }
    }


    public class GetAssetDetailsDto : BaseIdentifierDto
    {
        public bool? IsJoinConfirmed { get; set; }
        public bool? IsPCAllocated { get; set; }
        public DateTime? PCRequestCreatedDate { get; set; }
        public string? PCRequestRefNo { get; set; }
        public string? PCSerialNo { get; set; }
        public DateTime? PCAllocationDate { get; set; }
        public int? ModeOfPcShipmentId { get; set; }
        public string? ModeOfPcShipmentName { get; set; }
        public DateTime? PCReceivedOn { get; set; }
        public DateTime? PCConfigurationDate { get; set; }

        public int? ITAssetStatusID { get; set; }
        public string? ITAssetStatusName { get; set; }
        public int? ComplianceFollowedId { get; set; }
        public string? ComplianceFollowedName { get; set; }
        public int? DelayCategoryId { get; set; }
        public string? DelayCategoryName { get; set; }
        public string? Comments { get; set; }

        public int CandidatePersonalDetailsId { get; set; }
    }
}
