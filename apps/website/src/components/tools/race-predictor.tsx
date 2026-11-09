'use client';

import { useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
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
  parseDuration,
} from './format';

/** Peter Riegel, 1977: T2 = T1 × (D2 / D1)^1.06 */
function riegel(seconds: number, fromKm: number, toKm: number) {
  return seconds * Math.pow(toKm / fromKm, 1.06);
}

export function RacePredictor() {
  const ml = useMessageLocale();
  const [preset, setPreset] = useState<RaceId | 'custom'>('10k');
  const [customKm, setCustomKm] = useState('15');
  const [time, setTime] = useState('50:00');

  const km =
    preset === 'custom'
      ? Number(customKm) || 0
      : RACE_DISTANCES.find((d) => d.id === preset)!.km;
  const seconds = parseDuration(time);
  const valid = km > 0.4 && seconds > 60;

  const labels: Record<RaceId, string> = {
    '5k': m.tools_common_5k({}, { locale: ml }),
    '10k': m.tools_common_10k({}, { locale: ml }),
    half: m.tools_common_half({}, { locale: ml }),
    marathon: m.tools_common_marathon({}, { locale: ml }),
  };
  const marathon = valid ? riegel(seconds, km, 42.195) : 0;

  return (
    <CalculatorShell
      inputs={
        <>
          <Field label={m.tools_rp_reference({}, { locale: ml })}>
            <Segmented
              label={m.tools_rp_reference({}, { locale: ml })}
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
              label={m.tools_rp_distance_km({}, { locale: ml })}
              value={customKm}
              onChange={setCustomKm}
              suffix="km"
              min={0}
              step={0.1}
            />
          )}
          <DurationField
            label={m.tools_common_time({}, { locale: ml })}
            hint={m.tools_common_time_hint({}, { locale: ml })}
            value={time}
            onChange={setTime}
          />
        </>
      }
      result={
        <>
          <BigResult
            label={`${m.tools_rp_result({}, { locale: ml })} · ${m.tools_common_marathon({}, { locale: ml })}`}
            value={valid ? formatDuration(marathon) : '–'}
            sub={
              valid
                ? `${formatDuration(marathon / 42.195)} ${m.tools_common_per_km({}, { locale: ml })}`
                : undefined
            }
          />
          <table className="mt-9 w-full text-left">
            <thead>
              <tr className="kicker text-ink-soft">
                <th className="pb-3 font-medium">
                  {m.tools_common_distance({}, { locale: ml })}
                </th>
                <th className="pb-3 text-right font-medium">
                  {m.tools_common_time({}, { locale: ml })}
                </th>
                <th className="pb-3 text-right font-medium">
                  {m.tools_common_pace({}, { locale: ml })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 border-y border-white/10">
              {RACE_DISTANCES.map((d) => {
                const predicted = valid ? riegel(seconds, km, d.km) : 0;
                const isReference = preset === d.id;
                return (
                  <tr
                    key={d.id}
                    className={cn('text-white', isReference && 'text-ink-soft')}
                  >
                    <td className="py-3 text-[0.95rem]">
                      {labels[d.id]}
                      {isReference && (
                        <span className="ml-2 text-[0.75rem]">
                          ({m.tools_rp_you_ran({}, { locale: ml })})
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums">
                      {valid ? formatDuration(predicted) : '–'}
                    </td>
                    <td className="py-3 text-right font-mono text-[0.9rem] tabular-nums">
                      {valid ? formatDuration(predicted / d.km) : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      }
    />
  );
}
