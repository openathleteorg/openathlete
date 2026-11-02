import { downloadFile } from '@/utils/csv';

const SIZE = { width: 1080, height: 1350 };

/** The theme's colours, so the image matches the app in either mode */
function palette() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string) => styles.getPropertyValue(name).trim();
  return {
    background: read('--background'),
    foreground: read('--foreground'),
    muted: read('--muted-foreground'),
    accent: read('--chart-1'),
  };
}

function draw(title: string, lines: string[][]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE.width;
  canvas.height = SIZE.height;
  const context = canvas.getContext('2d')!;
  const { background, foreground, muted, accent } = palette();

  context.fillStyle = background;
  context.fillRect(0, 0, SIZE.width, SIZE.height);
  context.fillStyle = accent;
  context.fillRect(90, 110, 120, 12);
  context.fillStyle = foreground;
  context.font = '700 84px system-ui, sans-serif';
  context.fillText(title, 90, 220);

  lines.forEach(([label, value], index) => {
    const y = 360 + index * 150;
    context.fillStyle = muted;
    context.font = '400 40px system-ui, sans-serif';
    context.fillText(label, 90, y);
    context.fillStyle = foreground;
    context.font = '700 72px system-ui, sans-serif';
    context.fillText(value, 90, y + 76);
  });

  context.fillStyle = muted;
  context.font = '400 36px system-ui, sans-serif';
  context.fillText('OpenAthlete', 90, SIZE.height - 90);
  return canvas;
}

/**
 * Builds the image in the browser: nothing leaves the device until the athlete
 * picks where to send it. Without a share sheet, it is saved instead.
 */
export async function shareYearCard({
  title,
  lines,
}: {
  title: string;
  lines: string[][];
}) {
  const blob = await new Promise<Blob | null>((resolve) =>
    draw(title, lines).toBlob(resolve, 'image/png'),
  );
  if (!blob) return;
  const name = 'openathlete-year.png';
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title }).catch(() => undefined);
    return;
  }
  downloadFile(name, blob);
}
