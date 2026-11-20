// src/services/api.js
import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hc_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('hc_refresh')
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
          const { token } = res.data
          localStorage.setItem('hc_token', token)
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }
      } catch {
        localStorage.removeItem('hc_token')
        localStorage.removeItem('hc_refresh')
        localStorage.removeItem('hc_user')
        window.location.href = '/login'
      }
    }
    const msg = error.response?.data?.message || 'Something went wrong'
    if (error.response?.status !== 401) toast.error(msg)
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
  refresh:  (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
}

// ─── Patient ──────────────────────────────────────────────────────────────────
export const patientAPI = {
  getProfile:         (id) => api.get(`/patients/${id}`),
  updateProfile:      (id, data) => api.put(`/patients/${id}`, data),
  getDoctors:         ()   => api.get('/patients/doctors'),
  assignDoctor:       (doctorId) => api.post('/patients/assign-doctor', { doctorId }),
  getMyDoctor:        ()   => api.get('/patients/my-doctor'),
  getMyPrescriptions: ()   => api.get('/patients/prescriptions'),
}

// ─── Health Data ──────────────────────────────────────────────────────────────
export const healthAPI = {
  addEntry:   (data) => api.post('/health-data', data),
  getEntries: (params) => api.get('/health-data', { params }),
  getLatest:  () => api.get('/health-data/latest'),
  getStats:   (period) => api.get('/health-data/stats', { params: { period } }),
  deleteEntry:(id) => api.delete(`/health-data/${id}`),
  getTrends:  (metric, days) => api.get('/health-data/trends', { params: { metric, days } }),
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat:                (messages, language) => api.post('/ai/chat', { messages, language }),
  analyzeHealth:       (healthData) => api.post('/ai/analyze', { healthData }),
  predictRisk:         ()           => api.post('/ai/predict-risk'),
  getSuggestions:      ()           => api.get('/ai/suggestions'),
  analyzePrescription: (prescriptionId) => api.post('/ai/analyze-prescription', { prescriptionId }),
  medicationResearch:  (query) => api.post('/ai/medication-research', { query }),
}

// ─── Medications ──────────────────────────────────────────────────────────────
export const medicationAPI = {
  getAll:    () => api.get('/medications'),
  add:       (data) => api.post('/medications', data),
  update:    (id, data) => api.put(`/medications/${id}`, data),
  delete:    (id) => api.delete(`/medications/${id}`),
  markTaken: (id, dose) => api.post(`/medications/${id}/taken`, { dose }),
  getToday:  () => api.get('/medications/today'),
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentAPI = {
  book:        (data) => api.post('/appointments', data),
  getAll:      (params) => api.get('/appointments', { params }),
  getById:     (id) => api.get(`/appointments/${id}`),
  cancel:      (id, reason) => api.patch(`/appointments/${id}/cancel`, { reason }),
  reschedule:  (id, data) => api.patch(`/appointments/${id}/reschedule`, data),
  confirm:     (id) => api.patch(`/appointments/${id}/confirm`),
  markArrived: (id) => api.patch(`/appointments/${id}/arrive`),
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportAPI = {
  upload:  (formData) => api.post('/reports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll:  () => api.get('/reports'),
  getById: (id) => api.get(`/reports/${id}`),
  delete:  (id) => api.delete(`/reports/${id}`),
  share:   (id, doctorId) => api.post(`/reports/${id}/share`, { doctorId }),
}

// ─── Doctor ───────────────────────────────────────────────────────────────────
export const doctorAPI = {
  getStats:           () => api.get('/doctors/stats'),
  getPatients:        () => api.get('/doctors/patients'),
  getPatient:         (id) => api.get(`/doctors/patients/${id}`),
  addPrescription:    (patientId, data) => api.post('/doctors/prescriptions', { patientId, ...data }),
  getPrescriptions:   (patientId) => api.get(`/doctors/prescriptions/${patientId}`),
  getAllPrescriptions: () => api.get('/doctors/all-prescriptions'),
  getAppointments:    () => api.get('/doctors/appointments'),
  addNote:            (patientId, note) => api.post('/doctors/notes', { patientId, note }),
  updateProfile:      (data) => api.put('/doctors/profile', data),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:          () => api.get('/admin/stats'),
  getUsers:          (params) => api.get('/admin/users', { params }),
  updateUser:        (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser:        (id) => api.delete(`/admin/users/${id}`),
  getPendingDoctors: () => api.get('/admin/doctors/pending'),
  approveDoctor:     (id) => api.patch(`/admin/doctors/${id}/approve`),
  rejectDoctor:      (id) => api.patch(`/admin/doctors/${id}/reject`),
  getLogs:           () => api.get('/admin/logs'),
    assignPatientToDoctor: (patientId, doctorId) =>
    api.patch(`/admin/patients/${patientId}/assign-doctor`, { doctorId }),
}

// ─── Messages / Chat ──────────────────────────────────────────────────────────
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages:      (userId) => api.get(`/chat/messages/${userId}`),
  sendMessage:      (data) => api.post('/chat/messages', data),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:      () => api.get('/notifications'),
  markRead:    (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete:      (id) => api.delete(`/notifications/${id}`),
}

// ─── Emergency ────────────────────────────────────────────────────────────────
export const emergencyAPI = {
  sendSOS:    (data) => api.post('/emergency/sos', data),
  getContacts: () => api.get('/emergency/contacts'),
  addContact:  (data) => api.post('/emergency/contacts', data),
}

export default api