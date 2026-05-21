import axios from 'axios'

// If VITE_API_BASE_URL is set (production), use it directly.
// In local dev it's empty — Vite proxy forwards /api → localhost:5000
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE,
  timeout: 15000
})

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bl_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global response error handling
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bl_token')
      localStorage.removeItem('bl_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
