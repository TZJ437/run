import { Route, Routes, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppShell from './layouts/AppShell'
import LoginPage from './pages/LoginPage'
import { useAuth } from './contexts/AuthContext'

// 路由懒加载：各页面按需分包，首屏 JS 变小
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

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return <Fallback />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <div className="bg-aurora" aria-hidden>
        <div className="blob blob-3" />
      </div>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="notes" element={<NotesPage />} />
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
