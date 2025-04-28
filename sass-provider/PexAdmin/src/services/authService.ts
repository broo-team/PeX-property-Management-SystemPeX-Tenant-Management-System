// src/services/authService.js (or similar file)
import axios from 'axios';

// Create an Axios instance with a base URL
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000', // Set your backend API base URL here
  // You might have other default headers here
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
// This interceptor will run before every request made by this instance
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the token from local storage
    const token = localStorage.getItem('token');

    // If a token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Return the modified config
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// You can also add response interceptors here to handle things like
// automatically logging out the user if a 401 Unauthorized response is received.
/*
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized responses, e.g., redirect to login
            console.log('Unauthorized request, redirecting to login...');
            // Example: localStorage.removeItem('token');
            // Example: window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
*/


export default axiosInstance;
