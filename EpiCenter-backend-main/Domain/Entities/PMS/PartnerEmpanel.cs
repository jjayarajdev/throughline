using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Domain.Entities.PMS
{
    public class PartnerEmpanel : BaseIdentifier
    {
        public bool IsEmpaneledPartner { get; set; } // Yes/No
        public DateTime? EmpanelmentStartDate { get; set; } // If IsEmpaneledPartner == true
        public bool? IsThisGPApproved { get; set; }
        public int? AgreementTypeId { get; set; } // If IsEmpaneledPartner == true
        public M_MasterData? AgreementType { get; set; }
        public string? ContractId { get; set; } // If IsEmpaneledPartner == true
        public string? GPId { get; set; } // If IsEmpaneledPartner == true
        public DateTime? SOWSigningDate { get; set; } // If IsEmpaneledPartner == true
        public DateTime? GPApprovalDate { get; set; } // If IsEmpaneledPartner == true
        public List<DocumentDetails>? SOWQuoteDocuments { get; set; } // If IsEmpaneledPartner == true
        public string? EmpanelmentComments { get; set; }// If IsEmpaneledPartner == true
        public string? PANID { get; set; } // If IsEmpaneledPartner == true
        public string? GSTID { get; set; } // If IsEmpaneledPartner == true
        public string? TANID { get; set; } // If IsEmpaneledPartner == true


        public bool IsExtendEvaluation { get; set; } // If IsEmpaneledPartner == false // Yes/No

        public DateTime? EvaluationExtendedDate { get; set; } // if IsExtendEvaluation == true

        public int? RejectionReasonId { get; set; } // if IsExtendEvaluation == false
        public M_MasterData? RejectionReasonType { get; set; }
        public string? RejectionReason { get; set; } // if IsExtendEvaluation == false

        public int? PartnerId { get; set; }
    }
}
