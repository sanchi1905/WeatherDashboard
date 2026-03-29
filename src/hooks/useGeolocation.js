import { useEffect, useState } from 'react'

const FALLBACK = {
  latitude: 28.6139,
  longitude: 77.209,
  city: 'New Delhi (Fallback)',
}

export function useGeolocation() {
  const geolocationSupported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation)

  const [location, setLocation] = useState(
    geolocationSupported
      ? {
          latitude: null,
          longitude: null,
          city: '',
        }
      : FALLBACK,
  )
  const [status, setStatus] = useState(geolocationSupported ? 'loading' : 'ready')
  const [error, setError] = useState(
    geolocationSupported ? '' : 'Geolocation is not supported. Using fallback location.',
  )

  useEffect(() => {
    if (!geolocationSupported) {
      return
    }

    const onSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        city: 'Detected location',
      })
      setStatus('ready')
    }

    const onError = () => {
      setLocation(FALLBACK)
      setStatus('ready')
      setError('Location permission denied. Showing fallback weather for New Delhi.')
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 120000,
    })
  }, [geolocationSupported])

  return { location, status, error }
}
