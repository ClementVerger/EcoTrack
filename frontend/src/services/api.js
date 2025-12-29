import axios from "axios";
import { getEnv } from "../utils/env.js";

// Handle environment variables for both Vite and Jest
const baseURL =
  getEnv("VITE_REACT_APP_API_BASE_URL") ||
  getEnv("VITE_API_BASE_URL") ||
  "http://localhost:3000";
const timeout = Number(getEnv("VITE_API_TIMEOUT", "5000"));

const api = axios.create({
  baseURL,
  timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

let logoutHandler = null;

export function setLogoutHandler(fn) {
  logoutHandler = fn;
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function setDefaultHeader(name, value) {
  if (value == null) {
    delete api.defaults.headers.common[name];
  } else {
    api.defaults.headers.common[name] = value;
  }
}

export function logout() {
  localStorage.removeItem("token");
  delete api.defaults.headers.common["Authorization"];
  if (typeof logoutHandler === "function") {
    logoutHandler();
  } else {
    window.dispatchEvent(new Event("logout"));
  }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      if (typeof logoutHandler === "function") {
        logoutHandler();
      } else {
        window.dispatchEvent(new Event("logout"));
      }
    }
    return Promise.reject(err);
  },
);

export default api;
