using AutoMapper;
using EpicenterX.Application.DTOs;
using EpicenterX.Application.Extensions.HelperMethods;
using EpicenterX.Domain.Entities;

namespace EpicenterX.Application.Mappings
{
    public class BaseIdentifierMapping(IApplicationUtilities _applicationUtilities) : IMappingAction<BaseIdentifierDto, BaseIdentifier>
    {
        public void Process(BaseIdentifierDto source, BaseIdentifier destination, ResolutionContext context)
        {
            destination.CreatedAt = source.CreatedAt.HasValue ? _applicationUtilities.GetUtcDateTime(source.CreatedAt.Value) : null;
            destination.UpdatedAt = source.UpdatedAt.HasValue ? _applicationUtilities.GetUtcDateTime(source.UpdatedAt.Value) : null;
        }
    }

    public class BaseIdentifierDtoMapping(IApplicationUtilities _applicationUtilities) : IMappingAction<BaseIdentifier, BaseIdentifierDto>
    {
        public void Process(BaseIdentifier source, BaseIdentifierDto destination, ResolutionContext context)
        {
            destination.CreatedAt = source.CreatedAt.HasValue ? _applicationUtilities.GetLocalTime(source.CreatedAt.Value) : null;
            destination.UpdatedAt = source.UpdatedAt.HasValue ? _applicationUtilities.GetLocalTime(source.UpdatedAt.Value) : null;
        }
    }
}
