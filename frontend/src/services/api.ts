import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authAPI = {
    login: async (mobile: string, password: string) => {
        const response = await api.post('/users/login', { mobile, password });
        return response.data;
    }
};

export default api;
