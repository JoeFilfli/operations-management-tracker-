import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { me } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = await AsyncStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
      const data = await me()
      setUser(data)
    } catch {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token'])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const signIn = useCallback(async (tokens, userData) => {
    await AsyncStorage.setItem('access_token', tokens.access_token)
    await AsyncStorage.setItem('refresh_token', tokens.refresh_token)
    setUser(userData)
  }, [])

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token'])
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
