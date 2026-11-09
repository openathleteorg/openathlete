import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        VMA stands for <em>vitesse maximale aérobie</em>, maximal aerobic speed.
        English papers call it MAS or vVO2max: the lowest running speed at which
        your oxygen uptake reaches its ceiling, your{' '}
        <Link href="/learn/vo2max">VO2max</Link>. Run any faster and the extra
        energy has to come from anaerobic sources, which is why most runners can
        only hold VMA for 4 to 8 minutes. The term comes from French coaching,
        where it has been the backbone of interval training since Luc Léger’s
        track test in 1980 and Véronique Billat’s work in the 1990s. Its appeal
        is practical: VO2max is a lab number in millilitres, VMA is a speed you
        can run on a track.
      </p>

      <h2>How VMA is calculated</h2>
      <p>
        The most direct field method is the 6-minute test (the half-Cooper).
        After a 20-minute warm-up with a few strides, you run as far as you can
        in 6 minutes, at an even pace. Six minutes falls inside the time most
        runners can hold VMA, so your average speed is a good estimate of it:
      </p>
      <Formula
        where={[
          'distance in metres, time in minutes; × 0.06 converts m/min to km/h',
        ]}
      >
        VMA (km/h) = distance / time × 0.06
      </Formula>
      <p>
        The 12-minute Cooper test is easier to pace but reads a little low,
        because almost everybody slows down after 6 or 7 minutes at that speed.
        Progressive tests (Léger and Boucher’s track test, the VAMEVAL) raise
        the speed by 0.5 or 1 km/h at regular intervals until you can no longer
        keep up; the last stage completed gives VMA. They need a track, cones
        and a sound track, but remove the pacing problem.
      </p>
      <p>
        You can also work back from a recent race. Each distance is run at a
        typical share of VMA: about 95% for a 5K, 90% for a 10K, 85% for a half
        marathon and 80% for a marathon. Divide your average race speed by that
        share. A flat 5K or 10K gives a better estimate than a marathon, where
        fuelling and heat weigh more than aerobic power.
      </p>

      <h2>A worked example</h2>
      <ul>
        <li>6-minute test: 1,500 m → 1,500 / 6 × 0.06 = 15.0 km/h (4:00/km)</li>
        <li>Cooper test, same runner: 2,900 m in 12 minutes → 14.5 km/h</li>
        <li>
          10K in 45:00: average speed 13.33 km/h, divided by 0.90 → 14.8 km/h
        </li>
      </ul>
      <p>
        Three methods, three answers within 0.5 km/h of each other. That spread
        is normal, and it is a reminder that VMA is an estimate with a margin,
        not a fixed property like your height. Take 15 km/h and build paces from
        it:
      </p>
      <ul>
        <li>100% VMA: 15.0 km/h, 4:00/km, 125 m in 30 seconds</li>
        <li>95%: 14.25 km/h, 4:13/km</li>
        <li>85% (around threshold for many runners): 12.75 km/h, 4:42/km</li>
        <li>65 to 75% (easy running): 9.75 to 11.25 km/h, 6:09 to 5:20/km</li>
      </ul>

      <h2>How to use VMA in training</h2>
      <p>
        VMA is a ruler for interval sessions. Classic formats at or near it:
        30/30 (30 seconds at 100% VMA, 30 seconds of easy jogging) repeated 10
        to 20 times, 6 × 1,000 m at 95% with 2 minutes of recovery, 5 × 3
        minutes at 95 to 100%. Billat showed that time to exhaustion at VMA
        varies a lot between runners of the same level (Billat and Koralsztein,
        1996), which is why short repetitions with short recoveries let you
        accumulate more minutes at that intensity than one long effort.
      </p>
      <p>
        Below VMA, percentages get less reliable. Two runners at 15 km/h can
        have their threshold at 82% and 90% of VMA, depending on endurance and
        training history. For tempo and long runs, heart rate (see the{' '}
        <Link href="/tools/heart-rate-zones">heart rate zone calculator</Link>)
        or race-based paces such as <Link href="/learn/vdot">VDOT</Link> are
        often a better guide. The <Link href="/tools/vma">VMA calculator</Link>{' '}
        turns a test or a race into paces, and the{' '}
        <Link href="/pace-charts">pace charts</Link> do the conversion per
        kilometre.
      </p>
      <p>
        In OpenAthlete, VMA is one of your capacity metrics. Workout steps can
        target a percentage of it (for example 95% of VMA), and the session is
        then sent with real paces to Garmin, Suunto or COROS watches.
      </p>

      <h2>Limits</h2>
      <p>
        VMA depends on the test: a treadmill, a track, a hilly road and a windy
        day all give different numbers, and a badly paced 6 minutes can cost 0.5
        km/h. It also mixes two things, VO2max and running economy: two runners
        with the same VO2max can have VMAs 1 to 2 km/h apart if one runs more
        economically. Finally, VMA says little about endurance. A runner with a
        high VMA and little mileage will fade in a half marathon that a
        lower-VMA, higher-mileage runner holds comfortably. Use it to set
        interval paces, retest every two or three months, and let races tell you
        the rest.
      </p>
    </div>
  );
}
