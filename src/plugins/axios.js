import axios from 'axios'
import { useUserStore } from '../stores/user'
import router from '@/router'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL
})

api.interceptors.request.use((config) => {
  const store = useUserStore()
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response ? error.response.status : null

    if (status === 401) {
      const store = useUserStore()
      store.logout()

      if (router.currentRoute.value.name !== 'LoginArea') {
        await router.push({ name: 'LoginArea' })
      }
    }

    return Promise.reject(error)
  }
)

export default api
