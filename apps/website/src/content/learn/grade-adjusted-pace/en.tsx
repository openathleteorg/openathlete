import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Grade-adjusted pace, or GAP, converts what you ran on a slope into the
        pace that would have cost the same energy on flat ground. A kilometre at
        7:30 up an 8% road climb looks slow on a watch; adjusted for the
        gradient, it is worth just under 5:00 on the flat. GAP exists because
        raw pace stops meaning much as soon as the ground tilts, which in trail
        running is most of the time.
      </p>
      <p>
        Several models exist. The one used here, and in OpenAthlete, comes from
        Alberto Minetti and colleagues, who measured the oxygen cost of running
        on a treadmill set between −45% and +45% and fitted a curve to the
        result (Minetti et al., 2002).
      </p>

      <h2>How grade-adjusted pace is calculated</h2>
      <p>
        Minetti’s curve gives the energy cost of running one metre at a given
        gradient, per kilogram of body mass. On the flat it is 3.6 J/kg/m. GAP
        is the ratio between the flat cost and the cost on the slope, applied to
        your pace:
      </p>
      <Formula
        where={[
          'C(i) = 155.4i⁵ − 30.4i⁴ − 43.3i³ + 46.3i² + 19.5i + 3.6, in J/kg/m',
          'i = gradient as a fraction: 0.08 for 8%, −0.10 for −10%',
          'C(0) = 3.6 on the flat',
        ]}
      >
        GAP = pace on the slope × 3.6 / C(i)
      </Formula>
      <p>
        The same ratio works the other way round: the pace to hold on a slope
        for a given flat effort is <code>flat pace × C(i) / 3.6</code>. Over a
        whole activity, the calculation is done point by point on the recorded
        altitude and then averaged, so a hilly run gets one GAP figure next to
        its raw average pace.
      </p>

      <h2>A worked example</h2>
      <ul>
        <li>
          Uphill: 7:30/km on an 8% climb. C(0.08) = 5.43, which is 1.51 times
          the flat cost. 7:30 (450 s) / 1.51 = 298 s, so about 4:58/km on the
          flat.
        </li>
        <li>
          The reverse: a runner whose easy flat pace is 5:30/km wants the same
          effort on a 6% climb. C(0.06) = 4.93, 1.37 times the flat cost, so
          5:30 × 1.37 = 7:32/km. On 15% the ratio is 2.06 and the pace becomes
          11:20/km, at which point most people walk, and walking is the right
          call.
        </li>
        <li>
          Downhill: 4:30/km at −10%. C(−0.10) = 2.15, only 0.6 times the flat
          cost, so the flat equivalent is 7:32/km. The energy bill is small; the
          bill for your quads is not.
        </li>
      </ul>
      <p>
        The{' '}
        <Link href="/tools/grade-adjusted-pace">
          grade-adjusted pace calculator
        </Link>{' '}
        runs these numbers for any pace and gradient.
      </p>

      <h2>How to use it in training</h2>
      <p>
        GAP is most useful for comparing runs that took place on different
        terrain. A 14 km loop with 500 m of climbing at 6:10/km average and a
        flat 14 km at 5:20/km may have been the same session for your heart.
        Looking at GAP side by side with heart rate tells you whether a slow day
        was the hills or you.
      </p>
      <p>
        It also helps you set targets on hilly courses. If your easy runs are
        meant to stay at 5:30 flat effort, a 6% hill at 7:30 is fine and a 6%
        hill at 6:30 is a tempo run in disguise. For hill repeats such as 8 × 2'
        uphill, GAP lets you check that the last rep was worth the same as the
        first even if the watch pace drifted.
      </p>
      <p>
        On race day, use it with care. GAP tells you what a climb costs in
        energy, not how long a mountain race will take; for that,{' '}
        <Link href="/learn/km-effort">km-effort</Link> and the{' '}
        <Link href="/tools/trail-time-estimator">trail time estimator</Link> are
        closer to the question.
      </p>
      <p>
        OpenAthlete applies Minetti’s curve to every run and trail run you sync.
        The gradient is read from altitude over 10 m windows and capped at ±30%,
        because steeper readings are usually GPS or barometer noise rather than
        terrain.
      </p>

      <h2>Limits</h2>
      <p>
        Minetti’s subjects ran on a smooth treadmill belt. Rocks, roots, mud and
        switchbacks add cost the curve does not know about, so on technical
        ground your real effort was higher than GAP shows.
      </p>
      <p>
        Descents are the weakest part. On paper the cost keeps falling to a
        minimum around −18 to −20%, where a metre costs half as much as on the
        flat. In practice, past about −10% you are limited by braking, footing
        and eccentric load on the quadriceps long before energy runs short. A
        fast descent shows a gentle GAP but can be what leaves you sore for
        three days.
      </p>
      <p>
        Altitude data is noisy. A barometric watch does better than GPS
        elevation, but both produce small false climbs on flat ground that nudge
        GAP. Short, steep features like a 20 m ramp are smoothed out by the
        averaging window.
      </p>
      <p>
        Finally, other platforms use other models. Strava says its GAP was built
        from its athletes’ heart rate data rather than lab measurements, and it
        gives less credit on descents. Numbers will differ between tools;
        compare runs within one tool, not across them.
      </p>
    </div>
  );
}
