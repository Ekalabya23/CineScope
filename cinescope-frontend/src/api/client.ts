import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://cinescope-50ap.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios Request Interceptor: Automatically injects bearer token from localStorage mid-flight
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Axios Response Interceptor: Catches session expirations globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear compromised or dead tokens and force re-authentication
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
