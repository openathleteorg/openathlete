// A stand-in for Open-Meteo's forecast and archive APIs for the end-to-end
// tests: the API reaches it through OPEN_METEO_BASE_URL. Every hour of every
// asked day has the same weather, so tests can assert exact values.
import { createServer } from 'node:http';

const WEATHER = {
  temperature_2m: [15, '°C'],
  apparent_temperature: [14, '°C'],
  relative_humidity_2m: [60, '%'],
  precipitation: [0, 'mm'],
  rain: [0, 'mm'],
  snowfall: [0, 'cm'],
  cloudcover: [25, '%'],
  windspeed_10m: [10, 'km/h'],
  windgusts_10m: [20, 'km/h'],
  shortwave_radiation: [300, 'W/m²'],
  sunshine_duration: [3600, 's'],
  is_day: [1, ''],
};

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

function hoursBetween(startDate, endDate) {
  const hours = [];
  const last = Date.parse(`${endDate}T23:00Z`);
  for (let t = Date.parse(`${startDate}T00:00Z`); t <= last; t += 3600_000) {
    hours.push(new Date(t).toISOString().slice(0, 16));
  }
  return hours;
}

createServer((request, response) => {
  const url = new URL(request.url, 'http://fake-open-meteo');

  if (url.pathname === '/health') return send(response, 200, { ok: true });
  if (url.pathname !== '/v1/forecast' && url.pathname !== '/v1/archive')
    return send(response, 404, { error: true, reason: 'Not found' });

  const params = url.searchParams;
  const startDate = params.get('start_date');
  const endDate = params.get('end_date') ?? startDate;
  if (!startDate || Number.isNaN(Date.parse(`${startDate}T00:00Z`)))
    return send(response, 400, { error: true, reason: 'start_date required' });

  const time = hoursBetween(startDate, endDate);
  const variables = (params.get('hourly') ?? '')
    .split(',')
    .filter((name) => name in WEATHER);
  send(response, 200, {
    latitude: Number(params.get('latitude')),
    longitude: Number(params.get('longitude')),
    timezone: 'UTC',
    hourly_units: Object.fromEntries([
      ['time', 'iso8601'],
      ...variables.map((name) => [name, WEATHER[name][1]]),
    ]),
    hourly: Object.fromEntries([
      ['time', time],
      ...variables.map((name) => [name, time.map(() => WEATHER[name][0])]),
    ]),
  });
}).listen(Number(process.env.PORT ?? 8080));
