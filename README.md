# Weather Dashboard (Selection Test)

Responsive ReactJS weather dashboard using Open-Meteo APIs with browser geolocation.

Live URL (GitHub Pages): `https://sanchi1905.github.io/WeatherDashboard/`

## Live Requirements Covered

- Auto-detect user location through browser GPS on first load.
- Page 1: current weather and hourly charts for selected date.
- Page 2: historical date-range analytics (max 2 years).
- Charts include horizontal scrolling and zoom (via brush).
- Mobile responsive layout and chart legibility.

## Stack

- React + Vite
- React Router
- Recharts
- Day.js

## Run Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## API Endpoints Used

- Forecast: `https://api.open-meteo.com/v1/forecast`
- Historical weather: `https://archive-api.open-meteo.com/v1/archive`
- Air quality: `https://air-quality-api.open-meteo.com/v1/air-quality`

## Notes

- CO2 is displayed as `N/A` because Open-Meteo air-quality payload does not provide a CO2 field.
- Sunrise and sunset on historical page are fetched in `Asia/Kolkata` timezone (IST).

## Suggested Deployment

- Vercel
- Netlify
- GitHub Pages (with Vite static output)

## GitHub Pages Deployment

- This repository includes a workflow at `.github/workflows/deploy.yml`.
- Every push to `main` builds and deploys the site to GitHub Pages.
