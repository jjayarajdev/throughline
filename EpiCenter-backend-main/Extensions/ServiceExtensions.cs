using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Application.Mappings;
using EpicenterX.Application.Services;
using EpicenterX.BackgroundServices;
using EpicenterX.Domain.Entities;
using EpicenterX.Domain.Entities.CMS;
using EpicenterX.Domain.Entities.HMS;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Entities.PMS;
using EpicenterX.Domain.Shared;
using EpicenterX.Domain.Shared.HelperClasses;
using EpicenterX.Infrastructure.Repositories;
using Serilog;

namespace EpicenterX.Extensions
{

    public static class ServiceExtensions
    {
        private static IConfiguration? _configuration;

        // Method to initialize the static class with configuration
        public static void Initialize(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public static void AddServices(this IServiceCollection services)
        {


            #region //////<<<<<<<<< Serilog Configuration >>>>>>>>>//////
            var logDirConfig = _configuration!.GetSection("Serilog:LogDirectory");
           
            string logDirectory = logDirConfig.Get<string>();

            // Determine the log directory based on configuration or a platform-agnostic default
            if (string.IsNullOrEmpty(logDirectory))
            {
                logDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "EpicenterAppLogs");
                // Ensure the directory exists
                Directory.CreateDirectory(logDirectory);
            }

            Log.Logger = new LoggerConfiguration()
                .Enrich.FromLogContext()
                .WriteTo.File(Path.Combine(logDirectory, "requests-.log"), rollingInterval: RollingInterval.Day)
                .CreateLogger();

            #endregion //////<<<<<<<<< Serilog Configuration >>>>>>>>>//////

            #region //////<<<<<<<<< CORS Configuration >>>>>>>>>//////
            services.AddCors(options =>
            {
                options.AddPolicy("HPECorsPolicy", builder =>
                {
                    builder
                        .SetIsOriginAllowed(origin => true) // allow any origin
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials(); // allow cookies or auth headers
                });

            });

            #endregion //////<<<<<<<<< CORS Configuration >>>>>>>>>//////


            services.AddMemoryCache();
            services.AddHttpContextAccessor();
            services.AddHttpClient<EmailService>();

            #region ///////<<<<<<<<< AutoMapper Configuration >>>>>>>>>//////
            services.AddAutoMapper(typeof(Mappings).Assembly);
            services.AddTransient<DocumentMapping>();
            services.AddTransient<DocumentReverseMapping>();

            #endregion ///////<<<<<<<<< AutoMapper Configuration >>>>>>>>>//////

            #region Register Services


            services.AddScoped<IEmailTemplateService, EmailTemplateService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<ICommuncationService, CommunicationService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IMasterService, MasterService>();

            services.AddScoped<IEmpanelmentService, EmpanelmentService>();

            services.AddScoped<IExternalService, ExternalService>();
            services.AddScoped<IPartnerService, PartnerService>();
            services.AddScoped<ICandidateFormService, CandidateFormService>();
            services.AddScoped<IContactMatrixService, ContactMatrixService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IEngagementService, EngagementService>();
            services.AddScoped<IEscalationMatrixService, EscalationMatrixService>();
            services.AddScoped<IHiringService, HiringRequestService>();
            services.AddScoped<IInterviewRoundService, InterviewRoundService>();
            services.AddScoped<IJobDetailsService, JobDetailsService>();
            services.AddScoped<IPartnerCategoryService, PartnerCategoryService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<ICalibrationService, CalibrationService>();
            services.AddScoped<ITemplateService, TemplateService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<ICandidateBinService, CandidateBinService>();
            services.AddScoped<ISOWService, SOWService>();
            services.AddScoped<IApplicationUtilities, ApplicationUtilities>();
            services.AddScoped<ISearchColumnService, SearchColumnService>();
            services.AddScoped<IInterviewSlotService, InterviewSlotService>();


            services.AddScoped<IHMSUtilities, HMSUtilities>();

            services.AddScoped<ICandidatePersonalDetailsService, CandidatePersonalDetailsService>();
            services.AddScoped<IAssetDetailsService, AssetDetailsService>();
            services.AddScoped<ITrainingDetailsService, TrainingDetailsService>();
            services.AddScoped<IProfileTrackerService, ProfileTrackerService>();
            services.AddScoped<ICandidateBgvService, CandidateBgvDetailsService>();

            services.AddScoped<ICandidateHelperMethods, CandidateHelperMethods>();
            services.AddScoped<IHelperMethods, HelperMethods>();
            services.AddScoped<IFileService, FileService>();
            services.AddScoped<IJoiningRescheduleHistoryService, JoiningRescheduleHistoryService>();

            #endregion  Register Services

            #region Register Repositories

            services.AddScoped<IRepositoryFactory, RepositoryFactory>();

            services.AddScoped<IGenericRepository<CandidateRateCard>, GenericRepository<CandidateRateCard>>();

            services.AddScoped<IGenericRepository<Partner>, GenericRepository<Partner>>();
            services.AddScoped<IGenericRepository<ContactMatrix>, GenericRepository<ContactMatrix>>();
            services.AddScoped<IGenericRepository<Engagement>, GenericRepository<Engagement>>();
            services.AddScoped<IGenericRepository<EngagementHistory>, GenericRepository<EngagementHistory>>();
            services.AddScoped<IGenericRepository<EscalationMatrix>, GenericRepository<EscalationMatrix>>();
            services.AddScoped<IGenericRepository<Notifications>, GenericRepository<Notifications>>();
            services.AddScoped<IGenericRepository<EmailTemplate>, GenericRepository<EmailTemplate>>();
            services.AddScoped<IGenericRepository<Calibration>, GenericRepository<Calibration>>();
            services.AddScoped<IGenericRepository<PartnerEmpanel>, GenericRepository<PartnerEmpanel>>();
            services.AddScoped<IGenericRepository<SOW>, GenericRepository<SOW>>();
            services.AddScoped<IGenericRepository<PODetail>, GenericRepository<PODetail>>();

            services.AddScoped<IGenericRepository<SOWHistory>, GenericRepository<SOWHistory>>();
            services.AddScoped<IGenericRepository<PODetailHistory>, GenericRepository<PODetailHistory>>();

            services.AddScoped<IGenericRepository<HiringRequest>, GenericRepository<HiringRequest>>();
            services.AddScoped<IGenericRepository<InterviewRound>, GenericRepository<InterviewRound>>();
            services.AddScoped<IGenericRepository<JobDetails>, GenericRepository<JobDetails>>();
            services.AddScoped<IGenericRepository<PartnerCategory>, GenericRepository<PartnerCategory>>();
            services.AddScoped<IGenericRepository<HiringReqPartner>, GenericRepository<HiringReqPartner>>();

            services.AddScoped<IGenericRepository<Candidate>, GenericRepository<Candidate>>();
            services.AddScoped<IGenericRepository<CandidateHistory>, GenericRepository<CandidateHistory>>();
            services.AddScoped<IGenericRepository<CandidateInterviewFeedBack>, GenericRepository<CandidateInterviewFeedBack>>();
            services.AddScoped<IGenericRepository<InterviewSlotAllocationHistory>, GenericRepository<InterviewSlotAllocationHistory>>();

            services.AddScoped<IGenericRepository<M_JobLevel>, GenericRepository<M_JobLevel>>();
            services.AddScoped<IGenericRepository<M_City>, GenericRepository<M_City>>();
            services.AddScoped<IGenericRepository<M_Country>, GenericRepository<M_Country>>();
            services.AddScoped<IGenericRepository<M_Domain>, GenericRepository<M_Domain>>();
            services.AddScoped<IGenericRepository<M_Skill>, GenericRepository<M_Skill>>();
            services.AddScoped<IGenericRepository<M_State>, GenericRepository<M_State>>();
            services.AddScoped<IGenericRepository<M_SubDomain>, GenericRepository<M_SubDomain>>();
            services.AddScoped<IGenericRepository<M_MasterData>, GenericRepository<M_MasterData>>();
            services.AddScoped<IGenericRepository<M_Configuration>, GenericRepository<M_Configuration>>();

            services.AddScoped<IGenericRepository<RCMSDetails>, GenericRepository<RCMSDetails>>();
            services.AddScoped<IGenericRepository<Notifications>, GenericRepository<Notifications>>();
            services.AddScoped<IGenericRepository<Users>, GenericRepository<Users>>();
            services.AddScoped<IGenericRepository<UserRole>, GenericRepository<UserRole>>();
            services.AddScoped<IGenericRepository<Role>, GenericRepository<Role>>();
            services.AddScoped<IGenericRepository<InterviewSlot>, GenericRepository<InterviewSlot>>();
            services.AddScoped<IGenericRepository<CandidateBin>, GenericRepository<CandidateBin>>();
            services.AddScoped<IGenericRepository<CandidateBinHistory>, GenericRepository<CandidateBinHistory>>();

            services.AddScoped<IGenericRepository<M_SearchColumn>, GenericRepository<M_SearchColumn>>();
            services.AddScoped<IGenericRepository<InterviewActionLog>, GenericRepository<InterviewActionLog>>();

            services.AddScoped<IGenericRepository<CandidatePersonalDetails>, GenericRepository<CandidatePersonalDetails>>();
            services.AddScoped<IGenericRepository<AssetDetails>, GenericRepository<AssetDetails>>();
            services.AddScoped<IGenericRepository<ProfileTracker>, GenericRepository<ProfileTracker>>();
            services.AddScoped<IGenericRepository<TrainingDetails>, GenericRepository<TrainingDetails>>();
            services.AddScoped<IGenericRepository<CandidateBgvDetails>, GenericRepository<CandidateBgvDetails>>();

            services.AddScoped<IGenericRepository<DocumentDetails>, GenericRepository<DocumentDetails>>();
            services.AddScoped<IGenericRepository<PartnerApprovalHistory>, GenericRepository<PartnerApprovalHistory>>();
            services.AddScoped<IGenericRepository<FeedbackCritriaOptions>, GenericRepository<FeedbackCritriaOptions>>();

            services.AddScoped<IGenericRepository<M_Module>, GenericRepository<M_Module>>();
            services.AddScoped<IGenericRepository<M_Form>, GenericRepository<M_Form>>();
            services.AddScoped<IGenericRepository<M_RoleFormAccess>, GenericRepository<M_RoleFormAccess>>();

            services.AddScoped<IGenericRepository<QuarterDateRange>, GenericRepository<QuarterDateRange>>();
            services.AddScoped<IGenericRepository<JoiningRescheduleHistory>, GenericRepository<JoiningRescheduleHistory>>();

            services.AddScoped<IGenericRepository<OnholdHiringRequest>, GenericRepository<OnholdHiringRequest>>();
            services.AddScoped<IGenericRepository<CandidateReconsiderationHistory>, GenericRepository<CandidateReconsiderationHistory>>();

            #endregion Register Repositories

            #region Background services
            services.AddHostedService<EpicenterHourlyService>();
            services.AddHostedService<EpiCenterDailyService>();

            ////<<<<<Commented to stop email service temporarily>>>>//
            //services.AddHostedService<EpicenterEmailService>();

            #endregion Background services

        }
    }
}