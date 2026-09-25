using System.ComponentModel.DataAnnotations;
using EpicenterX.Domain.Enums;
using EpicenterX.Infrastructure.Persistence;

namespace EpicenterX.Application.Extensions
{
    public class ValidateStatusAttribute : ValidationAttribute
    {
        public MASTER_TYPE Type { get; set; }
        public bool? Optional { get; set; } = false;

        protected override ValidationResult IsValid(object? value, ValidationContext validationContext)
        {
            bool isValid = false;

            if (value == null || value is not int statusId)
                return ValidationResult.Success!; // Assume nullable is validated elsewhere


            if (validationContext.GetService(typeof(AppDBContext)) is not AppDBContext dbContext)
                throw new InvalidOperationException("DbContext is not available in validation context.");

            if (Optional == true && value == null)
                return ValidationResult.Success!;

            isValid = dbContext.M_MasterData.Any(s => s.Id == statusId && s.MasterTypeId == (int)Type);

            if (!isValid)
            {
                return new ValidationResult($"Invalid StatusId: must reference a Status with TypeId = {(int)Type}.");
            }

            return ValidationResult.Success!;
        }
    }
}
