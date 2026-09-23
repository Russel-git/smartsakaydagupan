import apiClient from './client';

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  verifyOtp: (data) => apiClient.post('/auth/verify-otp', data),
  resendOtp: (data) => apiClient.post('/auth/resend-otp', data),
  login: (data) => apiClient.post('/auth/login', data),
  refreshToken: (data) => apiClient.post('/auth/refresh-token', data),
  forgotPassword: (data) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  logout: () => apiClient.post('/auth/logout'),
};

export const usersAPI = {
  getProfile: () => apiClient.get('/users/me'),
  updateProfile: (data) => apiClient.put('/users/me', data),
  changePassword: (data) => apiClient.put('/users/me/password', data),
  getAllUsers: (params) => apiClient.get('/users', { params }),
  updateUserStatus: (id, data) => apiClient.put(`/users/${id}/status`, data),
};

export const faresAPI = {
  getActiveFares: () => apiClient.get('/fares'),
  calculateFare: (params) => apiClient.get('/fares/calculate', { params }),
  getFareMatrix: () => apiClient.get('/fares/matrix'),
  updateFare: (id, data) => apiClient.put(`/fares/${id}`, data),
  getFareHistory: () => apiClient.get('/fares/history'),
};

export const routesAPI = {
  getAllRoutes: () => apiClient.get('/routes'),
  getRouteById: (id) => apiClient.get(`/routes/${id}`),
  getNearbyRoutes: (params) => apiClient.get('/routes/nearby', { params }),
  getBusTerminals: (params) => apiClient.get('/terminals', { params }).catch(() => apiClient.get('/routes/bus-terminals', { params })),
  createRoute: (data) => apiClient.post('/routes', data),
  updateRoute: (id, data) => apiClient.put(`/routes/${id}`, data),
  deleteRoute: (id) => apiClient.delete(`/routes/${id}`),
};

export const terminalsAPI = {
  getAll: (params) => apiClient.get('/terminals', { params }),
  getById: (id) => apiClient.get(`/terminals/${id}`),
};


export const complaintsAPI = {
  createComplaint: (data) => apiClient.post('/complaints', data),
  getMyComplaints: () => apiClient.get('/complaints/my'),
  getComplaintById: (id) => apiClient.get(`/complaints/${id}`),
  getAllComplaints: (params) => apiClient.get('/complaints', { params }),
  updateComplaintStatus: (id, data) => apiClient.put(`/complaints/${id}/status`, data),
  addAdminNotes: (id, data) => apiClient.put(`/complaints/${id}/notes`, data),
};

export const assistantAPI = {
  chat: (data) => apiClient.post('/assistant/chat', data),
  getHistory: () => apiClient.get('/assistant/history'),
  clearHistory: () => apiClient.delete('/assistant/history'),
};

export const weatherAPI = {
  getCurrentWeather: () => apiClient.get('/weather/current'),
  getForecast: () => apiClient.get('/weather/forecast'),
};

export const notificationsAPI = {
  getNotifications: () => apiClient.get('/notifications'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
  broadcast: (data) => apiClient.post('/notifications/broadcast', data),
  sendToUser: (data) => apiClient.post('/notifications/send', data),
};

export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats'),
  getActivity: () => apiClient.get('/admin/activity'),
};
