import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    headers: { 'Content-Type': 'application/json' },
});

export const authAPI = {
    login: async (mobile: string, password: string) => {
        const response = await api.post('/users/login', { mobile, password });
        return response.data;
    }
};

export const staffAPI = {
    getAll: async () => {
        const response = await api.get('/staff/');
        return response.data;
    },
    create: async (data: { name: string; mobile: string; role: string }) => {
        const response = await api.post('/staff/', data);
        return response.data;
    },
    update: async (id: string, data: { name?: string; mobile?: string }) => {
        const response = await api.put(`/staff/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/staff/${id}`);
        return response.data;
    }
};

export const menuAPI = {
    getAll: async () => {
        const response = await api.get('/restaurant/menu');
        return response.data;
    }
};

export const restaurantAPI = {
    getConfig: async () => {
        const response = await api.get('/restaurant/config');
        return response.data;
    }
};

export default api;
