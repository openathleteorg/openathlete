import logoWhiteSrc from '@/assets/logos/logo_white.svg';

import { Recap, mixLabel } from './recap';

/** A story, as Instagram and WhatsApp show them */
export const SHARE_IMAGE = { width: 1080, height: 1920 } as const;

const SANS = "'Geist Variable', ui-sans-serif, system-ui, sans-serif";
const MONO = "'Geist Mono Variable', ui-monospace, monospace";
const MARGIN = 84;
const INNER = SHARE_IMAGE.width - MARGIN * 2;

/** The brand's colours, read from the theme rather than repeated here */
function palette() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string) => styles.getPropertyValue(name).trim();
  return {
    background: read('--oa-bg'),
    foreground: read('--oa-fg'),
    muted: read('--oa-muted'),
    series: [
      read('--oa-brand-1'),
      read('--oa-brand-3'),
      read('--oa-brand-4'),
      read('--oa-brand-2'),
      read('--oa-muted'),
    ],
  };
}

/** `color` at `alpha`: canvases don't all read color-mix() */
function withAlpha(color: string, alpha: number) {
  // The canvas normalises any CSS colour to #rrggbb
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.fillStyle = color;
  const hex = probe.fillStyle.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function loadImage(src: string) {
  const image = new Image();
  image.src = src;
  return image.decode().then(() => image);
}

/**
 * Draws the recap as a 1080 × 1920 image, in the browser: nothing leaves the
 * device until the athlete picks where to send it.
 */
export async function renderShareImage(
  recap: Recap,
  year: number,
): Promise<Blob> {
  await document.fonts.ready;
  const colors = palette();
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_IMAGE.width;
  canvas.height = SHARE_IMAGE.height;
  const g = canvas.getContext('2d')!;
  const { width, height } = SHARE_IMAGE;

  g.fillStyle = colors.background;
  g.fillRect(0, 0, width, height);
  const glow = (x: number, y: number, radius: number, color: string) => {
    const gradient = g.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, withAlpha(color, 0.4));
    gradient.addColorStop(1, withAlpha(color, 0));
    g.fillStyle = gradient;
    g.fillRect(0, 0, width, height);
  };
  glow(80, 120, 900, colors.series[0]);
  glow(width, 700, 800, colors.series[3]);
  glow(300, height, 900, colors.series[1]);

  // Brand
  const logo = await loadImage(logoWhiteSrc);
  g.drawImage(logo, MARGIN, 110, 150, 105);
  g.textBaseline = 'middle';
  g.fillStyle = colors.foreground;
  g.font = `600 44px ${SANS}`;
  g.fillText('OpenAthlete', MARGIN + 172, 168);
  g.fillStyle = colors.muted;
  g.font = `500 32px ${MONO}`;
  g.textAlign = 'right';
  g.fillText(String(year), width - MARGIN, 168);
  g.textAlign = 'left';

  // Title, the name in the brand gradient
  g.textBaseline = 'alphabetic';
  g.font = `800 120px ${SANS}`;
  g.letterSpacing = '-5px';
  g.fillStyle = colors.foreground;
  g.fillText(recap.title, MARGIN, 430, INNER);
  const gradient = g.createLinearGradient(MARGIN, 0, MARGIN + 700, 0);
  [
    colors.series[0],
    colors.series[3],
    colors.series[1],
    colors.series[2],
  ].forEach((color, index) => gradient.addColorStop(index / 3, color));
  g.fillStyle = gradient;
  g.fillText(recap.accent, MARGIN, 560, INNER);
  g.letterSpacing = '0px';

  // Figures, two by two
  const box = (x: number, y: number, w: number, h: number) => {
    g.beginPath();
    g.roundRect(x, y, w, h, 40);
  };
  const tile = (INNER - 24) / 2;
  recap.figures.forEach(({ value, label }, index) => {
    const x = MARGIN + (index % 2) * (tile + 24);
    const y = 660 + Math.floor(index / 2) * 250;
    box(x, y, tile, 226);
    g.fillStyle = withAlpha(colors.foreground, 0.07);
    g.fill();
    g.strokeStyle = withAlpha(colors.foreground, 0.1);
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = colors.foreground;
    g.font = `700 88px ${SANS}`;
    g.letterSpacing = '-3px';
    g.fillText(value, x + 40, y + 118, tile - 80);
    g.letterSpacing = '0px';
    g.fillStyle = colors.muted;
    g.font = `400 32px ${SANS}`;
    g.fillText(label, x + 40, y + 178, tile - 80);
  });

  // Months
  const barWidth = 62;
  const gap = (INNER - barWidth * 12) / 11;
  recap.months.forEach((share, index) => {
    const h = Math.max(8, share * 240);
    const x = MARGIN + index * (barWidth + gap);
    const y = 1490 - h;
    if (index === recap.bestMonth) {
      const fill = g.createLinearGradient(0, y, 0, 1490);
      fill.addColorStop(0, colors.series[0]);
      fill.addColorStop(1, colors.series[3]);
      g.fillStyle = fill;
    } else {
      g.fillStyle = withAlpha(colors.foreground, 0.16);
    }
    box(x, y, barWidth, h);
    g.fill();
  });

  // Sports
  let x = MARGIN;
  const mixGap = 10;
  const mixWidth = INNER - mixGap * (recap.mix.length - 1);
  recap.mix.forEach(({ share }, index) => {
    const w = share * mixWidth;
    g.fillStyle = colors.series[index];
    g.beginPath();
    g.roundRect(x, 1560, Math.max(w, 2), 26, 13);
    g.fill();
    x += w + mixGap;
  });
  x = MARGIN;
  let y = 1650;
  g.font = `400 30px ${SANS}`;
  recap.mix.forEach((part, index) => {
    const label = mixLabel(part);
    const w = g.measureText(label).width + 32;
    if (x + w > width - MARGIN) {
      x = MARGIN;
      y += 50;
    }
    g.fillStyle = colors.series[index];
    g.beginPath();
    g.arc(x + 10, y - 10, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = colors.foreground;
    g.fillText(label, x + 32, y);
    x += w + 48;
  });

  // Signature, and Garmin's attribution under figures made from its data
  g.fillStyle = colors.muted;
  g.font = `500 30px ${MONO}`;
  g.fillText(recap.persona, MARGIN, 1810, INNER);
  if (recap.attribution) {
    g.font = `400 24px ${SANS}`;
    g.fillText(recap.attribution, MARGIN, 1860, INNER);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No image'))),
      'image/png',
    ),
  );
}
