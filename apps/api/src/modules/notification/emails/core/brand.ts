/**
 * The palette of the app and the website (apps/web/src/theme/index.css):
 * navy ink, neutrals leaning towards the navy, and the four colours of the
 * logo, which only draw the thin band at the top of the card.
 */
export const brand = {
  ink: '#050c34',
  // Body text: the ink, a touch softer for long reading
  text: '#1f2647',
  muted: '#5e6684',
  paper: '#f7f8fb',
  card: '#ffffff',
  border: '#e7e9f1',
  tile: '#f2f3f8',
  link: '#1f7fd1',
  logoColors: ['#6ec1fc', '#d078f7', '#ff8c5c', '#4cffa9'],
  // Mark of the logo, for light backgrounds
  logoUrl: 'https://openathlete.org/logo_dark.png',
  siteUrl: 'https://openathlete.org',
  // Fonts every mail client has: web fonts would call a third party
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;
