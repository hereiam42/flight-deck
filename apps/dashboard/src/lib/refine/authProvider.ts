import type { AuthProvider } from '@refinedev/core'
import { supabaseClient } from './supabaseClient'

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error }
    return { success: true, redirectTo: '/dashboard' }
  },

  logout: async () => {
    await supabaseClient.auth.signOut()
    return { success: true, redirectTo: '/auth/login' }
  },

  check: async () => {
    const { data } = await supabaseClient.auth.getSession()
    if (data?.session) return { authenticated: true }
    return { authenticated: false, redirectTo: '/auth/login' }
  },

  getIdentity: async () => {
    const { data } = await supabaseClient.auth.getUser()
    if (!data?.user) return null
    return {
      id: data.user.id,
      email: data.user.email,
    }
  },

  onError: async (error) => {
    if (error?.status === 401 || error?.status === 403) {
      return { logout: true, redirectTo: '/auth/login' }
    }
    return { error }
  },
}
