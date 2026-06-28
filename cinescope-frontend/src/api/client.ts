import axios from "axios";

const inferCountryFromLocale = () => {
  const locale = navigator.language || Intl.DateTimeFormat().resolvedOptions().locale || "";
  const country = locale.split("-")[1];
  if (country) return country.toUpperCase();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone === "Asia/Kolkata" || timezone === "Asia/Calcutta") return "IN";
  return undefined;
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
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
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
    if (config.headers) {
      const locale = navigator.language || Intl.DateTimeFormat().resolvedOptions().locale;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      config.headers["X-CineScope-Timezone"] = timezone;
      config.headers["X-CineScope-Language"] = locale;
      const country = inferCountryFromLocale();
      if (country) config.headers["X-CineScope-Country"] = country;
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
