'use client';

import { useLocale, useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { DATE_LOCALES } from '@/utils/locales';
import { useState } from 'react';

import {
  BigResult,
  CalculatorShell,
  DurationField,
  Field,
  NumberField,
  Segmented,
} from './fields';
import {
  RACE_DISTANCES,
  type RaceId,
  formatDuration,
  formatNumber,
  parseDuration,
} from './format';

const MILE_KM = 1.609344;

/** Checkpoints every 5 km, and every kilometre on short races. */
function checkpoints(km: number): number[] {
  const step = km <= 10 ? 1 : 5;
  const points: number[] = [];
  for (let at = step; at < km - 0.05; at += step) points.push(at);
  // The half-way mark of a marathon is a split everyone watches
  if (km > 22) points.push(21.0975);
  points.sort((a, b) => a - b);
  points.push(km);
  return points;
}

export function PaceCalculator() {
  const ml = useMessageLocale();
  const locale = DATE_LOCALES[useLocale()];
  const [preset, setPreset] = useState<RaceId | 'custom'>('half');
  const [customKm, setCustomKm] = useState('15');
  const [time, setTime] = useState('1:45:00');

  const km =
    preset === 'custom'
      ? Number(customKm) || 0
      : RACE_DISTANCES.find((d) => d.id === preset)!.km;
  const seconds = parseDuration(time);
  const valid = km > 0.1 && seconds > 30;
  const pace = valid ? seconds / km : 0;

  const labels: Record<RaceId, string> = {
    '5k': m.tools_common_5k({}, { locale: ml }),
    '10k': m.tools_common_10k({}, { locale: ml }),
    half: m.tools_common_half({}, { locale: ml }),
    marathon: m.tools_common_marathon({}, { locale: ml }),
  };

  return (
    <CalculatorShell
      inputs={
        <>
          <Field label={m.tools_common_distance({}, { locale: ml })}>
            <Segmented
              label={m.tools_common_distance({}, { locale: ml })}
              value={preset}
              onChange={setPreset}
              options={[
                ...RACE_DISTANCES.map((d) => ({
                  value: d.id,
                  label: labels[d.id],
                })),
                {
                  value: 'custom' as const,
                  label: m.tools_common_custom({}, { locale: ml }),
                },
              ]}
            />
          </Field>
          {preset === 'custom' && (
            <NumberField
              label={m.tools_common_distance({}, { locale: ml })}
              value={customKm}
              onChange={setCustomKm}
              suffix="km"
              min={0}
              step={0.1}
            />
          )}
          <DurationField
            label={m.tools_pace_goal({}, { locale: ml })}
            hint={m.tools_common_time_hint({}, { locale: ml })}
            value={time}
            onChange={setTime}
          />
        </>
      }
      result={
        <>
          <BigResult
            label={m.tools_pace_result({}, { locale: ml })}
            value={valid ? formatDuration(pace) : '–'}
            unit={m.tools_common_per_km({}, { locale: ml })}
            sub={
              valid
                ? m.tools_pace_result_sub(
                    {
                      speed: formatNumber((km / seconds) * 3600, locale),
                      mile: formatDuration(pace * MILE_KM),
                    },
                    { locale: ml },
                  )
                : undefined
            }
          />
          <p className="kicker mt-9 mb-3 text-ink-soft">
            {m.tools_pace_splits({}, { locale: ml })}
          </p>
          <div className="max-h-[19rem] overflow-y-auto border-y border-white/10">
            <table className="w-full text-left">
              <tbody className="divide-y divide-white/10">
                {(valid ? checkpoints(km) : []).map((at) => (
                  <tr key={at} className="text-white">
                    <td className="py-2.5 font-mono text-[0.9rem] text-ink-soft tabular-nums">
                      {formatNumber(at, locale, at % 1 === 0 ? 0 : 1)} km
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {formatDuration(pace * at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      }
    />
  );
}
