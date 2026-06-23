import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('findit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Retry logic for rate limiting
let retryCount = {};
const MAX_RETRIES = 2;

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('findit_token');
      localStorage.removeItem('findit_user');
      window.location.href = '/login';
    }

    // Handle rate limiting (429)
    if (err.response?.status === 429) {
      const key = err.config.url;
      retryCount[key] = (retryCount[key] || 0) + 1;

      if (retryCount[key] <= MAX_RETRIES) {
        const delay = Math.pow(2, retryCount[key]) * 1000; // Exponential backoff
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(api.request(err.config));
          }, delay);
        });
      }
    }

    return Promise.reject(err);
  }
);

export default api;
