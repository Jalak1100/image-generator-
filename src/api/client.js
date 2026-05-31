import axios from 'axios'

const API_BASE = 'https://image-generator-bzub.onrender.com/api'

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token to requests
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const authAPI = {
  register: (email, password) =>
    client.post('/auth/register', { email, password }),
  login: (email, password) =>
    client.post('/auth/login', { email, password }),
}

export const imageAPI = {
  generateImage: (prompt, style) =>
    client.post('/images/generate', { prompt, style }),
  getMyImages: () =>
    client.get('/images/my-images'),
  deleteImage: (id) =>
    client.delete(`/images/${id}`),
}

export default client
