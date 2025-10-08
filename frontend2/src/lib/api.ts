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
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
export async function logout() {
  try {
    await API.post("/api/logout");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.reload();
  } catch (err) {
    console.error("Logout failed", err);
  }
}
