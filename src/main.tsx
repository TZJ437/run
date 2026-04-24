import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { PomodoroProvider } from './contexts/PomodoroContext'
import { WallpaperProvider } from './contexts/WallpaperContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <WallpaperProvider>
              <PomodoroProvider>
                <App />
              </PomodoroProvider>
            </WallpaperProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>,
)
