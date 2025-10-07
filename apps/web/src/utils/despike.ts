export function despikeAndEma(
  values: number[],
  opts?: { spikeFactor?: number; alpha?: number },
): number[] {
  const spikeFactor = opts?.spikeFactor ?? 2;
  const alpha = opts?.alpha ?? 0.1;
  if (!values.length) return values.slice();

  // Despike by replacing extreme outliers with neighbor average
  const deSpiked = values.map((v, i, arr) => {
    if (i === 0 || i === arr.length - 1) return v;
    const prev = arr[i - 1];
    const next = arr[i + 1];
    const highSpike = v > prev * spikeFactor && v > next * spikeFactor;
    const lowSpike = v < prev / spikeFactor && v < next / spikeFactor;
    if (highSpike || lowSpike) return (prev + next) / 2;
    return v;
  });

  // Exponential moving average smoothing
  let prev = deSpiked[0];
  return deSpiked.map((v, i) => {
    const current = i === 0 ? v : alpha * v + (1 - alpha) * prev;
    prev = current;
    return current;
  });
}
