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
  formatNumber,
  paceFromSpeed,
  parseDuration,
} from './format';

type Source = 'half-cooper' | 'cooper' | 'race';

/** Share of VMA a trained runner usually holds over each distance. */
const RACE_SHARE: Record<RaceId, number> = {
  '5k': 0.95,
  '10k': 0.9,
  half: 0.85,
  marathon: 0.8,
};

const ZONES = [
  { id: 'easy', from: 0.6, to: 0.7 },
  { id: 'marathon', from: 0.75, to: 0.8 },
  { id: 'threshold', from: 0.85, to: 0.9 },
  { id: '10k', from: 0.9, to: 0.95 },
  { id: 'vma', from: 0.95, to: 1.05 },
] as const;

const ZONE_COLORS = ['#6ec1fc', '#4cffa9', '#ffd36e', '#ff8c5c', '#d078f7'];

export function VmaCalculator() {
  const ml = useMessageLocale();
  const locale = DATE_LOCALES[useLocale()];
  const [source, setSource] = useState<Source>('half-cooper');
  const [meters, setMeters] = useState('1500');
  const [race, setRace] = useState<RaceId>('10k');
  const [time, setTime] = useState('48:00');

  const raceKm = RACE_DISTANCES.find((d) => d.id === race)!.km;
  let vma = 0;
  if (source === 'race') {
    const seconds = parseDuration(time);
    if (seconds > 0) vma = ((raceKm / seconds) * 3600) / RACE_SHARE[race];
  } else {
    const minutes = source === 'half-cooper' ? 6 : 12;
    vma = ((Number(meters) || 0) / 1000) * (60 / minutes);
  }
  const valid = vma > 5 && vma < 30;

  const zoneLabels: Record<(typeof ZONES)[number]['id'], [string, string]> = {
    easy: [
      m.tools_vma_z_easy({}, { locale: ml }),
      m.tools_vma_z_easy_use({}, { locale: ml }),
    ],
    marathon: [
      m.tools_vma_z_marathon({}, { locale: ml }),
      m.tools_vma_z_marathon_use({}, { locale: ml }),
    ],
    threshold: [
      m.tools_vma_z_threshold({}, { locale: ml }),
      m.tools_vma_z_threshold_use({}, { locale: ml }),
    ],
    '10k': [
      m.tools_vma_z_10k({}, { locale: ml }),
      m.tools_vma_z_10k_use({}, { locale: ml }),
    ],
    vma: [
      m.tools_vma_z_vma({}, { locale: ml }),
      m.tools_vma_z_vma_use({}, { locale: ml }),
    ],
  };
  const raceLabels: Record<RaceId, string> = {
    '5k': m.tools_common_5k({}, { locale: ml }),
    '10k': m.tools_common_10k({}, { locale: ml }),
    half: m.tools_common_half({}, { locale: ml }),
    marathon: m.tools_common_marathon({}, { locale: ml }),
  };

  return (
    <CalculatorShell
      inputs={
        <>
          <Field label={m.tools_vma_source({}, { locale: ml })}>
            <Segmented
              label={m.tools_vma_source({}, { locale: ml })}
              value={source}
              onChange={setSource}
              options={[
                {
                  value: 'half-cooper',
                  label: m.tools_vma_test_half_cooper({}, { locale: ml }),
                },
                {
                  value: 'cooper',
                  label: m.tools_vma_test_cooper({}, { locale: ml }),
                },
                {
                  value: 'race',
                  label: m.tools_vma_test_race({}, { locale: ml }),
                },
              ]}
            />
          </Field>
          {source === 'race' ? (
            <>
              <Field label={m.tools_vma_race_distance({}, { locale: ml })}>
                <Segmented
                  label={m.tools_vma_race_distance({}, { locale: ml })}
                  value={race}
                  onChange={setRace}
                  options={RACE_DISTANCES.map((d) => ({
                    value: d.id,
                    label: raceLabels[d.id],
                  }))}
                />
              </Field>
              <DurationField
                label={m.tools_vma_race_time({}, { locale: ml })}
                hint={`${m.tools_common_time_hint({}, { locale: ml })}. ${m.tools_vma_protocol_race({}, { locale: ml })}`}
                value={time}
                onChange={setTime}
              />
            </>
          ) : (
            <NumberField
              label={m.tools_vma_distance_m({}, { locale: ml })}
              hint={
                source === 'half-cooper'
                  ? m.tools_vma_protocol_half({}, { locale: ml })
                  : m.tools_vma_protocol_cooper({}, { locale: ml })
              }
              value={meters}
              onChange={setMeters}
              suffix="m"
              min={0}
              step={10}
            />
          )}
        </>
      }
      result={
        <>
          <BigResult
            label={m.tools_vma_result({}, { locale: ml })}
            value={valid ? formatNumber(vma, locale) : '–'}
            unit="km/h"
            sub={
              valid
                ? m.tools_vma_result_sub(
                    { pace: paceFromSpeed(vma) },
                    { locale: ml },
                  )
                : undefined
            }
          />
          <p className="kicker mt-9 mb-3 text-ink-soft">
            {m.tools_vma_zones_title({}, { locale: ml })}
          </p>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {ZONES.map((zone, index) => {
              const [name, use] = zoneLabels[zone.id];
              return (
                <li
                  key={zone.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3"
                >
                  <span
                    className="h-8 w-1 rounded-full"
                    style={{ background: ZONE_COLORS[index] }}
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.95rem] font-medium text-white">
                      {name}{' '}
                      <span className="font-mono text-[0.75rem] text-ink-soft">
                        {Math.round(zone.from * 100)}–
                        {Math.round(zone.to * 100)}%
                      </span>
                    </span>
                    <span className="block truncate text-[0.8rem] text-ink-soft">
                      {use}
                    </span>
                  </span>
                  <span className="text-right font-mono text-[0.92rem] text-white tabular-nums">
                    {valid
                      ? `${paceFromSpeed(vma * zone.from)}–${paceFromSpeed(vma * zone.to)}`
                      : '–'}
                    <span className="block text-[0.72rem] text-ink-soft">
                      {valid
                        ? `${formatNumber(vma * zone.from, locale)}–${formatNumber(vma * zone.to, locale)} km/h`
                        : ''}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      }
    />
  );
}
