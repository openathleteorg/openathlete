import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        A negative split means running the second half of a race faster than the
        first. The opposite, a positive split, is what most people run without
        meaning to: a start carried by adrenaline and a fresh crowd, then a long
        fade. Coaches have recommended the negative split for decades, mostly as
        a cure for that fade. The evidence behind it is thinner than the advice
        suggests, but the habit it builds, holding back early, is sound for
        anything from 10K upward.
      </p>

      <h2>How a split is measured</h2>
      <p>
        Cut the race in two equal distances and compare the times. Expressing
        the gap as a percentage of the first half lets you compare a 10K with a
        marathon:
      </p>
      <Formula
        where={[
          'T1 = time for the first half, T2 = time for the second half',
          'Negative value: negative split. Positive value: positive split. Within about ±1%: even pacing',
        ]}
      >
        split (%) = (T2 − T1) / T1 × 100
      </Formula>
      <p>
        The ±1% band for “even” is a practical convention, not a standard: GPS
        drift, wind and a single hill can move a split by that much on their
        own. On a hilly or point-to-point course, compare halves of similar
        profile, or look at the{' '}
        <Link href="/learn/grade-adjusted-pace">grade-adjusted pace</Link>{' '}
        rather than the clock.
      </p>

      <h2>A worked example</h2>
      <p>
        A runner aims for 50:00 over 10 km, an average of 5:00/km. They pass 5
        km in 25:30 (5:06/km) and run the second 5 km in 24:30 (4:54/km).
      </p>
      <ul>
        <li>T2 − T1 = 1,470 − 1,530 = −60 s</li>
        <li>split = −60 / 1,530 × 100 = −3.9%</li>
      </ul>
      <p>
        That is a clear negative split, and probably a bit too clear: finishing
        a minute faster on the second half of a 10K usually means the first half
        was conservative and some time was left out there.
      </p>
      <p>
        Over a marathon the margins are smaller. For 3:30:00 (4:59/km average),
        a sensible plan is 1:45:50 at halfway (5:01/km), then 1:44:10 (4:56/km)
        for the second half: a split of −1.6%. Running the first half only two
        or three seconds per kilometre slower than the average costs 50 seconds
        at halfway, and buys some margin for the last 10 km, where most
        marathons are lost.
      </p>

      <h2>How to use it</h2>
      <p>
        The point is not to sprint the end but to avoid paying interest on a
        fast start. Running the first kilometres above your sustainable pace
        burns through carbohydrate and tolerance to fatigue that you cannot
        recover later in the race. A few practical rules:
      </p>
      <ul>
        <li>
          Set your target pace from a recent race, not a hope. The{' '}
          <Link href="/tools/race-predictor">race predictor</Link> and the{' '}
          <Link href="/pace-charts">pace charts</Link> give splits per kilometre
          for a given finish time.
        </li>
        <li>
          Plan the first 3 to 5 km at 5 to 10 seconds per kilometre slower than
          goal pace in a half or a marathon, then settle. In a 10K, the first
          kilometre is the one to restrain.
        </li>
        <li>
          Rehearse it. A progression run, such as 12 km starting at easy pace
          and finishing the last 3 km at marathon pace, teaches you what
          restraint feels like. A long run of 26 km with the last 8 km at goal
          marathon pace does the same with more fatigue.
        </li>
        <li>
          Judge the race afterwards by its split. A positive split above 3 or 4%
          in a marathon almost always points to the first half, not the second.
        </li>
      </ul>

      <h2>Limits</h2>
      <p>
        The research does not make the negative split a law. In their review of
        pacing strategies, Abbiss and Laursen (2008) found that evenly
        distributed pace tends to suit events longer than a couple of minutes,
        and that in very long events trained athletes usually slow
        progressively, whatever their intentions. Díaz and colleagues (2018)
        analysed every marathon world record over fifty years: on average, the
        record holders ran the first half slightly faster than the second. The
        more recent records were the most even, which led the authors to suggest
        that very little speed variation, rather than a marked negative split,
        may be the way forward.
      </p>
      <p>
        So the honest target for most runners is an even split with a slight
        negative lean, not a dramatic finish. Courses also get in the way: a
        race that climbs in its second half will look positive on the clock
        while the effort was perfectly even. On trails and in ultras, where
        terrain and night dominate the second half, comparing halves by time
        tells you little; effort, heart rate and fuelling matter more.
      </p>
    </div>
  );
}
