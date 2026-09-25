using ClosedXML.Excel;
using DocumentFormat.OpenXml.Spreadsheet;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EpicenterX.Application.Services
{
    public class TemplateService(AppDBContext _context) : ITemplateService
    {
        //public async Task<byte[]> DownloadCandidateTemplateAsync()
        //{
        //    var hrqIds = await _context.Hiring.Select(x => x.HrqId).ToListAsync();
        //    var Countries = await _context.M_Countries.Where(x => x.IsActive == true).ToListAsync();
        //    var States = await _context.M_States.Where(x => x.IsActive == true).ToListAsync();
        //    var Cities = await _context.M_Cities.Where(x => x.IsActive == true).ToListAsync();

        //    using var workbook = new XLWorkbook();
        //    var ws = workbook.Worksheets.Add("CandidateForm");

        //    int currentWSRow = 1;
        //    int currentWSCol = 1;

        //    // Add headers
        //    var headers = new Dictionary<int, string>
        //                    {
        //                        { 1, "HrqId" },
        //                        { 2, "Full Name*" },
        //                        { 3, "Phone/ Mobile Number*" },
        //                        { 4, "Email*" },
        //                        { 5, "Skill (Use Comma to separate the Skills)*" },
        //                        { 6, "Diversity(Yes/No)*" },
        //                        { 7, "Country" },
        //                        { 8, "State" },
        //                        { 9, "City" },
        //                        { 10, "Notice Period (Days)" },
        //                        { 11, "Relevant Experience (Years)" },
        //                        { 12, "Currently Working(Yes/No)*" },
        //                        { 13, "Organization" },
        //                        { 14, "Partner Name" },
        //                        { 15, "Last Working Day * (mm-dd-yyyy)" }
        //                    };
        //    for (int i = 1; i < headers.Count; i++)
        //    {
        //        var headerCell = ws.Cell(currentWSRow, i);
        //        var headerColumn = ws.Column(i);
        //        headerCell.Value = headers[i];
        //        headerColumn.Width = 30;

        //        headerCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        //        headerCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        //        headerCell.Style.Font.Bold = true;
        //        headerCell.Style.Font.FontColor = XLColor.White;
        //        headerCell.Style.Fill.BackgroundColor = XLColor.Green;

        //        currentWSCol = i;
        //    }

        //    // Add lookup sheet
        //    var lookupSheet = workbook.Worksheets.Add("Lookups");

        //    #region Skills

        //    int skillCol = 1; // Column B
        //    int startRow = 2;
        //    // Add Skills list
        //    // Cell A1
        //    var SkillTitleCell = lookupSheet.Cell(1, skillCol);

        //    SkillTitleCell.Value = "Skills";
        //    SkillTitleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        //    SkillTitleCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        //    SkillTitleCell.Style.Font.Bold = true;

        //    for (int i = 1; i < skills.Count; i++)
        //        lookupSheet.Cell(i + 1, skillCol).Value = skills[i - 1];

        //    var skillsRange = lookupSheet.Range($"A2:A{skills.Count}");
        //    ws.Range($"E2:E{skills.Count}").CreateDataValidation().List(skillsRange);
        //    // Add 1 to set next column
        //    #endregion

        //    #region Countries

        //    int countryCol = 2; // Column B

        //    var countryTitleCell = lookupSheet.Cell(1, countryCol);

        //    countryTitleCell.Value = "Countries";
        //    countryTitleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        //    countryTitleCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        //    countryTitleCell.Style.Font.Bold = true;

        //    if (Countries.Count == 1)
        //    {
        //        // Only one country — write it directly to B2
        //        lookupSheet.Cell(startRow, countryCol).Value = Countries[0].Name;
        //        var countryRange = lookupSheet.Range(startRow, countryCol, 2, countryCol);
        //        workbook.NamedRanges.Add("Countries", countryRange);
        //    }
        //    else if (Countries.Count > 1)
        //    {
        //        // Multiple countries — write them starting from B2
        //        for (int i = 0; i < Countries.Count; i++)
        //        {
        //            lookupSheet.Cell(startRow + i, countryCol).Value = Countries[i].Name;
        //        }

        //        // Optionally create a named range for countries
        //        var endRow = startRow + Countries.Count - 1;
        //        var countryRange = lookupSheet.Range(startRow, countryCol, endRow, countryCol);
        //        workbook.NamedRanges.Add("Countries", countryRange);
        //    }
        //    #endregion

        //    #region States

        //    int stateCol = 3; // Column C
        //    // Create named ranges for each country’s states

        //    int currentRow = 2; // Start row after title
        //    foreach (var country in Countries)
        //    {
        //        var statesList = States
        //            .Where(sd => sd.CountryId == country.Id)
        //            .Select(sd => sd.Name)
        //            .ToList();

        //        if (statesList.Count > 0)
        //        {
        //            int stateStartRow = currentRow;
        //            int endRow = currentRow + statesList.Count - 1;

        //            // Write each state into the lookup sheet column
        //            for (int i = 0; i < statesList.Count; i++)
        //            {
        //                lookupSheet.Cell(currentRow + i, stateCol).Value = statesList[i];
        //            }

        //            // Create a named range for the country
        //            var cleanName = country.Name!.Replace(" ", "_");
        //            var range = lookupSheet.Range(startRow, stateCol, endRow, stateCol);
        //            workbook.NamedRanges.Add(cleanName, range);

        //            // Update currentRow for the next country
        //            currentRow = endRow + 1;
        //        }
        //    }

        //    // Add data validation to main worksheet (ws)
        //    for (int row = 2; row <= 100; row++)
        //    {
        //        string countryCell = $"G{row}";
        //        string stateCell = $"H{row}";
        //        var validation = ws.Cell(stateCell).CreateDataValidation();
        //        validation.IgnoreBlanks = true;
        //        validation.InCellDropdown = true;

        //        // Set dependent dropdown using INDIRECT and SUBSTITUTE
        //        validation.List($"INDIRECT(SUBSTITUTE({countryCell}, \" \", \"_\"))");
        //    }

        //    var stateTitleCell = lookupSheet.Range(1, stateCol, 1, stateCol);
        //    stateTitleCell.Merge();
        //    stateTitleCell.Value = "States";

        //    // Center align both horizontally and vertically
        //    stateTitleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        //    stateTitleCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        //    stateTitleCell.Style.Font.Bold = true;
        //    #endregion

        //    #region Cities

        //    int cityCol = 4; // Column C
        //    //// Create named ranges for each country’s states

        //    int currentCityRow = 2; // Start below title row
        //    int cityLookupCol = cityCol; // Set this once, all cities go in this column

        //    foreach (var state in States)
        //    {
        //        var citiesList = Cities
        //            .Where(city => city.StateId == state.Id)
        //            .Select(city => city.Name)
        //            .ToList();

        //        if (citiesList.Count > 0)
        //        {
        //            int cityStartRow = currentCityRow;
        //            int endRow = currentCityRow + citiesList.Count - 1;

        //            // Fill cities in the lookup sheet
        //            for (int i = 0; i < citiesList.Count; i++)
        //            {
        //                lookupSheet.Cell(currentCityRow + i, cityLookupCol).Value = citiesList[i];
        //            }

        //            // Define named range based on state name
        //            var cleanName = state.Name!.Replace(" ", "_");
        //            var range = lookupSheet.Range(startRow, cityLookupCol, endRow, cityLookupCol);
        //            workbook.NamedRanges.Add(cleanName, range);

        //            currentCityRow = endRow + 1; // Move down for next state's cities
        //        }
        //    }

        //    // Set validation in main sheet (ws) for city dropdown
        //    for (int row = 2; row <= 100; row++)
        //    {
        //        string stateCell = $"H{row}";
        //        string cityCell = $"I{row}";

        //        var validation = ws.Cell(cityCell).CreateDataValidation();
        //        validation.IgnoreBlanks = true;
        //        validation.InCellDropdown = true;

        //        // Uses INDIRECT to dynamically select city range by selected state
        //        validation.List($"INDIRECT(SUBSTITUTE({stateCell}, \" \", \"_\"))");
        //    }

        //    // Add title "Cities" at top of the lookup column
        //    var cityTitleCell = lookupSheet.Range(1, cityLookupCol, 1, cityLookupCol);
        //    cityTitleCell.Merge();
        //    cityTitleCell.Value = "Cities";
        //    cityTitleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        //    cityTitleCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        //    cityTitleCell.Style.Font.Bold = true;

        //    #endregion

        //    //lookupSheet.Hide();

        //    using var stream = new MemoryStream();
        //    workbook.SaveAs(stream);
        //    return stream.ToArray();

        //}


        public async Task<byte[]> DownloadCandidateTemplateAsync()
        {
            var skills = await _context.M_Skills.Where(x => x.IsActive == true).Select(x => x.Name).ToListAsync();
            var Countries = await _context.M_Countries.Where(x => x.IsActive == true).ToListAsync();
            var States = await _context.M_States.Where(x => x.IsActive == true).ToListAsync();
            var Cities = await _context.M_Cities.Where(x => x.IsActive == true).ToListAsync();

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("CandidateForm");

            int currentWSRow = 1;
            int currentWSCol = 1;

            // Add headers
            var headers = new Dictionary<int, string>
                            {
                                { 1, "HrqId" },
                                { 2, "Full Name*" },
                                { 3, "Phone/ Mobile Number*" },
                                { 4, "Email*" },
                                { 5, "Skill (Use Comma to separate the Skills)*" },
                                { 6, "Diversity(Yes/No)*" },
                                { 7, "Current City" },
                                { 8, "Current State" },
                                { 9, "Current Country" },
                                { 10, "Notice Period (Days)" },
                                { 11, "Relevant Experience (Years)" },
                                { 12, "Currently Working(Yes/No)*" },
                                { 13, "Organization" },
                                { 14, "Partner Name" },
                                { 15, "Last Working Day * (mm-dd-yyyy)" }
                            };
            for (int i = 1; i < headers.Count; i++)
            {
                var headerCell = ws.Cell(currentWSRow, i);
                var headerColumn = ws.Column(i);
                headerCell.Value = headers[i];
                headerColumn.Width = 30;

                headerCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                headerCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                headerCell.Style.Font.Bold = true;
                headerCell.Style.Font.FontColor = XLColor.White;
                headerCell.Style.Fill.BackgroundColor = XLColor.Green;

                currentWSCol = i;
            }

            // Add lookup sheet
            var lookupSheet = workbook.Worksheets.Add("Lookups");

            #region Skills

            int skillCol = 1; // Column B
            int startRow = 2;
            // Add Skills list
            // Cell A1
            var SkillTitleCell = lookupSheet.Cell(1, skillCol);

            SkillTitleCell.Value = "Skills";
            SkillTitleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            SkillTitleCell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            SkillTitleCell.Style.Font.Bold = true;

            for (int i = 1; i < skills.Count; i++)
                lookupSheet.Cell(i + 1, skillCol).Value = skills[i - 1];

            var skillsRange = lookupSheet.Range($"A2:A{skills.Count}");
            //ws.Range($"E2:E{skills.Count}").CreateDataValidation().List(skillsRange);
            // Add 1 to set next column
            #endregion

            // Build mapping: City -> State, Country
            var cityMappings = (from city in Cities
                                join state in States on city.StateId equals state.Id
                                join country in Countries on state.CountryId equals country.Id
                                select new
                                {
                                    CityName = city.Name!,
                                    StateName = state.Name!,
                                    CountryName = country.Name!
                                }).ToList();

            var CitiesLookupSheet = workbook.Worksheets.Add("CityLookup");

            // Headers
            CitiesLookupSheet.Cell("A1").Value = "City";
            CitiesLookupSheet.Cell("B1").Value = "State";
            CitiesLookupSheet.Cell("C1").Value = "Country";
            CitiesLookupSheet.Range("A1:C1").Style.Font.Bold = true;

            // Fill rows
            int row = 2;
            foreach (var map in cityMappings)
            {
                CitiesLookupSheet.Cell(row, 1).Value = map.CityName;
                CitiesLookupSheet.Cell(row, 2).Value = map.StateName;
                CitiesLookupSheet.Cell(row, 3).Value = map.CountryName;
                row++;
            }

            // Create named range for city dropdown
            var cityRange = CitiesLookupSheet.Range($"A2:A{cityMappings.Count + 1}");
            workbook.NamedRanges.Add("CityList", cityRange);

            // Apply validation for City (column I)
            for (int i = 2; i <= 100; i++)
            {
                ws.Cell(i, 7).CreateDataValidation().List(cityRange); // Column G = 7

                // Add VLOOKUP formulas for State and Country
                ws.Cell(i, 8).FormulaA1 = $"=IFERROR(VLOOKUP(G{i}, CityLookup!A:C, 2, FALSE), \"\")"; // Column H = State
                ws.Cell(i, 9).FormulaA1 = $"=IFERROR(VLOOKUP(G{i}, CityLookup!A:C, 3, FALSE), \"\")"; // Column I = Country
            }

            CitiesLookupSheet.Hide();
            lookupSheet.Hide();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();

        }
    }
}
