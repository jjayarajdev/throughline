using EpicenterX.Application.Interfaces.Repositories;
using EpicenterX.Domain.Entities.HMS;

namespace EpicenterX.Application.Extensions.HelperMethods
{

    public interface IHMSUtilities
    {
        Task<bool> VerifyParentHiringRequestId(int? hiringRequestId);
        Task<List<int>> GetChildHiringRequestIds(int? hiringRequestId);
    }

    public class HMSUtilities(IGenericRepository<HiringRequest> _hiringRequestRepository) : IHMSUtilities
    {
        public async Task<bool> VerifyParentHiringRequestId(int? hiringRequestId)
        {
            var item = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == hiringRequestId));

            return item != null && (item.IsParentHRQ == true || item!.IsParentHRQ == null);
        }

        public async Task<List<int>> GetChildHiringRequestIds(int? hiringRequestId)
        {

            var parentRequest = await _hiringRequestRepository.GetAsync(query => query.Where(x => x.Id == hiringRequestId)) ?? throw new Exception($"Hiring request is not found with Id : {hiringRequestId}");

            var childRequests = await _hiringRequestRepository.GetListAsync(query => query.Where(x => x.ParentHrqId == parentRequest.HrqId));

            return childRequests.Select(x => x.Id).ToList();
        }
    }
}
