import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://leave-od-approval.onrender.com/api';

const chatApi = axios.create({
  baseURL: `${API_URL}/chat`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
chatApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token being sent:', token ? '✅ Yes' : '❌ No');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Student APIs
export const studentChatAPI = {
  sendMessage: (data) => chatApi.post('/send', data),
  getMyMessages: (params) => chatApi.get('/my-messages', { params }),
  deleteMessage: (id) => chatApi.delete(`/message/${id}`),
};

// HOD APIs
export const hodChatAPI = {
  getMessages: (params) => chatApi.get('/hod/messages', { params }),
  getMessage: (id) => chatApi.get(`/hod/message/${id}`),
  viewMessage: (id) => chatApi.put(`/hod/view/${id}`),
  getStats: () => chatApi.get('/hod/stats'),
};

export default chatApi;