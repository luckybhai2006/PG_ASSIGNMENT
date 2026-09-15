const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  registerOwner: (body) => request('/auth/register-owner', { method: 'POST', body: JSON.stringify(body) }),
  registerTenant: (body) => request('/auth/register-tenant', { method: 'POST', body: JSON.stringify(body) }),
  getPublicPGs: () => request('/auth/pgs'),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),


  // PG
  getPG: () => request('/pg'),
  updatePGProfile: (body) => request('/pg/profile', { method: 'PUT', body: JSON.stringify(body) }),
  addNotice: (body) => request('/pg/notices', { method: 'POST', body: JSON.stringify(body) }),
  deleteNotice: (noticeId) => request(`/pg/notices/${noticeId}`, { method: 'DELETE' }),

  // Staff (Owner & Editor)
  inviteEditor: (body) => request('/staff/invite', { method: 'POST', body: JSON.stringify(body) }),
  getStaff: () => request('/staff'),
  acceptInvite: () => request('/staff/accept-invite', { method: 'PUT' }),

  // Tenants
  addTenant: (body) => request('/tenants', { method: 'POST', body: JSON.stringify(body) }),
  getTenants: (search = '') => request(`/tenants${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  // Complaints
  getComplaints: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`/complaints${qs ? `?${qs}` : ''}`);
  },
  createComplaint: (body) => request('/complaints', { method: 'POST', body: JSON.stringify(body) }),
  getComplaintById: (id) => request(`/complaints/${id}`),
  updateComplaintStatus: (id, body) => request(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  getStats: () => request('/complaints/stats'),
};
