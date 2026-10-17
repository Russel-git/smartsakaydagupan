import apiClient from "./client";

// ============================================================
// USERS
// ============================================================

export const usersAPI = {
  getAll: (params) => apiClient.get("/users", { params }),

  updateStatus: (id, isActive) =>
    apiClient.put(`/users/${id}/status`, { isActive }),

  updateRole: (id, role) => apiClient.put(`/users/${id}/role`, { role }),

  create: (data) => apiClient.post("/users", data),

  delete: (id) => apiClient.delete(`/users/${id}`),

  resetPassword: (id, newPassword) =>
    apiClient.put(`/users/${id}/password`, { newPassword }),

  uploadProfilePhoto: (formData) =>
    apiClient.post("/users/me/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ============================================================
// AUTH
// ============================================================

export const authAPI = {
  login: (data) => apiClient.post("/auth/login", data),
  logout: () => apiClient.post("/auth/logout"),
};

// ============================================================
// ADMIN
// ============================================================

export const adminAPI = {
  getStats: () => apiClient.get("/admin/stats"),
  getActivity: () => apiClient.get("/admin/activity"),
  getAuditLogs: (params) => apiClient.get("/admin/audit-logs", { params }),
};

// ============================================================
// FARES
// ============================================================

export const faresAPI = {
  getActiveFares: () => apiClient.get("/fares"),
  calculateFare: (params) => apiClient.get("/fares/calculate", { params }),
  getFareMatrix: () => apiClient.get("/fares/matrix"),
  updateFare: (id, data) => apiClient.put(`/fares/${id}`, data),
  revertFare: (vehicleType) => apiClient.post(`/fares/revert/${vehicleType}`),
  getFareHistory: () => apiClient.get("/fares/history"),
};

// ============================================================
// ROUTES
// ============================================================

export const routesAPI = {
  getAllRoutes: () => apiClient.get("/routes"),
  getRouteById: (id) => apiClient.get(`/routes/${id}`),
  createRoute: (data) => apiClient.post("/routes", data),
  updateRoute: (id, data) => apiClient.put(`/routes/${id}`, data),
  deleteRoute: (id) => apiClient.delete(`/routes/${id}`),
};

// ============================================================
// COMPLAINTS
// ============================================================

export const complaintsAPI = {
  // Get complaints
  getAllComplaints: (params) => apiClient.get("/complaints", { params }),

  getComplaintById: (id) => apiClient.get(`/complaints/${id}`),

  // General complaint updates
  updateComplaintStatus: (id, data) =>
    apiClient.put(`/complaints/${id}/status`, data),

  addAdminNotes: (id, data) => apiClient.put(`/complaints/${id}/notes`, data),

  // POSO Road Triage & Field Reports
  endorse: (id, data) => apiClient.patch(`/complaints/${id}/endorse`, data),
  rejectComplaint: (id, data) => apiClient.patch(`/complaints/${id}/reject`, data),
  fileFieldReport: (data) => apiClient.post("/complaints/field-report", data),

  // Operator → LGU
  verifyToLgu: (id, data) =>
    apiClient.put(`/complaints/${id}/verify-lgu`, data),

  // Operator delete / soft-delete
  deleteComplaint: (id, data) =>
    apiClient.delete(`/complaints/${id}`, {
      data,
    }),

  // Archive restore & permanent delete
  restoreComplaint: (id) => apiClient.patch(`/complaints/${id}/restore`),
  deletePermanently: (id) => apiClient.delete(`/complaints/${id}/permanent`),

  // LGU enforcement action
  lguAction: (id, data) => apiClient.put(`/complaints/${id}/lgu-action`, data),

  // LGU termination
  lguTerminate: (id, data) =>
    apiClient.put(`/complaints/${id}/lgu-terminate`, data),

  // Evidence photo upload
  uploadEvidence: (formData) =>
    apiClient.post("/complaints/upload-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notificationsAPI = {
  getRecent: (params) => apiClient.get("/notifications", { params }),
  getFeed: (params) => apiClient.get("/notifications/feed", { params }),
  getPending: () => apiClient.get("/notifications/pending"),
  requestAlert: (data) => apiClient.post("/notifications/request", data),
  approveAlert: (id) => apiClient.patch(`/notifications/${id}/approve`),
  rejectAlert: (id, data) =>
    apiClient.patch(
      `/notifications/${id}/reject`,
      typeof data === "string" ? { reason: data } : data,
    ),
  broadcast: (data) => apiClient.post("/notifications/broadcast", data),
  sendToUser: (data) => apiClient.post("/notifications/send", data),
  archiveAnnouncement: (id) => apiClient.patch(`/notifications/${id}/archive`),
  restoreAnnouncement: (id) => apiClient.patch(`/notifications/${id}/restore`),
  deletePermanently: (id) => apiClient.delete(`/notifications/${id}/permanent`),
  uploadEvidence: (formData) =>
    apiClient.post("/complaints/upload-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ============================================================
// THEME
// ============================================================

export const themeAPI = {
  getTheme: () => apiClient.get("/theme/"),

  updateTheme: (theme) => apiClient.patch("/theme", { theme }),
};
