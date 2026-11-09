'use client';

import { useLocale, useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { DATE_LOCALES } from '@/utils/locales';
import { useState } from 'react';

import {
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
import { TRAIL_EXPONENTS, kmEffort, trailTimeWindow } from './grade';

/** 19800 → "5h30", 2700 → "45 min": how trail runners write finish times. */
function formatFinish(seconds: number) {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes} min`;
  return `${hours}h${String(minutes % 60).padStart(2, '0')}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[0.78rem] text-ink-soft">{label}</p>
      <p className="mt-1.5 font-mono text-[1.05rem] text-white tabular-nums">
        {value}
      </p>
    </div>
  );
}

type Reference = 'trail' | 'road';

export function TrailTimeEstimator() {
  const ml = useMessageLocale();
  const locale = DATE_LOCALES[useLocale()];
  const [km, setKm] = useState('42');
  const [climb, setClimb] = useState('2000');
  const [descent, setDescent] = useState('');
  const [reference, setReference] = useState<Reference>('trail');
  const [refKm, setRefKm] = useState('25');
  const [refClimb, setRefClimb] = useState('1000');
  const [refTime, setRefTime] = useState('3:00:00');
  const [road, setRoad] = useState<RaceId>('10k');
  const [roadTime, setRoadTime] = useState('45:00');

  const distance = Number(km) || 0;
  const climbM = Math.max(0, Number(climb) || 0);
  const descentM = descent.trim() === '' ? null : Math.max(0, Number(descent));
  const target = kmEffort(distance, climbM);

  const refEffort =
    reference === 'trail'
      ? kmEffort(Number(refKm) || 0, Math.max(0, Number(refClimb) || 0))
      : RACE_DISTANCES.find((d) => d.id === road)!.km;
  const refSeconds = parseDuration(reference === 'trail' ? refTime : roadTime);
  const valid = distance > 0.5 && refEffort > 0.5 && refSeconds > 120;

  const [low, high] = valid
    ? trailTimeWindow(refSeconds, refEffort, target)
    : [0, 0];
  const climbShare = target > 0 ? climbM / 100 / target : 0;
  const perKm = m.tools_common_per_km({}, { locale: ml });
  const dash = '–';

  const roadLabels: Record<RaceId, string> = {
    '5k': m.tools_common_5k({}, { locale: ml }),
    '10k': m.tools_common_10k({}, { locale: ml }),
    half: m.tools_common_half({}, { locale: ml }),
    marathon: m.tools_common_marathon({}, { locale: ml }),
  };

  return (
    <CalculatorShell
      inputs={
        <>
          <p className="kicker text-muted-foreground">
            {m.tools_trail_race({}, { locale: ml })}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              label={m.tools_common_distance({}, { locale: ml })}
              value={km}
              onChange={setKm}
              suffix="km"
              min={0}
              step={0.5}
            />
            <NumberField
              label={m.tools_trail_climb({}, { locale: ml })}
              value={climb}
              onChange={setClimb}
              suffix="m"
              min={0}
              step={50}
            />
            <NumberField
              label={m.tools_trail_descent({}, { locale: ml })}
              value={descent}
              onChange={setDescent}
              suffix="m"
              min={0}
              step={50}
              placeholder="–"
            />
          </div>
          <p className="-mt-3 text-[0.8rem] text-muted-foreground">
            {m.tools_trail_optional({}, { locale: ml })}
          </p>

          <div className="border-t border-border pt-6">
            <Field label={m.tools_trail_reference({}, { locale: ml })}>
              <Segmented
                label={m.tools_trail_reference({}, { locale: ml })}
                value={reference}
                onChange={setReference}
                options={[
                  {
                    value: 'trail',
                    label: m.tools_trail_ref_trail({}, { locale: ml }),
                  },
                  {
                    value: 'road',
                    label: m.tools_trail_ref_road({}, { locale: ml }),
                  },
                ]}
              />
            </Field>
          </div>

          {reference === 'trail' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label={m.tools_common_distance({}, { locale: ml })}
                  value={refKm}
                  onChange={setRefKm}
                  suffix="km"
                  min={0}
                  step={0.5}
                />
                <NumberField
                  label={m.tools_trail_climb({}, { locale: ml })}
                  value={refClimb}
                  onChange={setRefClimb}
                  suffix="m"
                  min={0}
                  step={50}
                />
              </div>
              <DurationField
                label={m.tools_common_time({}, { locale: ml })}
                hint={m.tools_common_time_hint({}, { locale: ml })}
                value={refTime}
                onChange={setRefTime}
              />
            </>
          ) : (
            <>
              <Segmented
                label={m.tools_trail_ref_road({}, { locale: ml })}
                value={road}
                onChange={setRoad}
                options={RACE_DISTANCES.map((d) => ({
                  value: d.id,
                  label: roadLabels[d.id],
                }))}
              />
              <DurationField
                label={m.tools_common_time({}, { locale: ml })}
                hint={m.tools_common_time_hint({}, { locale: ml })}
                value={roadTime}
                onChange={setRoadTime}
              />
            </>
          )}
        </>
      }
      result={
        <>
          <p className="kicker text-ink-soft">
            {m.tools_trail_result({}, { locale: ml })}
          </p>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 font-mono text-[clamp(2.3rem,5.5vw,3.6rem)] leading-none font-semibold tracking-[-0.04em] text-white tabular-nums">
            <span>{valid ? formatFinish(low) : dash}</span>
            {valid && (
              <>
                <span className="text-[0.55em] font-normal text-ink-soft">
                  {m.tools_trail_to({}, { locale: ml })}
                </span>
                <span>{formatFinish(high)}</span>
              </>
            )}
          </p>
          <p className="mt-3 text-[0.92rem] text-ink-soft">
            {m.tools_trail_window_note(
              {
                low: formatNumber(TRAIL_EXPONENTS[0], locale, 2),
                high: formatNumber(TRAIL_EXPONENTS[1], locale, 2),
              },
              { locale: ml },
            )}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Stat
              label={m.tools_trail_effort({}, { locale: ml })}
              value={valid ? formatNumber(target, locale) : dash}
            />
            <Stat
              label={m.tools_trail_pace_effort({}, { locale: ml })}
              value={
                valid
                  ? `${formatDuration(low / target)}–${formatDuration(high / target)}`
                  : dash
              }
            />
            <Stat
              label={m.tools_common_speed({}, { locale: ml })}
              value={
                valid
                  ? `${formatNumber((distance / high) * 3600, locale)}–${formatNumber((distance / low) * 3600, locale)} km/h`
                  : dash
              }
            />
            <Stat
              label={m.tools_trail_pace_km({}, { locale: ml })}
              value={
                valid
                  ? `${formatDuration(low / distance)}–${formatDuration(high / distance)} ${perKm}`
                  : dash
              }
            />
          </div>

          {valid && (
            <div className="mt-8">
              <p className="kicker text-ink-soft">
                {m.tools_trail_split_title({}, { locale: ml })}
              </p>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/10">
                <span
                  className="bg-sky"
                  style={{ width: `${(1 - climbShare) * 100}%` }}
                />
                <span
                  className="bg-coral"
                  style={{ width: `${climbShare * 100}%` }}
                />
              </div>
              <ul className="mt-3 space-y-1.5 text-[0.88rem] text-ink-soft">
                <li className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-sky" />
                  {m.tools_trail_split_distance(
                    {
                      km: formatNumber(distance, locale),
                      time: `${formatFinish(low * (1 - climbShare))}–${formatFinish(high * (1 - climbShare))}`,
                    },
                    { locale: ml },
                  )}
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-coral" />
                  {m.tools_trail_split_climb(
                    {
                      meters: String(Math.round(climbM)),
                      time: `${formatFinish(low * climbShare)}–${formatFinish(high * climbShare)}`,
                    },
                    { locale: ml },
                  )}
                </li>
                {descentM !== null && distance > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full bg-mint" />
                    {m.tools_trail_profile(
                      {
                        up: String(Math.round(climbM / distance)),
                        down: String(Math.round(descentM / distance)),
                      },
                      { locale: ml },
                    )}
                  </li>
                )}
              </ul>
              {descentM !== null && descentM > climbM * 1.2 && (
                <p className="mt-3 text-[0.82rem] leading-relaxed text-ink-soft">
                  {m.tools_trail_descent_note({}, { locale: ml })}
                </p>
              )}
            </div>
          )}

          {reference === 'road' && (
            <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-[0.85rem] leading-relaxed text-ink-soft">
              {m.tools_trail_road_note({}, { locale: ml })}
            </p>
          )}
        </>
      }
    />
  );
}
