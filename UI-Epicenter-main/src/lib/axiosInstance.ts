import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@/store/userStore';

// Define error response type
interface ErrorResponse {
  message: string;
  statusCode: number;
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor with proper typing
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useUserStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response interceptor with enhanced error handling
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ErrorResponse>) => {
        const originalRequest = error.config;

        // Handle unauthorized access
        if (error.response?.status === 401) {
            return Promise.reject(error);
        }
        // Handle server errors
        if (error.response?.status && error.response.status >= 500) {
            console.error('Server Error:', error.response.data);
        }

        // Handle network errors
        if (!error.response) {
            console.error('Network Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;