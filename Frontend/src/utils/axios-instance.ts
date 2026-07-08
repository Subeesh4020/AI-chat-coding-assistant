import axios from 'axios';
const BaseUrl = import.meta.env.TUNNEL_URL_API;//VITE_API_URL;

export const publicApi = axios.create({ // Only for public routes
  baseURL: BaseUrl,
  timeout: 30000,
  withCredentials: true,
});