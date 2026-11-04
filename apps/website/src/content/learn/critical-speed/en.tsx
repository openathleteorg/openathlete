import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Plot your best times from a few minutes to about twenty against the
        distance covered and the points fall almost on a straight line. Its
        slope is your critical speed: the speed you could add, metre after
        metre, for every extra second of effort. The line does not start at
        zero. It crosses the distance axis a little above it, at a value called
        D′ (D prime): a fixed amount of distance you can cover faster than
        critical speed before you have to slow down.
      </p>
      <p>
        The idea comes from Monod and Scherrer (1965), who described it for work
        done by a group of muscles, under the name critical power. It transfers
        to running with speed in place of power and distance in place of work.
        Physiologically, critical speed is the boundary between efforts where
        oxygen uptake and lactate settle at a steady level, and efforts where
        they keep drifting up until you stop (Poole et al., 2016). It sits close
        to, and slightly above, the maximal lactate steady state that the{' '}
        <Link href="/learn/lactate-threshold">lactate threshold</Link> tries to
        estimate.
      </p>

      <h2>How critical speed is calculated</h2>
      <Formula
        where={[
          'd = distance of a best effort (m), t = its duration (s)',
          'CS = critical speed (m/s), D′ = distance above CS (m)',
          'Above CS: time to exhaustion t = D′ / (v − CS)',
        ]}
      >
        d = D′ + CS × t
      </Formula>
      <p>
        With two maximal efforts you can solve the line by hand. With three or
        more, you fit it by least squares, and the scatter of the points around
        the line tells you how much to trust the slope. The efforts should last
        between about 2 and 20 minutes: shorter ones lean on sprint qualities
        the model does not describe, longer ones bring in fatigue and fuelling.
      </p>

      <h2>A worked example</h2>
      <p>
        A runner has four recent bests: 1,000 m in 3:10 (190 s), 2,000 m in 6:55
        (415 s), 3,000 m in 10:30 (630 s) and 5,000 m in 18:00 (1,080 s).
      </p>
      <ul>
        <li>
          Fitting distance against time gives a slope of 4.50 m/s: critical
          speed is 16.2 km/h, or 3:42 per km.
        </li>
        <li>The intercept is D′ ≈ 145 m.</li>
        <li>
          With four points, the 95% interval on the slope is ±0.11 m/s, so
          critical speed is somewhere between 3:37 and 3:48 per km.
        </li>
        <li>
          At 3:20 per km (5.0 m/s), D′ runs out after 145 / (5.0 − 4.50) ≈ 290
          s, about 1,450 m. The model predicts a 1,500 m in roughly 5:01.
        </li>
      </ul>
      <p>
        Note that the 5K pace (3:36 per km) is faster than critical speed. That
        is expected: any race short enough to finish before D′ is empty is run
        above it.
      </p>

      <h2>How to use it in training</h2>
      <p>
        Critical speed splits your paces into two worlds. Below it, fatigue
        builds slowly and the limit is mostly time and fuel. Above it, every
        metre over the line is taken from D′, and when D′ is gone, you slow
        down, whatever your motivation says.
      </p>
      <ul>
        <li>
          Intervals above CS: 5 × 1,000 m at 3:30 per km (4.76 m/s) for the
          runner above. Each rep covers 1,000 − 4.50 × 210 ≈ 55 m above critical
          speed, about 38% of D′. Recoveries refill part of it, not all, which
          is why the last reps feel harder (Jones and Vanhatalo, 2017).
        </li>
        <li>
          Work just below CS: 3 × 10' at 3:48 to 3:52 per km. Hard, but the
          steady state holds.
        </li>
        <li>
          Pacing races: start a 5K faster than CS and you spend D′ early. Spread
          it over the distance and you finish faster.
        </li>
      </ul>
      <p>
        Smyth and Muniz-Pumares (2020) showed that critical speed can be
        estimated from the raw training data of recreational marathon runners,
        without dedicated tests, and that it relates to their marathon times.
        OpenAthlete’s statistics do the same in their Capacities view: they fit
        the line to your best efforts between 2 and 20 minutes (at least three
        of them), show the 95% interval, and do the same with power for critical
        power on the bike. The <Link href="/features">features page</Link> lists
        what else is computed from your history.
      </p>

      <h2>Limits</h2>
      <p>
        Bests from training are not maximal tests. If your 3,000 m best was a
        tempo effort, the fitted speed is lower than your real one: the result
        is at most what your efforts show. Efforts bunched at similar durations
        give a wide interval, and a GPS best set downhill or with a tailwind
        pulls the line up. The model also says nothing about long events.
        Critical speed is not a pace you can hold for hours, and a marathon is
        run well below it, at a share that depends on endurance and fuelling
        more than on the line itself. For those, combine it with race-based
        tools like the <Link href="/tools/race-predictor">race predictor</Link>{' '}
        or the <Link href="/pace-charts">pace charts</Link>, and keep{' '}
        <Link href="/learn/vma">VMA</Link> for the short end of the curve.
      </p>
    </div>
  );
}
