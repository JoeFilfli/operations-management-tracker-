import axios from 'axios'

// Empty string → relative /api (dev Vite proxy). Set VITE_API_BASE_URL in
// production to your backend origin, e.g. https://opstrack-backend.railway.app
const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const client = axios.create({ baseURL: `${BASE}/api` })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
let queue = []

const processQueue = (err, token = null) => {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)))
  queue = []
}

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config
    if (err.response?.status !== 401 || orig._retry) return Promise.reject(err)

    if (refreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject }))
        .then((token) => {
          orig.headers.Authorization = `Bearer ${token}`
          return client(orig)
        })
        .catch(Promise.reject.bind(Promise))
    }

    orig._retry = true
    refreshing = true
    const refresh = localStorage.getItem('refresh_token')

    if (!refresh) {
      refreshing = false
      localStorage.clear()
      window.location.replace('/login')
      return Promise.reject(err)
    }

    try {
      const { data } = await axios.post(`${BASE}/api/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refresh}` },
      })
      localStorage.setItem('access_token', data.access_token)
      processQueue(null, data.access_token)
      orig.headers.Authorization = `Bearer ${data.access_token}`
      return client(orig)
    } catch (e) {
      processQueue(e, null)
      localStorage.clear()
      window.location.replace('/login')
      return Promise.reject(e)
    } finally {
      refreshing = false
    }
  },
)

export default client
