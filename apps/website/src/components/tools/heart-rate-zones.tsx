'use client';

import { useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { useState } from 'react';

import {
  BigResult,
  CalculatorShell,
  Field,
  NumberField,
  Segmented,
} from './fields';

type Method = 'karvonen' | 'max';

const ZONES = [
  { from: 0.5, to: 0.6, color: '#6ec1fc' },
  { from: 0.6, to: 0.7, color: '#4cffa9' },
  { from: 0.7, to: 0.8, color: '#ffd36e' },
  { from: 0.8, to: 0.9, color: '#ff8c5c' },
  { from: 0.9, to: 1, color: '#d078f7' },
];

export function HeartRateZonesCalculator() {
  const ml = useMessageLocale();
  const [method, setMethod] = useState<Method>('karvonen');
  const [age, setAge] = useState('35');
  const [max, setMax] = useState('');
  const [rest, setRest] = useState('52');

  const estimatedMax = Math.round(208 - 0.7 * (Number(age) || 0));
  const hrMax = Number(max) > 0 ? Number(max) : estimatedMax;
  const hrRest = Number(rest) || 0;
  const valid =
    hrMax > 100 &&
    hrMax < 240 &&
    (method === 'max' || (hrRest > 25 && hrRest < hrMax - 20));

  const bpm = (share: number) =>
    Math.round(
      method === 'karvonen' ? hrRest + (hrMax - hrRest) * share : hrMax * share,
    );

  const names = [
    [m.tools_hr_z1({}, { locale: ml }), m.tools_hr_z1_use({}, { locale: ml })],
    [m.tools_hr_z2({}, { locale: ml }), m.tools_hr_z2_use({}, { locale: ml })],
    [m.tools_hr_z3({}, { locale: ml }), m.tools_hr_z3_use({}, { locale: ml })],
    [m.tools_hr_z4({}, { locale: ml }), m.tools_hr_z4_use({}, { locale: ml })],
    [m.tools_hr_z5({}, { locale: ml }), m.tools_hr_z5_use({}, { locale: ml })],
  ];

  return (
    <CalculatorShell
      inputs={
        <>
          <Field label={m.tools_hr_method({}, { locale: ml })}>
            <Segmented
              label={m.tools_hr_method({}, { locale: ml })}
              value={method}
              onChange={setMethod}
              options={[
                {
                  value: 'karvonen',
                  label: m.tools_hr_method_karvonen({}, { locale: ml }),
                },
                {
                  value: 'max',
                  label: m.tools_hr_method_max({}, { locale: ml }),
                },
              ]}
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField
              label={m.tools_hr_age({}, { locale: ml })}
              value={age}
              onChange={setAge}
              min={10}
              max={90}
            />
            <NumberField
              label={m.tools_hr_max({}, { locale: ml })}
              value={max}
              onChange={setMax}
              placeholder={String(estimatedMax)}
              suffix="bpm"
              min={100}
              max={230}
            />
          </div>
          <p className="-mt-3 text-[0.8rem] text-muted-foreground">
            {m.tools_hr_max_hint(
              { value: String(estimatedMax) },
              { locale: ml },
            )}
          </p>
          {method === 'karvonen' && (
            <NumberField
              label={m.tools_hr_rest({}, { locale: ml })}
              hint={m.tools_hr_rest_hint({}, { locale: ml })}
              value={rest}
              onChange={setRest}
              suffix="bpm"
              min={30}
              max={110}
            />
          )}
        </>
      }
      result={
        <>
          <BigResult
            label={m.tools_hr_result({}, { locale: ml })}
            value={valid ? `${bpm(0.6)}–${bpm(0.7)}` : '–'}
            unit={valid ? `bpm · Z2` : undefined}
            sub={
              valid
                ? m.tools_hr_result_sub(
                    {
                      max: String(hrMax),
                      rest: method === 'karvonen' ? String(hrRest) : '–',
                    },
                    { locale: ml },
                  )
                : undefined
            }
          />
          {valid && (
            <div
              className="mt-8 flex h-3 overflow-hidden rounded-full"
              aria-hidden
            >
              {ZONES.map((zone) => (
                <span
                  key={zone.from}
                  className="h-full flex-1"
                  style={{ background: zone.color }}
                />
              ))}
            </div>
          )}
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {ZONES.map((zone, index) => (
              <li
                key={zone.from}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3"
              >
                <span
                  className="flex size-8 items-center justify-center rounded-lg font-mono text-[0.8rem] font-semibold text-ink"
                  style={{ background: zone.color }}
                >
                  Z{index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.95rem] font-medium text-white">
                    {names[index][0]}{' '}
                    <span className="font-mono text-[0.75rem] text-ink-soft">
                      {zone.from * 100}–{zone.to * 100}%
                    </span>
                  </span>
                  <span className="block truncate text-[0.8rem] text-ink-soft">
                    {names[index][1]}
                  </span>
                </span>
                <span className="font-mono text-[0.95rem] text-white tabular-nums">
                  {valid ? `${bpm(zone.from)}–${bpm(zone.to)}` : '–'}
                </span>
              </li>
            ))}
          </ul>
        </>
      }
    />
  );
}
