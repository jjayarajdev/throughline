// hooks/useLogout.ts
'use client'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useUserStore } from '@/store/userStore'

export function useLogout() {
  const clearUser = useUserStore((state) => state.clearUser)
  const router = useRouter()

  const logout = () => {
    // Clear cookies
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'roles=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    // Clear axios header
    delete axios.defaults.headers.common['Authorization']
    // Clear Zustand store
    clearUser()
    // Redirect to login page
    router.push('/')
  }

  return logout
}