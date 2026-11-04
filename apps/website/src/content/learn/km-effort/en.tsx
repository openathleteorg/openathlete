import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Km-effort is the trail runner’s way of folding climbing into distance:
        every 100 metres of ascent counts as one extra kilometre. A 25 km race
        with 1,000 m of climbing becomes 35 km-effort, and you can compare it
        with a 35 km road run, or with another trail of the same total, more
        honestly than with distance alone.
      </p>
      <p>
        It is a convention, not a law of physiology. It grew up in French trail
        running (<em>kilomètre-effort</em>), where coaches and race organisers
        needed a quick way to say how hard a course was, and ITRA uses the same
        sum, distance plus D+ divided by 100, to classify races. Its appeal is
        that you can do it in your head at the start line.
      </p>

      <h2>How km-effort is calculated</h2>
      <Formula
        where={[
          'km = distance of the course or run',
          'D+ = total ascent in metres',
        ]}
      >
        km-effort = km + D+ / 100
      </Formula>
      <p>
        Descents are ignored: they add neither credit nor penalty. Some coaches
        weight climbing differently on very steep or very runnable courses, and
        some add part of the descent, but 100 m per kilometre is the common
        version and the one used here.
      </p>
      <p>
        Once you have km-effort, you can turn a past race into a prediction. The{' '}
        <Link href="/tools/trail-time-estimator">trail time estimator</Link>{' '}
        applies Peter Riegel’s endurance formula to km-effort instead of
        distance:
      </p>
      <Formula
        where={[
          'T_ref, E_ref = time and km-effort of a race you have run',
          'E = km-effort of the target race',
          'k = 1.06 (Riegel’s road value) for the low end, 1.10 for the high end',
        ]}
      >
        T = T_ref × (E / E_ref)^k
      </Formula>

      <h2>A worked example</h2>
      <ul>
        <li>
          Reference: a 25 km trail with 1,000 m D+, so 25 + 1,000 / 100 = 35
          km-effort, finished in 3:00:00. That is 10,800 s / 35 = 5:09 per
          km-effort.
        </li>
        <li>Target: 42 km with 2,000 m D+, so 42 + 20 = 62 km-effort.</li>
        <li>Low end: 3:00:00 × (62 / 35)^1.06 = 5 h 30.</li>
        <li>High end: 3:00:00 × (62 / 35)^1.10 = 5 h 38.</li>
        <li>
          So 5 h 30 to 5 h 38, about 5:20 per km-effort and an average of 7.5
          km/h over the real 42 km.
        </li>
      </ul>
      <p>
        The 1.06 exponent comes from Riegel’s work on road and track records.
        The 1.10 upper bound is our assumption for the extra slowdown of long
        days on trails, not a published value, which is why the result is a
        window rather than a time to the minute.
      </p>

      <h2>How to use it in training</h2>
      <p>
        Count your week in km-effort as well as kilometres. Twelve kilometres
        with 600 m of climbing is 18 km-effort: a week of 55 km with 2,000 m of
        climbing is 75 km-effort, as much as 75 km on the flat, and a plan that
        only counts kilometres will overload you without saying so.
      </p>
      <p>
        Pick long runs by km-effort. If the goal race is 62 km-effort, a long
        run of 30 to 35 km-effort with a realistic share of climbing tells you
        far more than a flat 30 km. Keep the D+ per kilometre close to the race:
        around 30 m/km on a rolling course, 60 m/km or more for an alpine one.
      </p>
      <p>
        Use pace per km-effort as a rough gauge of fitness across courses. If
        your pace per km-effort on similar terrain keeps falling over a block,
        that is a better sign than any single fast loop. The{' '}
        <Link href="/training-plans/trail">trail training plans</Link> are built
        around this kind of progression, and for climbs themselves,{' '}
        <Link href="/learn/grade-adjusted-pace">grade-adjusted pace</Link> says
        what each one cost in energy.
      </p>

      <h2>Limits</h2>
      <p>
        One rule for all slopes is a simplification. On a gentle, runnable
        climb, 100 m of D+ cost less than a kilometre; on a 25% wall where you
        walk with poles, they can cost more. Terrain matters even more: rocks,
        roots, mud, snow and scree slow you down far beyond what the elevation
        suggests, and two races with the same km-effort can finish far apart.
      </p>
      <p>
        Ignoring descents is the biggest blind spot. On a course with long,
        steep descents, your quads set the pace in the second half, not your
        lungs, and km-effort does not see it coming. Night, altitude above about
        2,000 m, heat and the time spent at aid stations are also outside the
        formula. A reference from a road race assumes runnable trails and
        carries your road speed onto the climbs: on technical ground, expect to
        finish past the window.
      </p>
      <p>
        Finally, km-effort says nothing about a UTMB or ITRA performance index,
        which use their own models. Treat it as a common currency for planning,
        not as a score.
      </p>
    </div>
  );
}
