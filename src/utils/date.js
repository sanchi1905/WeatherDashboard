import dayjs from 'dayjs'

export const formatISODate = (value) => dayjs(value).format('YYYY-MM-DD')

export const todayISO = () => dayjs().format('YYYY-MM-DD')

export const asISTLabel = (isoString) =>
  dayjs(isoString).format('DD MMM YYYY, hh:mm A')

export const getHourLabel = (isoString) => dayjs(isoString).format('HH:mm')

export const daysBetween = (startDate, endDate) =>
  dayjs(endDate).diff(dayjs(startDate), 'day') + 1

export const toFahrenheit = (celsius) => (celsius * 9) / 5 + 32

export const numericTimeInHours = (isoString) => {
  const value = dayjs(isoString)
  return value.hour() + value.minute() / 60
}

export const decimalHoursToTime = (hoursValue) => {
  const hour = Math.floor(hoursValue)
  const minutes = Math.round((hoursValue - hour) * 60)
  const normalizedHour = String(hour).padStart(2, '0')
  const normalizedMinutes = String(minutes).padStart(2, '0')
  return `${normalizedHour}:${normalizedMinutes}`
}
