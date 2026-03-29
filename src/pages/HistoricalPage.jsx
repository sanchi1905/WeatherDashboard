import { useEffect, useMemo, useState } from 'react'
import { WeatherChartCard } from '../components/charts/WeatherChartCard'
import { fetchHistoricalRange } from '../services/openMeteo'
import {
  daysBetween,
  decimalHoursToTime,
  formatISODate,
  numericTimeInHours,
  todayISO,
} from '../utils/date'

const DEFAULT_START_DATE = formatISODate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30))

function aggregateDailyAirQuality(hourly) {
  const buckets = {}

  hourly.time.forEach((timestamp, index) => {
    const dateKey = timestamp.slice(0, 10)
    if (!buckets[dateKey]) {
      buckets[dateKey] = { pm10Total: 0, pm2Total: 0, count: 0 }
    }

    buckets[dateKey].pm10Total += hourly.pm10[index] ?? 0
    buckets[dateKey].pm2Total += hourly.pm2_5[index] ?? 0
    buckets[dateKey].count += 1
  })

  const result = {}
  Object.keys(buckets).forEach((dateKey) => {
    const item = buckets[dateKey]
    result[dateKey] = {
      pm10: item.count ? item.pm10Total / item.count : null,
      pm2_5: item.count ? item.pm2Total / item.count : null,
    }
  })

  return result
}

export function HistoricalPage({ location }) {
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE)
  const [endDate, setEndDate] = useState(todayISO())
  const [state, setState] = useState({ loading: true, error: '', payload: null, key: '' })
  const queryKey = `${location?.latitude}|${location?.longitude}|${startDate}|${endDate}`

  const dateError = useMemo(() => {
    if (!startDate || !endDate) return 'Please choose both start and end dates.'
    if (startDate > endDate) return 'Start date cannot be later than end date.'
    if (daysBetween(startDate, endDate) > 730) return 'Date range cannot exceed 2 years (730 days).'
    return ''
  }, [startDate, endDate])

  useEffect(() => {
    if (!location?.latitude || !location?.longitude || dateError) return

    let alive = true
    fetchHistoricalRange({
      latitude: location.latitude,
      longitude: location.longitude,
      startDate,
      endDate,
    })
      .then((payload) => {
        if (!alive) return
        setState({ loading: false, error: '', payload, key: queryKey })
      })
      .catch((error) => {
        if (!alive) return
        setState({ loading: false, error: error.message, payload: null, key: queryKey })
      })

    return () => {
      alive = false
    }
  }, [location?.latitude, location?.longitude, startDate, endDate, dateError, queryKey])

  const chartData = useMemo(() => {
    const weatherDaily = state.payload?.weather?.daily
    const airHourly = state.payload?.air?.hourly

    if (!weatherDaily || !airHourly) return []

    const dailyAir = aggregateDailyAirQuality(airHourly)

    return weatherDaily.time.map((dateLabel, index) => ({
      label: dateLabel,
      tempMean: weatherDaily.temperature_2m_mean[index],
      tempMin: weatherDaily.temperature_2m_min[index],
      tempMax: weatherDaily.temperature_2m_max[index],
      sunriseHour: numericTimeInHours(weatherDaily.sunrise[index]),
      sunsetHour: numericTimeInHours(weatherDaily.sunset[index]),
      precipitationTotal: weatherDaily.precipitation_sum[index],
      windSpeedMax: weatherDaily.wind_speed_10m_max[index],
      windDirectionDominant: weatherDaily.wind_direction_10m_dominant[index],
      pm10: dailyAir[dateLabel]?.pm10 ?? null,
      pm2_5: dailyAir[dateLabel]?.pm2_5 ?? null,
    }))
  }, [state.payload])

  return (
    <main className="page-shell">
      <section className="toolbar">
        <div className="field-group">
          <label htmlFor="history-start">Start date</label>
          <input
            id="history-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="history-end">End date</label>
          <input
            id="history-end"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
      </section>

      {dateError ? <p className="state-message error">{dateError}</p> : null}
      {(state.loading || state.key !== queryKey) && !dateError ? <p className="state-message">Loading historical weather data...</p> : null}
      {state.error ? <p className="state-message error">Unable to load historical data: {state.error}</p> : null}

      {!state.loading && state.key === queryKey && !state.error && !dateError && chartData.length > 0 ? (
        <section className="charts-stack">
          <WeatherChartCard
            title="Temperature Trends (Mean, Max, Min)"
            data={chartData}
            yAxisLabel="°C"
            lines={[
              { key: 'tempMean', name: 'Mean', color: '#e76f51' },
              { key: 'tempMax', name: 'Max', color: '#f4a261' },
              { key: 'tempMin', name: 'Min', color: '#457b9d' },
            ]}
          />

          <WeatherChartCard
            title="Sun Cycle in IST (Sunrise and Sunset)"
            data={chartData.map((item) => ({
              ...item,
              sunriseHour: Number(item.sunriseHour.toFixed(2)),
              sunsetHour: Number(item.sunsetHour.toFixed(2)),
              sunriseLabel: decimalHoursToTime(item.sunriseHour),
              sunsetLabel: decimalHoursToTime(item.sunsetHour),
            }))}
            yAxisLabel="Hour (IST)"
            lines={[
              { key: 'sunriseHour', name: 'Sunrise', color: '#ffd166' },
              { key: 'sunsetHour', name: 'Sunset', color: '#fb8500' },
            ]}
          />

          <WeatherChartCard
            title="Precipitation Totals"
            data={chartData}
            yAxisLabel="mm"
            bars={[{ key: 'precipitationTotal', name: 'Total Precipitation', color: '#2a9d8f' }]}
          />

          <WeatherChartCard
            title="Wind Trends (Max Speed and Dominant Direction)"
            data={chartData}
            yAxisLabel="Mixed"
            lines={[
              { key: 'windSpeedMax', name: 'Max Wind Speed (km/h)', color: '#264653' },
              { key: 'windDirectionDominant', name: 'Dominant Direction (deg)', color: '#6c757d' },
            ]}
          />

          <WeatherChartCard
            title="Air Quality Trends (PM10 and PM2.5)"
            data={chartData}
            yAxisLabel="ug/m3"
            lines={[
              { key: 'pm10', name: 'PM10', color: '#5e548e' },
              { key: 'pm2_5', name: 'PM2.5', color: '#9f86c0' },
            ]}
          />
        </section>
      ) : null}
    </main>
  )
}
