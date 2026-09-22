import axios from "axios";

// npm install axios

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/backend";

const api = axios.create({ baseURL: API_BASE_URL });

// Attach the current access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request comes back 401 (access token expired), try refreshing once
// and retry the original request. If the refresh itself fails, log out.
let isRefreshing = false;
let pendingRequests = [];

function onRefreshed(newToken) {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status !== 401 || config._retried) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    config._retried = true;

    if (isRefreshing) {
      // Another request already triggered a refresh — wait for it instead
      // of firing a second refresh call.
      return new Promise((resolve) => {
        pendingRequests.push((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(config));
        });
      });
    }

    isRefreshing = true;
    try {
      const res = await axios.post(`${API_BASE_URL}/token/refresh/`, {
        refresh: refreshToken,
      });
      const newAccessToken = res.data.access;
      localStorage.setItem("access_token", newAccessToken);
      onRefreshed(newAccessToken);
      config.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(config);
    } catch (refreshError) {
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export async function login(username, password) {
  const res = await axios.post(`${API_BASE_URL}/token/`, { username, password });
  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem("access_token"));
}

export default api;
