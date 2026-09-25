using EpicenterX.Application.DTOs.CMS.Candidate;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Shared;
using EpicenterX.Domain.Shared.HelperClasses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;

namespace EpicenterX.Infrastructure.Persistence
{
    public class AppDBContext(DbContextOptions<AppDBContext> options, IHttpContextAccessor _httpContextAccessor) : DbContext(options)
    {

        public DbSet<Users> Users { get; set; }
        public DbSet<M_Module> Modules { get; set; }
        public DbSet<M_Form> Forms { get; set; }
        public DbSet<M_RoleFormAccess> RoleFormAccess { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRolesMapping { get; set; } // YES: define this!
        public DbSet<EmailNotifications> EmailNotifications { get; set; }
        public DbSet<M_SearchColumn> M_SearchColumn { get; set; }
        public DbSet<DocumentDetails> DocumentDetails { get; set; }
        public DbSet<JoiningRescheduleHistory> JoiningRescheduleHistory { get; set; }
        public DbSet<QuarterDateRange> QuarterDateRanges { get; set; }

        #region Masters

        public DbSet<M_Country> M_Countries { get; set; }
        public DbSet<M_JobLevel> M_JobLevel { get; set; }
        public DbSet<M_State> M_States { get; set; }
        public DbSet<M_City> M_Cities { get; set; }
        public DbSet<M_MasterData> M_MasterData { get; set; }
        public DbSet<M_Domain> M_Domains { get; set; }
        public DbSet<M_SubDomain> M_SubDomains { get; set; }
        public DbSet<M_Skill> M_Skills { get; set; }
        public DbSet<M_Configuration> M_Configuration { get; set; }

        #endregion Masters

        #region CMS

        public DbSet<CandidateBgvDetails> CandidateBgvDetails { get; set; }

        public DbSet<CandidatePersonalDetails> CandidatePersonalDetails { get; set; }
        public DbSet<ProfileTracker> ProfileTracker { get; set; }
        public DbSet<AssetDetails> AssetDetails { get; set; }
        public DbSet<TrainingDetails> TrainingDetails { get; set; }


        public DbSet<CandidateBin> CandidateBin { get; set; }
        public DbSet<CandidateBinHistory> CandidateBinHistory { get; set; }
        public DbSet<Candidate> CandidateForms { get; set; }
        public DbSet<CandidateHistory> CandidateFormHistory { get; set; }
        public DbSet<InterviewSlot> InterviewSlotAllocation { get; set; }
        public DbSet<CandidateInterviewFeedBack> CandidateInterviewFeedBack { get; set; }

        public DbSet<InterviewSlotAllocationHistory> InterviewSlotAllocationHistory { get; set; }
        public DbSet<InterviewActionLog> InterviewActionLog { get; set; }
        public DbSet<CandidateRateCard> CandidateRateCard { get; set; }

        public DbSet<CandidateBulkUpload> CandidateUploadResults { get; set; }
        public DbSet<MarkDuplicateCandidate> DuplicateCheckResult { get; set; }
        public DbSet<CandidateResult> CandidateResult { get; set; }
        public DbSet<GetExportCandidate> GetExportCandidate { get; set; }

        public DbSet<GetExportFeedbackCandidate> GetExportFeedbackCandidate { get; set; }
        public DbSet<GetExportCandidateInterviewDetails> GetExportCandidateInterviewDetails { get; set; }
        public DbSet<CandidateReconsiderationHistory> CandidateReconsiderationHistory { get; set; }

        #endregion CMS

        #region HMS

        public DbSet<RCMSDetails> RCMSDetails { get; set; }
        public DbSet<HiringRequest> Hiring { get; set; }
        public DbSet<InterviewRound> InterviewRounds { get; set; }
        public DbSet<JobDetails> JobDetails { get; set; }
        public DbSet<Calibration> Calibrations { get; set; }
        public DbSet<PartnerCategory> PartnerCategories { get; set; }
        public DbSet<Feedback> Feedback { get; set; }
        public DbSet<FeedbackCritriaOptions> FeedbackCritriaOptions { get; set; }

        public DbSet<PartnerHrqsGrid> PartnerHRQDetails { get; set; }
        public DbSet<HiringReqPartner> HiringReqPartner { get; set; }
        public DbSet<OnholdHiringRequest> OnholdHiringRequest { get; set; }

        #endregion HMS

        #region PMS

        public DbSet<Partner> Partners { get; set; }
        public DbSet<ContactMatrix> ContactMatrices { get; set; }
        public DbSet<EscalationMatrix> EscalationMatrices { get; set; }
        public DbSet<Engagement> Engagements { get; set; }
        public DbSet<EngagementHistory> EngagementHistory { get; set; }
        public DbSet<PartnerEmpanel> PartnerEmpanel { get; set; }
        public DbSet<SOW> SOWDetails { get; set; }
        public DbSet<SOW_CR> SOWCRS { get; set; }
        public DbSet<SOWHistory> SOWDetailHistory { get; set; }
        public DbSet<PODetail> SOWPODetail { get; set; }
        public DbSet<PO_CR> POCRS { get; set; }
        public DbSet<PODetailHistory> SOWPODetailHistory { get; set; }
        public DbSet<PartnerApprovalHistory> PartnerApprovalHistory { get; set; }

        #endregion PMS

        #region Utilities

        public DbSet<EmailTemplate> EmailTemplates { get; set; }
        public DbSet<Notifications> Notifications { get; set; }

        #endregion


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.HasDefaultSchema("throughline");

            #region Masters

            modelBuilder.Entity<M_RoleFormAccess>()
            .HasKey(rfa => new { rfa.RoleId, rfa.FormId });

            modelBuilder.Entity<M_RoleFormAccess>()
                .HasOne(rfa => rfa.Role)
                .WithMany(r => r.RoleFormAccesses)
                .HasForeignKey(rfa => rfa.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<M_RoleFormAccess>()
                .HasOne(rfa => rfa.Form)
                .WithMany(f => f.RoleFormAccesses)
                .HasForeignKey(rfa => rfa.FormId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserRole>()
            .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);

            modelBuilder.Entity<M_MasterData>()
            .Property(e => e.Id)
            .ValueGeneratedNever();

            modelBuilder.Entity<M_City>()
                .HasKey(a => a.Id);

            modelBuilder.Entity<M_City>()
            .Property(a => a.Name)
            .HasColumnType("varchar(100)");

            modelBuilder.Entity<M_City>()
            .HasIndex(a => a.Name)
            .IsUnique();

            modelBuilder.Entity<M_Country>()
               .HasKey(a => a.Id);

            modelBuilder.Entity<M_Country>()
            .Property(a => a.Name)
            .HasColumnType("varchar(100)");

            modelBuilder.Entity<M_Country>()
            .HasIndex(a => a.Name)
            .IsUnique();

            modelBuilder.Entity<M_Domain>()
              .HasKey(a => a.Id);

            modelBuilder.Entity<M_Domain>()
            .Property(a => a.Name)
            .HasColumnType("varchar(100)");

            modelBuilder.Entity<M_Domain>()
            .HasIndex(a => a.Name)
            .IsUnique();

            modelBuilder.Entity<M_Skill>()
            .HasKey(a => a.Id);

            modelBuilder.Entity<M_Skill>()
            .Property(a => a.Name)
            .HasColumnType("varchar(100)");

            modelBuilder.Entity<M_SubDomain>()
            .HasIndex(a => new { a.Name, a.DomainId })
            .IsUnique();

            modelBuilder.Entity<M_State>()
           .HasKey(a => a.Id);

            modelBuilder.Entity<M_State>()
            .Property(a => a.Name)
            .HasColumnType("varchar(100)");

            modelBuilder.Entity<M_State>()
            .HasIndex(a => a.Name)
            .IsUnique();

            modelBuilder.Entity<M_State>()
           .Property(a => a.CountryId)
           .HasColumnType("int");

            modelBuilder.Entity<M_SubDomain>()
            .HasKey(a => a.Id);

            modelBuilder.Entity<M_SubDomain>()
            .Property(a => a.Name)
            .HasColumnType("varchar(100)");

            modelBuilder.Entity<M_SubDomain>()
            .HasIndex(a => a.Name); // not unique: legacy data repeats sub-domain names across domains (see V3 migration)

            modelBuilder.Entity<M_State>()
            .HasOne(state => state.Country)
            .WithMany(country => country.States)
            .HasForeignKey(state => state.CountryId)
            .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<M_City>()
           .HasOne(state => state.State)
           .WithMany(country => country.Cities)
           .HasForeignKey(state => state.StateId)
           .OnDelete(DeleteBehavior.Restrict);

            #endregion Masers

            #region Candidate Onboarding

            modelBuilder.Entity<CandidatePersonalDetails>()
                .HasOne(c => c.ProfileTracker)
                .WithOne()
                .HasForeignKey<ProfileTracker>(p => p.CandidatePersonalDetailsId);

            modelBuilder.Entity<CandidatePersonalDetails>()
                .HasOne(c => c.AssetDetails)
                .WithOne()
                .HasForeignKey<AssetDetails>(a => a.CandidatePersonalDetailsId);

            modelBuilder.Entity<CandidatePersonalDetails>()
                .HasOne(c => c.TrainingDetails)
                .WithOne()
                .HasForeignKey<TrainingDetails>(t => t.CandidatePersonalDetailsId);

            modelBuilder.Entity<CandidatePersonalDetails>()
             .HasOne(a => a.Country)
             .WithMany()
             .HasForeignKey(a => a.CountryId);

            modelBuilder.Entity<CandidatePersonalDetails>()
            .HasOne(a => a.State)
            .WithMany()
            .HasForeignKey(a => a.StateId);

            modelBuilder.Entity<CandidatePersonalDetails>()
            .HasOne(a => a.City)
            .WithMany()
            .HasForeignKey(a => a.CityId);

            modelBuilder.Entity<CandidatePersonalDetails>()
            .HasOne(a => a.Domain)
            .WithMany()
            .HasForeignKey(a => a.DomainId);

            modelBuilder.Entity<CandidatePersonalDetails>()
            .HasOne(a => a.SubDomain)
            .WithMany()
            .HasForeignKey(a => a.SubDomainId);

            modelBuilder.Entity<ProfileTracker>()
                .HasOne(p => p.CostCenter)
                .WithMany()
                .HasForeignKey(p => p.CostCenterId);

            modelBuilder.Entity<AssetDetails>()
                .HasOne(a => a.ModeOfPcShipment)
                .WithMany()
                .HasForeignKey(a => a.ModeOfPcShipmentId);

            modelBuilder.Entity<AssetDetails>()
                .HasOne(a => a.ITAssetStatus)
                .WithMany()
                .HasForeignKey(a => a.ITAssetStatusID);

            modelBuilder.Entity<AssetDetails>()
                .HasOne(a => a.ComplianceFollowed)
                .WithMany()
                .HasForeignKey(a => a.ComplianceFollowedId);


            modelBuilder.Entity<TrainingDetails>()
                .HasOne(t => t.OrientationStatus)
                .WithMany()
                .HasForeignKey(t => t.OrientationStatusId);

            modelBuilder.Entity<TrainingDetails>()
               .HasOne(t => t.SessionTakenByManager)
               .WithMany()
               .HasForeignKey(t => t.SessionTakenByManagerId);

            modelBuilder.Entity<TrainingDetails>()
                .HasOne(t => t.ResumeUploaded)
                .WithMany()
                .HasForeignKey(t => t.ResumeUploadId);

            modelBuilder.Entity<CandidateBgvDetails>()
             .HasOne(b => b.CDAAvailabilityDoc)
             .WithMany()
             .HasForeignKey(b => b.CDAAvailabilityDocId);

            modelBuilder.Entity<CandidateBgvDetails>()
                .HasOne(b => b.NDAAvailabilityDoc)
                .WithMany()
                .HasForeignKey(b => b.NDAAvailabilityDocId);


            modelBuilder.Entity<CandidateBgvDetails>()
               .HasMany(p => p.UploadBGVDocs)
               .WithOne()
               .HasForeignKey(d => d.UploadBGVDocId)
               .IsRequired(false)
               .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CandidateBgvDetails>()
               .HasMany(b => b.AdditionalDocs)
               .WithOne()
               .HasForeignKey(b => b.AdditionalDocId)
               .IsRequired(false)
               .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CandidateBgvDetails>()
               .HasOne(b => b.Vendor)
               .WithMany()
               .HasForeignKey(b => b.VendorId);

            #endregion

            #region CMS

            modelBuilder.Entity<CandidateBulkUpload>().HasNoKey();
            modelBuilder.Entity<MarkDuplicateCandidate>(entity =>
            {
                entity.HasNoKey();
                entity.ToView(null);
            });
            modelBuilder.Entity<CandidateResult>(entity =>
            {
                entity.HasNoKey();
                entity.ToView(null);
            });


            modelBuilder.Entity<CandidateBin>()
                        .Property(e => e.PrimarySkillIds)
                        .HasConversion(
                            v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                            v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null)
                        );

            modelBuilder.Entity<CandidateBin>()
                       .Property(e => e.SecondarySkillIds)
                       .HasConversion(
                           v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                           v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null)
                       );

            modelBuilder.Entity<CandidateBin>()
                      .Property(e => e.PreferredWorkLocationIds)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                          v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null)
                      );

            modelBuilder.Entity<CandidateBinHistory>()
                       .Property(e => e.PrimarySkillIds)
                       .HasConversion(
                           v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                           v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null)
                       );

            modelBuilder.Entity<CandidateBinHistory>()
                       .Property(e => e.SecondarySkillIds)
                       .HasConversion(
                           v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                           v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null)
                       );

            modelBuilder.Entity<CandidateBinHistory>()
                      .Property(e => e.PreferredWorkLocationIds)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                          v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null)
                      );

            modelBuilder.Entity<GetExportCandidate>(entity =>
            {
                entity.HasNoKey();
                entity.ToView(null);
            });

            modelBuilder.Entity<GetExportFeedbackCandidate>(entity =>
            {
                entity.HasNoKey();
                entity.ToView(null);
            });

            modelBuilder.Entity<GetExportCandidateInterviewDetails>(entity =>
            {
                entity.HasNoKey();
                entity.ToView(null);
            });


            modelBuilder.Entity<Candidate>()
                .Property(a => a.CandidateCode)
                .HasComputedColumnSql("'CA' || ((\"Id\" - 1) / 999 + 1)::text || lpad(((\"Id\" - 1) % 999 + 1)::text, 3, '0')", stored: true)
                .IsRequired();

            modelBuilder.Entity<Candidate>()
                .HasOne(cf => cf.HiringRequest)
                .WithMany()
                .HasForeignKey(cf => cf.HiringRequestId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CandidatePersonalDetails>()
                .HasOne(cf => cf.Candidate)
                .WithOne()
                .HasForeignKey<CandidatePersonalDetails>(x => x.CandidateId);


            modelBuilder.Entity<Candidate>()
               .HasOne(b => b.Resume)
               .WithMany()
               .HasForeignKey(b => b.ResumeId)
               .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Candidate>()
              .HasOne(b => b.Approver)
              .WithMany()
              .HasForeignKey(b => b.ApprovedBy)
              .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Candidate>()
             .HasOne(b => b.PreviousIntakeStatus)
             .WithMany()
             .HasForeignKey(b => b.PreviousIntakeStatusId)
             .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<CandidateHistory>()
            .HasOne(b => b.Approver)
            .WithMany()
            .HasForeignKey(b => b.ApprovedBy)
            .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Candidate>()
                .HasMany(candidate => candidate.InterviewSlots)
                .WithOne(slot => slot.Candidate)
                .HasForeignKey(slot => slot.CandidateId)
                .OnDelete(DeleteBehavior.SetNull); // Optional: FK is set null on delete

            modelBuilder.Entity<InterviewSlot>()
                .HasOne(slot => slot.Candidate)
                .WithMany(candidate => candidate.InterviewSlots)
                .HasForeignKey(slot => slot.CandidateId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<InterviewSlot>()
              .HasOne(slot => slot.Partner)
              .WithMany()
              .HasForeignKey(slot => slot.PartnerId)
              .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<InterviewSlot>()
             .HasOne(slot => slot.FeedbackGivenByUser)
             .WithMany()
             .HasForeignKey(slot => slot.FeedbackGivenByUserId)
             .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<InterviewSlot>()
                 .HasMany(b => b.CandidateRating)
                 .WithOne()
                 .HasForeignKey(b => b.InterviewSlotId)
                 .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<InterviewSlot>()
                    .HasOne(b => b.CandidateInterviewStatus)
                    .WithMany()
                    .HasForeignKey(b => b.CandidateInterviewStatusId)
                    .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<CandidateRateCard>()
               .HasIndex(pc => pc.CandidateId)
               .IsUnique();

            modelBuilder.Entity<JoiningRescheduleHistory>()
               .HasOne(a => a.ModifiedbyUser)
               .WithMany()
               .HasForeignKey(a => a.Modifiedby);

            #endregion CMS

            #region HMS

            modelBuilder.Entity<PartnerHrqsGrid>().HasNoKey();
            // InterviewSlotAllocationHistory is a real table with an identity Id (and CandidateInterviewFeedBack
            // references it via InterviewSlotAllocationHistoryId). It was mapped HasNoKey(), which made every
            // AddAsync on it throw "Unable to track an instance of type 'InterviewSlotAllocationHistory'".
            modelBuilder.Entity<InterviewSlotAllocationHistory>(entity =>
            {
                entity.HasKey(h => h.Id);
                entity.Property(h => h.Id).ValueGeneratedOnAdd();
                entity.HasMany(h => h.CandidateRating)
                      .WithOne()
                      .HasForeignKey("InterviewSlotAllocationHistoryId")
                      .OnDelete(DeleteBehavior.ClientSetNull);
            });

            modelBuilder.Entity<HiringRequest>()
               .Property(a => a.HrqId)
               .HasComputedColumnSql("'HRQ' || ((\"Id\" - 1) / 999 + 1)::text || lpad(((\"Id\" - 1) % 999 + 1)::text, 3, '0')", stored: true)
               .IsRequired();

            modelBuilder.Entity<HiringRequest>()
                .Property(a => a.HrqIdURL)
                .HasComputedColumnSql("'home/hiring-manage/hiring-details/HRQ' || ((\"Id\" - 1) / 999 + 1)::text || lpad(((\"Id\" - 1) % 999 + 1)::text, 3, '0')", stored: true)
                .IsRequired();

            modelBuilder.Entity<HiringRequest>()
             .HasOne(b => b.PreviousHiringStatus)
             .WithMany()
             .HasForeignKey(b => b.PreviousHiringStatusId)
             .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<FeedbackCritriaOptions>()
              .HasOne(b => b.CriteriaOption)
              .WithMany()
              .HasForeignKey(b => b.CriteriaOptionId)
              .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<InterviewRound>()
               .HasMany(p => p.FeedbackCritriaOptions)
               .WithOne()
               .HasForeignKey(d => d.InterviewRoundId)
               .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<PartnerCategory>()
                    .HasOne(pc => pc.HiringRequest)
                    .WithOne(h => h.PartnerCategory)
                    .HasForeignKey<PartnerCategory>(pc => pc.HiringRequestId);

            modelBuilder.Entity<PartnerCategory>()
         .HasMany(pc => pc.SelectedPartners)
         .WithOne()
         .HasForeignKey(sp => sp.PartnerCategoryId) 
         .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PartnerCategory>()
                .HasIndex(pc => pc.HiringRequestId)
                .IsUnique();

            modelBuilder.Entity<HiringReqPartner>()
                        .Property(p => p.Id)
                        .ValueGeneratedOnAdd();

            modelBuilder.Entity<HiringRequest>()
                .HasOne(b => b.RecordType)
                .WithMany()
                .HasForeignKey(b => b.RecordTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
               .HasOne(b => b.HiringManager)
               .WithMany()
               .HasForeignKey(b => b.HiringMangerId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
                .HasOne(b => b.HiringManager)
                .WithMany()
                .HasForeignKey(b => b.HiringMangerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
                .HasOne(b => b.OnholdRequestedByRole)
                .WithMany()
                .HasForeignKey(b => b.OnholdRequestedBy)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
               .HasOne(b => b.OnholdRaisedByUser)
               .WithMany()
               .HasForeignKey(b => b.OnholdRaisedBy)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
               .HasOne(b => b.OnholdReason)
               .WithMany()
               .HasForeignKey(b => b.OnholdReasonId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
                .HasOne(b => b.OnholdReviewedByUser)
                .WithMany()
                .HasForeignKey(b => b.OnholdReviewedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
                .HasOne(b => b.OnHoldReviewStatus)
                .WithMany()
                .HasForeignKey(b => b.OnHoldReviewStatusId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
                .HasOne(b => b.Business)
                .WithMany()
                .HasForeignKey(b => b.BusinessId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
               .HasOne(b => b.HiringType)
               .WithMany()
               .HasForeignKey(b => b.HiringTypeId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
               .HasOne(b => b.HiringStatus)
               .WithMany()
               .HasForeignKey(b => b.HiringStatusId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<OnholdHiringRequest>()
              .HasOne(b => b.HiringRequest)
              .WithMany()
              .HasForeignKey(b => b.HiringRequestId)
              .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<HiringRequest>()
                .HasOne(b => b.RMOwner)
                .WithMany()
                .HasForeignKey(b => b.RmOwnerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<JobDetails>()
               .HasOne(b => b.HiringActivity)
               .WithMany()
               .HasForeignKey(b => b.HiringActivityId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<JobDetails>()
                .HasOne(b => b.JobPriority)
                .WithMany()
                .HasForeignKey(b => b.JobPriorityId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<JobDetails>()
                .HasOne(b => b.JobLevel)
                .WithMany()
                .HasForeignKey(b => b.JobLevelId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<JobDetails>()
                .HasOne(b => b.ResourceType)
                .WithMany()
                .HasForeignKey(b => b.ResourceTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<JobDetails>()
                .HasOne(b => b.Country)
                .WithMany()
                .HasForeignKey(b => b.CountryId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<JobDetails>()
               .HasOne(b => b.SubDomain)
               .WithMany()
               .HasForeignKey(b => b.SubDomainId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<InterviewRound>()
                .HasOne(b => b.InterviewMode)
                .WithMany()
                .HasForeignKey(b => b.ModeOfInterview)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<InterviewRound>()
                .HasOne(b => b.RoundName)
                .WithMany()
                .HasForeignKey(b => b.RoundNameId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CandidateRateCard>()
               .HasOne(b => b.Category)
               .WithMany()
               .HasForeignKey(b => b.CategoryId)
               .OnDelete(DeleteBehavior.NoAction);

            #endregion HMS

            #region PMS

            modelBuilder.Entity<Partner>()
               .Property(a => a.PartnerCode)
               .HasComputedColumnSql("'PID' || ((\"Id\" - 1) / 999 + 1)::text || lpad(((\"Id\" - 1) % 999 + 1)::text, 3, '0')", stored: true)
               .IsRequired();

            modelBuilder.Entity<Partner>()
               .Property(a => a.PartnerProfileURL)
               .HasComputedColumnSql("'home/partner-onboarding/partner-profile/PID' || ((\"Id\" - 1) / 999 + 1)::text || lpad(((\"Id\" - 1) % 999 + 1)::text, 3, '0')", stored: true)
               .IsRequired();

            modelBuilder.Entity<Partner>()
                .HasIndex(a => a.PartnerName)
                .IsUnique();
            
            modelBuilder.Entity<Partner>()
                .HasOne(b => b.Country)
                .WithMany()
                .HasForeignKey(b => b.CountryId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Partner>()
              .HasOne(t => t.LastReinitiatedByUser)
              .WithMany()
              .HasForeignKey(t => t.LastReinitiatedBy);

            modelBuilder.Entity<Partner>()
              .HasOne(b => b.Approver)
              .WithMany()
              .HasForeignKey(b => b.ApprovedBy)
              .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Partner>()
                .HasOne(b => b.State)
                .WithMany()
                .HasForeignKey(b => b.StateId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Partner>()
               .HasOne(b => b.City)
               .WithMany()
               .HasForeignKey(b => b.CityId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Partner>()
             .HasOne(b => b.ServicingCountry)
             .WithMany()
             .HasForeignKey(b => b.ServicingCountryId)
             .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Partner>()
                .HasMany(b => b.ContactMatrices)
                .WithOne(e => e.Partner)
                .HasForeignKey(b => b.PartnerId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Partner>()
                .HasMany(b => b.PartnerApprovalHistory)
                .WithOne(e => e.Partner)
                .HasForeignKey(b => b.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Partner>()
               .HasMany(b => b.EscalationMatrices)
               .WithOne(e => e.Partner)
               .HasForeignKey(b => b.PartnerId)
               .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Partner>()
                .HasMany(p => p.Engagements)
                .WithOne(e => e.Partner)
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<SOW>()
               .HasMany(b => b.PODetails)
               .WithOne(e => e.Sow)
               .HasForeignKey(b => b.SowId)
               .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<PODetail>()
               .HasMany(b => b.PO_CRs)
               .WithOne()
               .HasForeignKey(b => b.POId)
               .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Partner>()
               .HasMany(b => b.SOWs)
               .WithOne(e => e.Partner)
               .HasForeignKey(b => b.PartnerId)
               .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Partner>()
            .HasMany(p => p.CapabilitiesDeckDocuments)
            .WithOne()
            .HasForeignKey(d => d.PartnerId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ContactMatrix>()
                .HasOne(b => b.ContactMatrixType)
                .WithMany()
                .HasForeignKey(b => b.ContactMatrixTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ContactMatrix>()
                .HasOne(b => b.Country)
                .WithMany()
                .HasForeignKey(b => b.CountryId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ContactMatrix>()
               .HasOne(b => b.Status)
               .WithMany()
               .HasForeignKey(b => b.StatusId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<EngagementHistory>()
              .HasOne(b => b.CreatedUser)
              .WithMany()
              .HasForeignKey(b => b.CreatedBy)
              .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Engagement>()
               .HasOne(b => b.EngagementStatus)
               .WithMany()
               .HasForeignKey(b => b.EngagementStatusId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Engagement>()
                .HasOne(b => b.EngagementType)
                .WithMany()
                .HasForeignKey(b => b.EngagementTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Engagement>()
                .HasOne(b => b.BusinessUnit)
                .WithMany()
                .HasForeignKey(b => b.BusinessId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Engagement>()
                .HasOne(b => b.EvaluationStatus)
                .WithMany()
                .HasForeignKey(b => b.EvaluationStatusId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PartnerEmpanel>()
               .HasOne(b => b.AgreementType)
               .WithMany()
               .HasForeignKey(b => b.AgreementTypeId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PartnerEmpanel>()
               .HasOne(b => b.RejectionReasonType)
               .WithMany()
               .HasForeignKey(b => b.RejectionReasonId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PartnerEmpanel>()
                .HasMany(p => p.SOWQuoteDocuments)
                .WithOne()
                .HasForeignKey(d => d.PartnerEmpanelId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EscalationMatrix>()
               .HasOne(b => b.Country)
               .WithMany()
               .HasForeignKey(b => b.CountryId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<EscalationMatrix>()
               .HasOne(b => b.EscalationMatrixType)
               .WithMany()
               .HasForeignKey(b => b.ContactTypeId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<EscalationMatrix>()
               .HasOne(b => b.Status)
               .WithMany()
               .HasForeignKey(b => b.StatusId)
               .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<SOW>()
           .HasIndex(a => a.SOWNumber)
           .IsUnique();

            modelBuilder.Entity<SOW>()
             .Property(e => e.TCValue)
             .HasColumnType("decimal(15,2)");

            modelBuilder.Entity<SOWHistory>()
             .Property(e => e.TCValue)
             .HasColumnType("decimal(15,2)");

            modelBuilder.Entity<PODetail>()
           .HasIndex(a => a.PONumber)
           .IsUnique();

            modelBuilder.Entity<SOW_CR>()
                .Property(e => e.CRValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PODetail>()
                .Property(e => e.Threshold)
                .HasColumnType("decimal(5,2)");

            modelBuilder.Entity<PODetail>()
              .Property(e => e.POValue)
              .HasColumnType("decimal(15,2)");

            modelBuilder.Entity<PO_CR>()
                .Property(e => e.CRValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PODetailHistory>()
               .Property(e => e.Threshold)
               .HasColumnType("decimal(5,2)");

            modelBuilder.Entity<PODetailHistory>()
              .Property(e => e.POValue)
              .HasColumnType("decimal(15,2)");

            modelBuilder.Entity<EmailTemplate>();
            #endregion PMS

        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Modified || e.State == EntityState.Added);

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
                {
                    SetForeignKeyZeroToNull(entry);
                }

                if (entry.State == EntityState.Modified)
                {
                    if (entry.Entity is BaseIdentifier auditable)
                    {
                        auditable.UpdatedAt = DateTime.UtcNow;
                        auditable.UpdatedBy = GetLoggedInUserIdAsync();
                    }
                }
                else if (entry.State == EntityState.Added)
                {
                    if (entry.Entity is BaseIdentifier auditable)
                    {
                        auditable.CreatedAt = DateTime.UtcNow;
                        auditable.CreatedBy = GetLoggedInUserIdAsync();
                    }
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }


        private void SetForeignKeyZeroToNull(EntityEntry entry)
        {
            foreach (var property in entry.Properties)
            {
                var propertyInfo = property.Metadata.PropertyInfo;
                
                if (propertyInfo != null && IsNullableInt(propertyInfo) && IsPotentialForeignKey(propertyInfo.Name))
                {
                    if (property.CurrentValue is int intValue && intValue == 0)
                    {
                        property.CurrentValue = null;
                    }
                }
            }
        }

        private bool IsNullableInt(PropertyInfo propertyInfo)
        {
            return Nullable.GetUnderlyingType(propertyInfo.PropertyType) == typeof(int);
        }

        private bool IsPotentialForeignKey(string propertyName)
        {
            return propertyName.EndsWith("ID", StringComparison.OrdinalIgnoreCase);
        }

        private int? GetLoggedInUserIdAsync()
        {
            var email = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);

            if (email != null)
            {
                var user = this.Users.Where(x => x.Email == email).FirstOrDefault();
                return user.UserId;
            }
            return null;
        }
    }
}
