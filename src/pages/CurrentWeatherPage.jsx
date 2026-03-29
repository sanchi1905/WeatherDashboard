import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '../components/StatCard'
import { WeatherChartCard } from '../components/charts/WeatherChartCard'
import { fetchCurrentAndHourly } from '../services/openMeteo'
import { getHourLabel, toFahrenheit, todayISO } from '../utils/date'

function maxValue(values) {
  return values?.length ? Math.max(...values.filter((v) => Number.isFinite(v))) : null
}

function firstValue(values) {
  return values?.[0] ?? null
}

function formatMetric(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'N/A'
}

export function CurrentWeatherPage({ location }) {
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [tempUnit, setTempUnit] = useState('C')
  const [state, setState] = useState({ loading: true, error: '', payload: null, key: '' })
  const queryKey = `${location?.latitude}|${location?.longitude}|${selectedDate}`

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return

    let alive = true

    fetchCurrentAndHourly({
      latitude: location.latitude,
      longitude: location.longitude,
      date: selectedDate,
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
  }, [location?.latitude, location?.longitude, selectedDate, queryKey])

  const prepared = useMemo(() => {
    const weather = state.payload?.weather
    const air = state.payload?.air
    if (!weather || !air) return null

    const hourlyTime = weather.hourly?.time || []

    const hourlyRows = hourlyTime.map((time, index) => {
      const tempC = weather.hourly.temperature_2m[index]
      const temperature = tempUnit === 'C' ? tempC : toFahrenheit(tempC)
      return {
        label: getHourLabel(time),
        temperature,
        humidity: weather.hourly.relative_humidity_2m[index],
        precipitation: weather.hourly.precipitation[index],
        visibility: weather.hourly.visibility[index] / 1000,
        windSpeed: weather.hourly.wind_speed_10m[index],
        pm10: air.hourly.pm10[index],
        pm2_5: air.hourly.pm2_5[index],
      }
    })

    const currentTempRaw = weather.current?.temperature_2m ?? weather.hourly.temperature_2m[0]
    const currentTemp = tempUnit === 'C' ? currentTempRaw : toFahrenheit(currentTempRaw)

    const daily = {
      tempMin: firstValue(weather.daily.temperature_2m_min),
      tempMax: firstValue(weather.daily.temperature_2m_max),
      uvIndex: firstValue(weather.daily.uv_index_max),
      sunrise: firstValue(weather.daily.sunrise),
      sunset: firstValue(weather.daily.sunset),
      windMax: firstValue(weather.daily.wind_speed_10m_max),
      precipProbMax: firstValue(weather.daily.precipitation_probability_max),
    }

    const airStats = {
      aqi: maxValue(air.hourly.us_aqi),
      pm10: maxValue(air.hourly.pm10),
      pm2_5: maxValue(air.hourly.pm2_5),
      co: maxValue(air.hourly.carbon_monoxide),
      no2: maxValue(air.hourly.nitrogen_dioxide),
      so2: maxValue(air.hourly.sulphur_dioxide),
    }

    return {
      currentTemp,
      daily,
      airStats,
      currentHumidity: weather.current?.relative_humidity_2m ?? weather.hourly.relative_humidity_2m[0],
      currentPrecipitation: weather.current?.precipitation ?? weather.hourly.precipitation[0],
      hourlyRows,
    }
  }, [state.payload, tempUnit])

  if (state.loading || state.key !== queryKey) {
    return <p className="state-message">Loading current weather dashboard...</p>
  }

  if (state.error || !prepared) {
    return <p className="state-message error">Unable to load weather data: {state.error || 'Unknown error'}</p>
  }

  return (
    <main className="page-shell">
      <section className="toolbar">
        <div className="field-group">
          <label htmlFor="selected-date">Date</label>
          <input
            id="selected-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
        <div className="toggle-group" role="group" aria-label="Temperature unit">
          <button
            type="button"
            onClick={() => setTempUnit('C')}
            className={tempUnit === 'C' ? 'active' : ''}
          >
            Celsius
          </button>
          <button
            type="button"
            onClick={() => setTempUnit('F')}
            className={tempUnit === 'F' ? 'active' : ''}
          >
            Fahrenheit
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard title="Temperature (Current)" value={formatMetric(prepared.currentTemp, 1)} unit={`°${tempUnit}`} />
        <StatCard title="Temperature (Min)" value={formatMetric(prepared.daily.tempMin, 1)} unit="°C" />
        <StatCard title="Temperature (Max)" value={formatMetric(prepared.daily.tempMax, 1)} unit="°C" />

        <StatCard title="Precipitation" value={formatMetric(prepared.currentPrecipitation, 2)} unit="mm" />
        <StatCard title="Relative Humidity" value={formatMetric(prepared.currentHumidity, 0)} unit="%" />
        <StatCard title="UV Index (Max)" value={formatMetric(prepared.daily.uvIndex, 1)} />

        <StatCard title="Sunrise" value={prepared.daily.sunrise?.slice(11, 16) || '--:--'} />
        <StatCard title="Sunset" value={prepared.daily.sunset?.slice(11, 16) || '--:--'} />

        <StatCard title="Max Wind Speed" value={formatMetric(prepared.daily.windMax, 1)} unit="km/h" />
        <StatCard title="Precip. Probability Max" value={formatMetric(prepared.daily.precipProbMax, 0)} unit="%" />

        <StatCard title="Air Quality Index" value={prepared.airStats.aqi?.toFixed(0) ?? 'N/A'} />
        <StatCard title="PM10" value={prepared.airStats.pm10?.toFixed(2) ?? 'N/A'} unit="ug/m3" />
        <StatCard title="PM2.5" value={prepared.airStats.pm2_5?.toFixed(2) ?? 'N/A'} unit="ug/m3" />
        <StatCard title="Carbon Monoxide (CO)" value={prepared.airStats.co?.toFixed(2) ?? 'N/A'} unit="ug/m3" />
        <StatCard title="Carbon Dioxide (CO2)" value="N/A" note="Not exposed by Open-Meteo API" />
        <StatCard title="Nitrogen Dioxide (NO2)" value={prepared.airStats.no2?.toFixed(2) ?? 'N/A'} unit="ug/m3" />
        <StatCard title="Sulphur Dioxide (SO2)" value={prepared.airStats.so2?.toFixed(2) ?? 'N/A'} unit="ug/m3" />
      </section>

      <section className="charts-stack">
        <WeatherChartCard
          title={`Hourly Temperature (°${tempUnit})`}
          data={prepared.hourlyRows}
          yAxisLabel={`°${tempUnit}`}
          lines={[{ key: 'temperature', name: `Temp (°${tempUnit})`, color: '#ef6f6c' }]}
        />

        <WeatherChartCard
          title="Hourly Relative Humidity (%)"
          data={prepared.hourlyRows}
          yAxisLabel="%"
          lines={[{ key: 'humidity', name: 'Humidity', color: '#3d5a80' }]}
        />

        <WeatherChartCard
          title="Hourly Precipitation (mm)"
          data={prepared.hourlyRows}
          yAxisLabel="mm"
          bars={[{ key: 'precipitation', name: 'Precipitation', color: '#2a9d8f' }]}
        />

        <WeatherChartCard
          title="Hourly Visibility (km)"
          data={prepared.hourlyRows}
          yAxisLabel="km"
          lines={[{ key: 'visibility', name: 'Visibility', color: '#f4a261' }]}
        />

        <WeatherChartCard
          title="Hourly Wind Speed at 10m (km/h)"
          data={prepared.hourlyRows}
          yAxisLabel="km/h"
          lines={[{ key: 'windSpeed', name: 'Wind Speed', color: '#264653' }]}
        />

        <WeatherChartCard
          title="Hourly PM10 (ug/m3)"
          data={prepared.hourlyRows}
          yAxisLabel="ug/m3"
          lines={[{ key: 'pm10', name: 'PM10', color: '#5e548e' }]}
        />

        <WeatherChartCard
          title="Hourly PM2.5 (ug/m3)"
          data={prepared.hourlyRows}
          yAxisLabel="ug/m3"
          lines={[{ key: 'pm2_5', name: 'PM2.5', color: '#9f86c0' }]}
        />
      </section>
    </main>
  )
}
