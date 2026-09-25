namespace EpicenterX.Application.DTOs.Masters
{
    public class CountryMasterDto
    {
        public int CountryId { get; set; }
        public string? CountryName { get; set; }
        public List<StateMasterDto>? States { get; set; }
    }
}
