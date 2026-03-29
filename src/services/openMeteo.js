import { daysBetween } from '../utils/date'

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'
const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive'
const AIR_QUALITY_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality'

async function requestJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return response.json()
}

export async function fetchCurrentAndHourly({ latitude, longitude, date }) {
  const weatherParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: 'auto',
    start_date: date,
    end_date: date,
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
    hourly:
      'temperature_2m,relative_humidity_2m,precipitation,visibility,wind_speed_10m,precipitation_probability',
    daily:
      'temperature_2m_min,temperature_2m_max,sunrise,sunset,uv_index_max,wind_speed_10m_max,precipitation_probability_max',
  })

  const airParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: 'auto',
    start_date: date,
    end_date: date,
    hourly:
      'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide',
  })

  const [weather, air] = await Promise.all([
    requestJson(`${FORECAST_BASE}?${weatherParams.toString()}`),
    requestJson(`${AIR_QUALITY_BASE}?${airParams.toString()}`),
  ])

  return { weather, air }
}

export async function fetchHistoricalRange({ latitude, longitude, startDate, endDate }) {
  const rangeDays = daysBetween(startDate, endDate)
  if (rangeDays > 730) {
    throw new Error('Date range must not exceed 2 years (730 days).')
  }

  const weatherParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: 'Asia/Kolkata',
    start_date: startDate,
    end_date: endDate,
    daily:
      'temperature_2m_mean,temperature_2m_min,temperature_2m_max,sunrise,sunset,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant',
  })

  const airParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: 'Asia/Kolkata',
    start_date: startDate,
    end_date: endDate,
    hourly: 'pm10,pm2_5',
  })

  const [weather, air] = await Promise.all([
    requestJson(`${ARCHIVE_BASE}?${weatherParams.toString()}`),
    requestJson(`${AIR_QUALITY_BASE}?${airParams.toString()}`),
  ])

  return { weather, air }
}
