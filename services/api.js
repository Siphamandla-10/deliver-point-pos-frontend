import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ LIVE PRODUCTION URL - Your backend on Render
const API_BASE_URL = 'https://deliver-point-pos-backend.onrender.com/api';

// 🔧 For local development, uncomment this line instead:
 //const API_BASE_URL = 'http://172.20.10.2:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds to handle Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Product endpoints
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  getCategories: () => api.get('/products/categories/list'),
  getStats: () => api.get('/products/stats'),
};

// Transaction endpoints
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  refund: (id, reason) => api.put(`/transactions/${id}/refund`, { refundReason: reason }),
  void: (id) => api.put(`/transactions/${id}/void`),
  getSalesReport: (params) => api.get('/transactions/reports/sales', { params }),
  getStats: () => api.get('/transactions/stats'),
};

// Customer endpoints
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  getByPhone: (phone) => api.get(`/customers/phone/${phone}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  addLoyaltyPoints: (id, points) => api.patch(`/customers/${id}/loyalty`, { points }),
  redeemLoyaltyPoints: (id, points) => api.patch(`/customers/${id}/redeem`, { points }),
  getTopCustomers: (limit) => api.get('/customers/top', { params: { limit } }),
};

// Upload endpoints
export const uploadAPI = {
  uploadProductImage: (formData) => {
    return api.post('/upload/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for uploads
    });
  },
  uploadMultipleImages: (formData) => {
    return api.post('/upload/products/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 120 seconds for multiple uploads
    });
  },
  deleteImage: (publicId) => api.delete(`/upload/product/${publicId}`),
};

export default api;