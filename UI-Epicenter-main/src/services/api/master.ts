import api from "@/lib/axiosInstance";

interface FetchDropdownParams {
    countryId?: number;
    stateId?: number;
    domainIds?: number[];
    isActive?: boolean;
}

export const dropdownApi = {
    fetchDropdown: async (id: number, params?: FetchDropdownParams) => {
        let url = `/Master/${id}`;
        let hasParams = false;

        if (params) {
            const queryParams = new URLSearchParams();

            if (params.countryId) {
                queryParams.append('countryId', params.countryId.toString());
            }
            if (params.stateId) {
                queryParams.append('stateId', params.stateId.toString());
            }
            if (params.domainIds) {
                queryParams.append('domainIds', params.domainIds.join(','));
            }

            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
                hasParams = true;
            }
        }

        // If params present, use &ISactive, else use ?isActive
        if (hasParams) {
            url += `&isActive=${params?.isActive ?? true}`;
        } else {
            url += `?isActive=${params?.isActive ?? true}`;
        }

        const res = await api.get(url);
        return res.data.data;
    },

    fetchSubDropDown: async (id: number, subdomainId: string) => {
        const res = await api.get(`/Master/${id}?domainIds=${subdomainId}`);
        return res.data.data;
    },
    fetchSubDropDowns: async (ids: number[]) => {
        const res = await api.post(`/Master/sub-domains`, ids);
        return res.data.data;
    },

    fetchSpecificpartner: async (id: number, hiringRequestId: string | null) => {
        const res = await api.get(`/Master/${id}?hiringRequestId=${hiringRequestId}`);
        return res.data.data;
    },
    fetchInterviewMode: async (id: number, roundNameId: string) => {
        let url = `/Master/${id}?roundNameId=${roundNameId}`;
        const res = await api.get(url);
        return res.data.data;
    },
    fetchFilter: async (id: number) => {
        const res = await api.get(`/SearchColumn/list/${id}`);
        return res.data.data;
    },
    getVacantHrqid: async (id: number) => {
        const res = await api.get(`/Master/68?hiringRequestId=${id}&getVacant=true`);
        return res.data.data;
    },
    fetchSubCitys: async (masterTypeId: number, parentIds:number[]) => {
        const res = await api.get(`/Master/listByIdList/${masterTypeId}?parentIds=${parentIds}`);
       return res.data.data;
    },
};
