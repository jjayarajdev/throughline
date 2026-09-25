using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.DTOs.Masters;
using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Application.Interfaces.Services;
using EpicenterX.Domain.Entities.Masters;
using EpicenterX.Domain.Enums;
using EpicenterX.Domain.Shared;

namespace EpicenterX.Application.Services
{
    public class SearchColumnService(IGenericRepository<M_SearchColumn> _searchColumnRepository,
                                    IMapper _mapper,
                                    IHelperMethods _helperMethods) : BaseService, ISearchColumnService
    {
        public async Task<ApiResponseDto<PagedResult<GetSearchColumnDto>>> GetPagedSearchColumns(PageDto pageData)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _searchColumnRepository.GetPaginatedListAsync(pageData);

                var dtos = _mapper.Map<IEnumerable<GetSearchColumnDto>>(result.Items);
                return new PagedResult<GetSearchColumnDto>(dtos, result.TotalCount, result.PageSize, result.CurrentPage);
            }, "Search columns fetched successfully.");
        }

        public async Task<ApiResponseDto<IEnumerable<GetSearchColumnDto>>> GetSearchColumns(int gridId)
        {
            return await ExecuteAsync(async () =>
            {
                var loggedInUser = _helperMethods.GetUserDetails();

                var result = await _searchColumnRepository.GetListAsync(query =>
                    query.Where(x => x.GridId == gridId
                    && (loggedInUser.RoleId != (int)ROLES.PARTNER || x.IsPartner == true)
                    ));

                return _mapper.Map<IEnumerable<GetSearchColumnDto>>(result);
            }, "Search columns list fetched successfully.");
        }

        public async Task<ApiResponseDto<GetSearchColumnDto>> GetSearchColumn(int id)
        {
            return await ExecuteAsync(async () =>
            {
                var result = await _searchColumnRepository.GetAsync(query =>
                    query.Where(x => x.Id == id));

                return result == null
                    ? throw new Exception($"Search column not found with Id : {id}")
                    : _mapper.Map<GetSearchColumnDto>(result);
            }, "Search column fetched successfully.");
        }

        public async Task<ApiResponseDto<GetSearchColumnDto>> AddSearchColumn(AddSearchColumnDto searchColumn)
        {
            return await ExecuteAsync(async () =>
            {
                var added = await _searchColumnRepository.AddAsync(_mapper.Map<M_SearchColumn>(searchColumn));
                return _mapper.Map<GetSearchColumnDto>(added);
            }, "Search column added successfully.");
        }

        public async Task<ApiResponseDto<string>> UpdateSearchColumn(AddSearchColumnDto searchColumn)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _searchColumnRepository.GetAsync(searchColumn.Id)
                             ?? throw new Exception($"Search column not found with Id : {searchColumn.Id}");

                _mapper.Map(searchColumn, entity);
                await _searchColumnRepository.UpdateAsync(entity);
            }, "Search column updated successfully.");
        }

        public async Task<ApiResponseDto<string>> ToggleSearchColumnStatus(int id, bool? isActive)
        {
            return await ExecuteAsync(async () =>
            {
                var entity = await _searchColumnRepository.GetAsync(id)
                             ?? throw new Exception($"Search column not found with Id : {id}");

                entity.IsActive = isActive;
                await _searchColumnRepository.UpdateAsync(entity);
            }, "Search column status updated successfully.");
        }
    }
}
