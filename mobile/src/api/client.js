import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000'

const client = axios.create({ baseURL: `${BASE_URL}/api` })

// Attach access token from AsyncStorage to every request
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
let queue = []

const processQueue = (err, token = null) => {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)))
  queue = []
}

// On 401: attempt silent refresh, retry original request
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
    const refresh = await AsyncStorage.getItem('refresh_token')

    if (!refresh) {
      refreshing = false
      await AsyncStorage.multiRemove(['access_token', 'refresh_token'])
      return Promise.reject(err)
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refresh}` },
      })
      await AsyncStorage.setItem('access_token', data.access_token)
      processQueue(null, data.access_token)
      orig.headers.Authorization = `Bearer ${data.access_token}`
      return client(orig)
    } catch (e) {
      processQueue(e, null)
      await AsyncStorage.multiRemove(['access_token', 'refresh_token'])
      return Promise.reject(e)
    } finally {
      refreshing = false
    }
  },
)

export default client
