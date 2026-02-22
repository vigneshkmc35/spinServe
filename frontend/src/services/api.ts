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
    getAll: async () => { const r = await api.get('/staff/'); return r.data; },
    create: async (data: { name: string; mobile: string; role: string }) => { const r = await api.post('/staff/', data); return r.data; },
    update: async (id: string, data: { name?: string; mobile?: string }) => { const r = await api.put(`/staff/${id}`, data); return r.data; },
    delete: async (id: string) => { const r = await api.delete(`/staff/${id}`); return r.data; }
};

export const menuAPI = {
    getGroups: async () => { const r = await api.get('/menu/groups'); return r.data; },
    createGroup: async (data: { title: string; image_url?: string }) => { const r = await api.post('/menu/groups', data); return r.data; },
    deleteGroup: async (id: string) => { const r = await api.delete(`/menu/groups/${id}`); return r.data; },

    getItems: async (groupId?: string) => {
        const url = groupId ? `/menu/items?group_id=${groupId}` : '/menu/items';
        const r = await api.get(url);
        return r.data;
    },
    createItem: async (data: { group_id: string; name: string; description?: string; price: number; image_url?: string }) => {
        const r = await api.post('/menu/items', data);
        return r.data;
    },
    updateItem: async (id: string, data: { name?: string; description?: string; price?: number; image_url?: string; is_available?: boolean }) => {
        const r = await api.put(`/menu/items/${id}`, data);
        return r.data;
    },
    deleteItem: async (id: string) => { const r = await api.delete(`/menu/items/${id}`); return r.data; }
};

export const restaurantAPI = {
    getConfig: async () => { const r = await api.get('/restaurant/config'); return r.data; },
    updateConfig: async (data: any) => { const r = await api.put('/restaurant/config', data); return r.data; }
};

export default api;
