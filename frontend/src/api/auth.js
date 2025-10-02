import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/auth'; // Adjust if your backend runs on a different port

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });
    return response.data; // { accessToken, refreshToken }
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const register = async (username, email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, {
      username,
      email,
      password,
    });
    return response.data; // { accessToken, refreshToken }
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCurrentUser = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logout = async (token) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
