import axios from "axios";

export const API = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000", // fallback nếu quên .env
  withCredentials: true,
});
// ✅ Thêm interceptor để tự động gắn token vào header
API.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  // Only attach Authorization if token exists and is not empty
  if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// Response interceptor: if 401, remove token and retry once without Authorization
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      localStorage.getItem("accessToken") &&
      !originalRequest._retry
    ) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      originalRequest._retry = true;
      delete originalRequest.headers.Authorization;
      return API(originalRequest);
    }
    return Promise.reject(error);
  }
);
export async function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}
