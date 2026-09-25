import api from "@/lib/axiosInstance";

export const userRoleAPi = {
    getRoles: async () => {
        const response = await api.get('/User/user-roles');
        return response.data.data;
    },

    getUsers: async () => {
        const response = await api.get('/User/list');
        return response.data.data;
    },

    getActiveInactiveUsers: async (isActive: boolean) => {
        const response = await api.get(`/User/list?Isactive=${isActive}`);
        return response.data.data;
    }
}