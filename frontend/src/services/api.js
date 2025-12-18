import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 5000;

const api = axios.create({
  baseURL,
  timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export function setDefaultHeader(name, value) {
  if (value == null) {
    delete api.defaults.headers.common[name];
  } else {
    api.defaults.headers.common[name] = value;
  }
}

export default api;