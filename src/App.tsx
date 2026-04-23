import { Route, Routes, Navigate } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import HomePage from './pages/HomePage'
import NotesPage from './pages/NotesPage'
import SolarTermsPage from './pages/SolarTermsPage'
import ClockPage from './pages/ClockPage'
import PomodoroPage from './pages/PomodoroPage'
import WallpaperPage from './pages/WallpaperPage'
import LoginPage from './pages/LoginPage'
import { useAuth } from './contexts/AuthContext'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid h-full place-items-center text-fg/60">加载中…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <div className="bg-aurora" aria-hidden>
        <div className="blob blob-3" />
      </div>
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
