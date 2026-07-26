import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL, withCredentials: true });

let accessToken = null;
let onSessionLost = () => {};

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;
export const setSessionLostHandler = (fn) => { onSessionLost = fn; };

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Single-flight refresh: many parallel 401s trigger one refresh call, then replay.
let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (status === 401 && !original?._retried && !isAuthCall) {
      original._retried = true;
      try {
        refreshing = refreshing || api.post('/auth/refresh').finally(() => { refreshing = null; });
        const { data } = await refreshing;
        setAccessToken(data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        onSessionLost();
      }
    }

    // Normalise every failure into a readable message for the UI.
    error.uiMessage =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the API running?' : 'Something went wrong');
    error.uiDetails = error.response?.data?.details;
    return Promise.reject(error);
  }
);
