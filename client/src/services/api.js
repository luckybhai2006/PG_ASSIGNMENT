const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;
export const SOCKET_URL = API_URL.replace(/\/api$/, '');

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// Global in-flight request deduplication map to prevent duplicate parallel network hits
const inFlightGetRequests = new Map();

async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const token = getToken();

  // Deduplicate concurrent in-flight GET requests across the entire application
  if (method === 'GET') {
    const dedupeKey = `${endpoint}__${token || ''}`;
    if (inFlightGetRequests.has(dedupeKey)) {
      return inFlightGetRequests.get(dedupeKey);
    }

    const promise = (async () => {
      try {
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
      } finally {
        inFlightGetRequests.delete(dedupeKey);
      }
    })();

    inFlightGetRequests.set(dedupeKey, promise);
    return promise;
  }

  // Non-GET requests (POST, PUT, DELETE, PATCH)
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
  getPublicPGs: (pgType = '') => request(`/auth/pgs${pgType ? `?pgType=${encodeURIComponent(pgType)}` : ''}`),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  switchActivePG: (body) => request('/auth/switch-pg', { method: 'POST', body: JSON.stringify(body) }),

  // PG
  getPG: () => request('/pg'),
  updatePGProfile: (body) => request('/pg/profile', { method: 'PUT', body: JSON.stringify(body) }),
  regenerateJoinCode: () => request('/pg/regenerate-join-code', { method: 'POST' }),
  addNotice: (body) => request('/pg/notices', { method: 'POST', body: JSON.stringify(body) }),
  deleteNotice: (noticeId) => request(`/pg/notices/${noticeId}`, { method: 'DELETE' }),
  createPGBranch: (body) => request('/pg/branch', { method: 'POST', body: JSON.stringify(body) }),
  getBranches: () => request('/pg/branches'),

  // Rooms (Hub & Allocation)
  getRooms: () => request('/pg/rooms'),
  generateRooms: (body) => request('/pg/rooms/generate', { method: 'POST', body: JSON.stringify(body) }),
  addRoom: (body) => request('/pg/rooms', { method: 'POST', body: JSON.stringify(body) }),
  updateRoom: (roomId, body) => request(`/pg/rooms/${roomId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRoom: (roomId) => request(`/pg/rooms/${roomId}`, { method: 'DELETE' }),
  renameBlock: (body) => request('/pg/rooms/rename-block', { method: 'POST', body: JSON.stringify(body) }),
  toggleRoomMaintenance: (roomId, body) => request(`/pg/rooms/${roomId}/maintenance`, { method: 'PUT', body: JSON.stringify(body) }),

  // Staff (Owner & Editor)
  inviteEditor: (body) => request('/staff/invite', { method: 'POST', body: JSON.stringify(body) }),
  getStaff: (pgId = '') => request(`/staff${pgId ? `?pgId=${encodeURIComponent(pgId)}` : ''}`),
  updateStaffPermissions: (id, body) => request(`/staff/${id}/permissions`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStaff: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
  acceptInvite: () => request('/staff/accept-invite', { method: 'PUT' }),

  // Tenants
  addTenant: (body) => request('/tenants', { method: 'POST', body: JSON.stringify(body) }),
  getTenants: (search = '') => request(`/tenants${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  approveTenant: (id, body = {}) => request(`/tenants/${id}/approve`, { method: 'PUT', body: JSON.stringify(body) }),
  rejectTenant: (id) => request(`/tenants/${id}/reject`, { method: 'PUT' }),
  changeTenantRoom: (id, roomNumber) => request(`/tenants/${id}/room`, { method: 'PUT', body: JSON.stringify({ roomNumber }) }),
  vacateTenant: (id, body = {}) => request(`/tenants/${id}/vacate`, { method: 'PUT', body: JSON.stringify(body) }),
  transferTenantBranch: (id, targetPgId) => request(`/tenants/${id}/transfer`, { method: 'PUT', body: JSON.stringify({ targetPgId }) }),

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

  // Team Hub (Chat & Task Ecosystem)
  getTeamMessages: (params = {}) => {
    const qs = typeof params === 'string' ? (params ? `pgId=${params}` : '') : new URLSearchParams(params).toString();
    return request(`/team-hub/messages${qs ? `?${qs}` : ''}`);
  },
  sendTeamMessage: (body) => request('/team-hub/messages', { method: 'POST', body: JSON.stringify(body) }),
  getTeamTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/team-hub/tasks${qs ? `?${qs}` : ''}`);
  },
  createTeamTask: (body) => request('/team-hub/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTeamTaskStatus: (id, body) => request(`/team-hub/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
};
