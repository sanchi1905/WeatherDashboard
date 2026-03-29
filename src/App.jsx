import { lazy, Suspense, useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { useGeolocation } from './hooks/useGeolocation'

const CurrentWeatherPage = lazy(() => import('./pages/CurrentWeatherPage').then((module) => ({ default: module.CurrentWeatherPage })))
const HistoricalPage = lazy(() => import('./pages/HistoricalPage').then((module) => ({ default: module.HistoricalPage })))
const THEME_KEY = 'weather-dashboard-theme'

const THEMES = [
  { value: 'aurora', label: 'Aurora Mint' },
  { value: 'sunset', label: 'Sunset Pulse' },
  { value: 'ocean', label: 'Deep Ocean' },
]

function App() {
  const { location, status, error } = useGeolocation()
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'aurora')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  if (status === 'loading') {
    return <p className="state-message">Detecting your location...</p>
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Selection Test Project</p>
          <h1>Weather Dashboard</h1>
          <p className="location-text">
            Lat: {location.latitude?.toFixed(4)}, Lon: {location.longitude?.toFixed(4)}
          </p>
          {error ? <p className="warning-text">{error}</p> : null}
        </div>
        <nav className="main-nav">
          <NavLink to="/" end>
            Current + Hourly
          </NavLink>
          <NavLink to="/historical">Historical Range</NavLink>
        </nav>

        <div className="theme-switcher" role="group" aria-label="Select dashboard theme">
          {THEMES.map((item) => (
            <button
              type="button"
              key={item.value}
              className={theme === item.value ? 'active' : ''}
              onClick={() => setTheme(item.value)}
              aria-pressed={theme === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <Suspense fallback={<p className="state-message">Loading page...</p>}>
        <Routes>
          <Route path="/" element={<CurrentWeatherPage location={location} />} />
          <Route path="/historical" element={<HistoricalPage location={location} />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
