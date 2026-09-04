import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000/api' 
  : `http://${window.location.hostname}:8000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('auth/token/') && !error.config.url.includes('auth/register/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Public Citizen Submissions (anonymous)
  submitCitizenRequest: async (formData) => {
    return api.post('/submit-request/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Auth
  login: async (username, password) => {
    const response = await api.post('/auth/token/', { username, password });
    if (response.data && response.data.access) {
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  registerCitizen: async (citizenData) => {
    // citizenData: { username, password, email, first_name, last_name, phone }
    return api.post('/auth/register/', citizenData);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Public Homepage Metrics & Budgets
  getPublicMetrics: async () => {
    return api.get('/public-metrics/');
  },

  getBudgets: async () => {
    return api.get('/budgets/');
  },

  // Dashboard Metrics (MLA / Staff)
  getDashboardMetrics: async (assignedOnly = false) => {
    return api.get(`/metrics/?assigned_only=${assignedOnly}`);
  },

  // Requests API (MLA, Staff, and Citizens)
  getRequests: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/requests/?${params.toString()}`);
    return response.data;
  },

  getRequestDetail: async (id) => {
    const response = await api.get(`/requests/${id}/`);
    return response.data;
  },

  updateRequest: async (id, updatedData) => {
    const response = await api.patch(`/requests/${id}/`, updatedData);
    return response.data;
  },

  updateRequestStatus: async (id, status) => {
    const response = await api.patch(`/requests/${id}/`, { status });
    return response.data;
  },

  assignRequest: async (requestId, staffId) => {
    const response = await api.patch(`/requests/${requestId}/`, { assigned_staff: staffId });
    return response.data;
  },

  deleteRequest: async (id) => {
    const response = await api.delete(`/requests/${id}/`);
    return response.data;
  },

  // Comments
  addComment: async (requestId, text) => {
    const user = apiService.getCurrentUser();
    const response = await api.post('/comments/', {
      request: requestId,
      text: text,
      user: user ? user.id : null
    });
    return response.data;
  },

  // Staff Management (MLA only)
  getStaffList: async () => {
    const response = await api.get('/staff/');
    return response.data;
  },

  createStaff: async (staffData) => {
    const response = await api.post('/staff/', {
      ...staffData,
      profile: {
        role: 'STAFF'
      }
    });
    return response.data;
  },

  // Appointments Slots APIs
  getAppointmentSlots: async () => {
    const response = await api.get('/appointment-slots/');
    return response.data;
  },

  createAppointmentSlot: async (slotData) => {
    return api.post('/appointment-slots/', slotData);
  },

  generateDefaultSlots: async (days) => {
    return api.post('/appointment-slots/generate_defaults/', { days });
  },

  cancelAppointmentSlot: async (slotId) => {
    return api.post(`/appointment-slots/${slotId}/cancel_slot/`);
  },

  // Appointments Booking APIs
  getAppointments: async () => {
    const response = await api.get('/appointments/');
    return response.data;
  },

  bookAppointment: async (bookingData) => {
    // bookingData: { slot, citizen_name, citizen_phone, topic }
    const response = await api.post('/appointments/', bookingData);
    return response.data;
  },

  rescheduleAppointment: async (appointmentId, newSlotId, notes = '') => {
    const response = await api.post(`/appointments/${appointmentId}/reschedule_appointment/`, {
      new_slot: newSlotId,
      notes: notes
    });
    return response.data;
  },

  cancelAppointment: async (appointmentId) => {
    const response = await api.patch(`/appointments/${appointmentId}/`, {
      status: 'CANCELLED',
      notes: 'Cancelled by user.'
    });
    return response.data;
  }
};

export default apiService;
