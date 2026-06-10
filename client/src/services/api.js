import axios from 'axios';
import { API_URL } from '../config';

const API = axios.create({
  baseURL: API_URL,
});

// Request interceptor to automatically append the JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const loginUser = (email, password) => API.post('/auth/login', { email, password });
export const registerUser = (name, email, password) => API.post('/auth/register', { name, email, password });
export const logoutUser = () => API.post('/auth/logout');
export const getUserProfile = () => API.get('/auth/me');

// Food Item CRUD endpoints
export const getFoodItems = (params) => API.get('/food', { params });
export const getExpirySuggestion = (itemName, category, storageType, status) => API.get('/food/suggest-expiry', { params: { itemName, category, storageType, status } });
export const addFoodItem = (foodData) => API.post('/food', foodData);
export const updateFoodItem = (id, foodData) => API.put(`/food/${id}`, foodData);
export const deleteFoodItem = (id) => API.delete(`/food/${id}`);
export const consumeFoodItem = (id) => API.patch(`/food/${id}/consume`);

// Food inventory history and analytics endpoints
export const getHistory = (params) => API.get('/history', { params });
export const getHistoryRecord = (id) => API.get(`/history/${id}`);
export const getRecentHistory = (params) => API.get('/history/recent', { params });
export const getHistoryStats = () => API.get('/history/stats');
export const getMonthlyHistory = () => API.get('/history/monthly');
export const getTopHistoryItems = (params) => API.get('/history/top-items', { params });
export const exportHistory = (params) => API.get('/history/export', { params, responseType: 'blob' });

// Food Reference database endpoints
export const searchFoodReference = (q, category) => API.get('/reference/search', { params: { q, category } });
export const getReferenceCategory = (category) => API.get(`/reference/category/${category}`);
export const getReferenceById = (id) => API.get(`/reference/${id}`);

// AI Recommendations and Notifications endpoints
export const getAiDashboardData = () => API.get('/ai/dashboard');
export const getAiNotifications = () => API.get('/ai/notifications');

export default API;
