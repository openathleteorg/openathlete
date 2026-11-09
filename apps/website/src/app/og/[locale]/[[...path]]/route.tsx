import { SITE_URL } from '@/config';
import { ogContent } from '@/lib/og-titles';
import { siteRoutes } from '@/lib/site-routes';
import { isSupportedLocale } from '@/utils/locales';
import { readFileSync } from 'fs';
import { ImageResponse } from 'next/og';
import { join } from 'path';

/**
 * Social card of every page, 1200 × 630, rendered at build time:
 * `/og/<locale><path>`, which `generateMetadata` in app/metadata.tsx points
 * og:image and twitter:image to.
 */
/* eslint-disable react-refresh/only-export-components -- a route handler */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return siteRoutes().flatMap(({ path, locales }) =>
    locales.map((locale) => ({
      locale,
      path: path.split('/').filter(Boolean),
    })),
  );
}

const LOGO = `data:image/svg+xml;base64,${readFileSync(
  join(process.cwd(), 'public/logo-mark-white.svg'),
).toString('base64')}`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; path?: string[] }> },
) {
  const { locale, path = [] } = await params;
  if (!isSupportedLocale(locale)) return new Response(null, { status: 404 });
  const { kicker, title } = ogContent(
    locale,
    path.length ? `/${path.join('/')}` : '',
  );
  const size = title.length > 70 ? 54 : title.length > 42 ? 64 : 76;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        backgroundColor: '#050c34',
        backgroundImage:
          'radial-gradient(900px 480px at 92% -10%, rgba(208,120,247,0.32), transparent 60%), radial-gradient(800px 420px at -5% 115%, rgba(110,193,252,0.28), transparent 60%)',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} width={62} height={44} alt="" />
        <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
          OpenAthlete
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {kicker && (
          <span
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#9aa4d6',
            }}
          >
            {kicker}
          </span>
        )}
        <span
          style={{
            fontSize: size,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 220,
            height: 8,
            borderRadius: 8,
            backgroundImage:
              'linear-gradient(90deg, #6ec1fc, #d078f7, #ff8c5c, #4cffa9)',
          }}
        />
        <span style={{ fontSize: 24, color: '#9aa4d6' }}>
          {SITE_URL.replace(/^https?:\/\//, '')}
        </span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
