import { Route, Routes, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppShell from './layouts/AppShell'
import LoginPage from './pages/LoginPage'
import SplashScreen from './components/SplashScreen'
import GlobalWallpaper from './components/GlobalWallpaper'
import { useAuth } from './contexts/AuthContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const NotesPage = lazy(() => import('./pages/NotesPage'))
const SolarTermsPage = lazy(() => import('./pages/SolarTermsPage'))
const ClockPage = lazy(() => import('./pages/ClockPage'))
const PomodoroPage = lazy(() => import('./pages/PomodoroPage'))
const WallpaperPage = lazy(() => import('./pages/WallpaperPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function Fallback() {
  return <div className="grid h-full place-items-center text-fg/60">加载中…</div>
}

// 仅对需要账户数据同步的功能加登录守卫
function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return <Fallback />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <SplashScreen />
      {/* 全局墙纸：存在时作为整个 App 背景，删除自动消失 */}
      <GlobalWallpaper />
      <div className="bg-aurora" aria-hidden>
        <div className="blob blob-3" />
      </div>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* 主框架对所有访客开放；数据相关页单独守卫 */}
          <Route path="/" element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="notes" element={<RequireAuth><NotesPage /></RequireAuth>} />
            <Route path="solar-terms" element={<SolarTermsPage />} />
            <Route path="clock" element={<ClockPage />} />
            <Route path="pomodoro" element={<PomodoroPage />} />
            <Route path="wallpaper" element={<WallpaperPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
