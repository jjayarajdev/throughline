namespace EpicenterX.Application.DTOs.Masters
{
    public class StateMasterDto
    {
        public int StateId { get; set; }
        public string? StateName { get; set; }
        public int CountryId { get; set; }
        public List<CityMasterDto>? Cities { get; set; }

    }
}
