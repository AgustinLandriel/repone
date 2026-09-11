import { useEffect, useState } from 'react'
import { useMediaQuery } from './hooks/useMediaQuery'
import { MobileApp } from './mobile/MobileApp'
import { DesktopApp } from './desktop/DesktopApp'
import { LoginScreen } from './mobile/screens/LoginScreen'
import { getCurrentUser, logout, type AuthUser } from './api'

export default function App() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [checkingSession, setCheckingSession] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    getCurrentUser()
      .then((restored) => setUser(restored))
      .finally(() => setCheckingSession(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      {checkingSession ? (
        <div className="h-full w-full bg-[#111214]" />
      ) : !user ? (
        <LoginScreen onLogin={setUser} />
      ) : isDesktop ? (
        <DesktopApp user={user} onLogout={handleLogout} />
      ) : (
        <MobileApp user={user} onLogout={handleLogout} />
      )}
    </div>
  )
}
