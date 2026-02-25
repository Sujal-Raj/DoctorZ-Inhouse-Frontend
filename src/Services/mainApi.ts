import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
