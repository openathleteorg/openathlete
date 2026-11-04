import type { EmailLanguage } from '@openathlete/shared';

const locales: Record<EmailLanguage, string> = {
  FR: 'fr-FR',
  EN: 'en-GB',
  IT: 'it-IT',
  ES: 'es-ES',
  PT_BR: 'pt-BR',
};

export function formatNumber(
  language: EmailLanguage,
  value: number,
  maximumFractionDigits = 0,
) {
  return new Intl.NumberFormat(locales[language], {
    maximumFractionDigits,
  }).format(value);
}

/** Meters as kilometers: one decimal under 100 km, none above */
export function formatKm(language: EmailLanguage, meters: number) {
  const km = meters / 1000;
  return `${formatNumber(language, km, km < 100 ? 1 : 0)} km`;
}

export function formatDuration(language: EmailLanguage, seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  const mm = String(minutes).padStart(2, '0');
  if (language === 'EN') return hours ? `${hours}h ${mm}m` : `${minutes}m`;
  return hours ? `${hours} h ${mm}` : `${minutes} min`;
}

/** 4 November */
export function formatDay(language: EmailLanguage, date: Date) {
  return new Intl.DateTimeFormat(locales[language], {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}

/** March 2025 */
export function formatMonthYear(language: EmailLanguage, date: Date) {
  return new Intl.DateTimeFormat(locales[language], {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** The month's name as the language writes it inside a sentence */
export function monthName(language: EmailLanguage, month: string) {
  return new Intl.DateTimeFormat(locales[language], {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));
}

export function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

const providerNames: Record<string, string> = {
  STRAVA: 'Strava',
  GARMIN: 'Garmin',
  POLAR: 'Polar',
  SUUNTO: 'Suunto',
  COROS: 'COROS',
};

export function providerName(provider: string) {
  return providerNames[provider] ?? provider;
}
