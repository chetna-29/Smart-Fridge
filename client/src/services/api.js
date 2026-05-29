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
export const getUserProfile = () => API.get('/auth/profile');

// Food Item CRUD endpoints
export const getFoodItems = (params) => API.get('/food', { params });
export const getExpirySuggestion = (itemName, category) => API.get('/food/suggest-expiry', { params: { itemName, category } });
export const addFoodItem = (foodData) => API.post('/food', foodData);
export const updateFoodItem = (id, foodData) => API.put(`/food/${id}`, foodData);
export const deleteFoodItem = (id) => API.delete(`/food/${id}`);

export default API;
