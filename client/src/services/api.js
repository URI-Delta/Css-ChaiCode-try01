import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  timeout: 30_000,
});

let refreshPromise = null;

function isAuthPath(url) {
  return /\/auth\/(me|login|register|refresh|logout|forgot-password|reset-password|verify-email)/.test(url);
}

/** Auto-refresh once on 401/403-session expiry, then retry the original request. */
function attachAuthFlow(client) {
  client.interceptors.response.use(
    (resp) => resp,
    async (error) => {
      const config = error.config;
      const status = error.response?.status;
      const code = error.response?.data?.error?.code;
      const isUnauthorized = status === 401 || (status === 403 && code === 'UNAUTHORIZED');

      if (isUnauthorized && config && !config._retried && !isAuthPath(config.url)) {
        config._retried = true;
        refreshPromise ??= client.post('/api/v1/auth/refresh').finally(() => {
          refreshPromise = null;
        });
        try {
          await refreshPromise;
          return client(config);
        } catch {
          // refresh failed — session is gone; let the route guard handle it
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    }
  );
}

attachAuthFlow(api);

export const errMessage = (err) => {
  const data = err?.response?.data;
  if (data?.error?.details && Array.isArray(data.error.details) && data.error.details.length) {
    return data.error.details.map((d) => d.message).join(' · ');
  }
  return data?.error?.message || err.message || 'Something went wrong';
};

export default api;
