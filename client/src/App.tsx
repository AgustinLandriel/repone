import { useMediaQuery } from './hooks/useMediaQuery'
import { MobileApp } from './mobile/MobileApp'
import { DesktopApp } from './desktop/DesktopApp'

export default function App() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return <div className="h-screen w-screen overflow-hidden">{isDesktop ? <DesktopApp /> : <MobileApp />}</div>
}
