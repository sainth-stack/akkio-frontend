import axios from 'axios';
import { akkiourl } from './const';

const api = axios.create({
  baseURL: akkiourl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('email');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export function getAccessToken() {
  return localStorage.getItem('access_token');
}

export function authHeaders(extra = {}) {
  const token = getAccessToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function wsUrl(path) {
  const token = getAccessToken();
  const wsBase = akkiourl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
  if (!token) return `${wsBase}${path}`;
  const sep = path.includes('?') ? '&' : '?';
  return `${wsBase}${path}${sep}token=${encodeURIComponent(token)}`;
}

/** Merge token into WebSocket first message payload */
export function wsAuthPayload(payload = {}) {
  const token = getAccessToken();
  return token ? { ...payload, token } : payload;
}

/** Authenticated fetch for streaming endpoints (planning NDJSON) */
export async function apiFetch(path, options = {}) {
  const headers = authHeaders(options.headers || {});
  const res = await fetch(`${akkiourl}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}

export async function refreshCurrentUser() {
  const res = await api.get('/auth/me');
  localStorage.setItem('user', JSON.stringify(res.data));
  if (res.data?.email) {
    localStorage.setItem('email', res.data.email);
  }
  return res.data;
}
