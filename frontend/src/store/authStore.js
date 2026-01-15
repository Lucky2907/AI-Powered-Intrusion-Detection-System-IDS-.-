import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        try {
          const response = await api.post('/auth/login', credentials)
          const { token, user } = response.data
          
          set({
            user,
            token,
            isAuthenticated: true
          })
          
          // Set token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.message || 'Login failed'
          }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
        
        delete api.defaults.headers.common['Authorization']
      },

      setToken: (token) => {
        set({ token })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)
