import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Run for 90 minutes at an even, easy pace and your heart rate will rarely
        stay flat. It creeps up: a few beats in the second hour, more if it is
        hot, more again if long runs are new to you. Aerobic decoupling puts a
        number on that creep. It compares how much pace (or power) you get per
        heartbeat in the first half of a steady effort with the second half. Joe
        Friel popularised it for endurance athletes, and TrainingPeaks labels it
        Pa:HR for pace and Pw:HR for power.
      </p>

      <h2>How decoupling is calculated</h2>
      <p>
        First, split the steady part of the effort into two halves of equal
        time. For each half, compute the efficiency factor (EF): average output
        divided by average heart rate. Then express the loss from one half to
        the next as a percentage:
      </p>
      <Formula
        where={[
          'EF = average output / average heart rate, for each half',
          'Output = grade-adjusted speed for running, power for cycling',
        ]}
      >
        Decoupling (%) = (EF1 − EF2) / EF1 × 100
      </Formula>
      <p>
        A positive value means you produced less per beat in the second half:
        heart rate rose for the same pace, or pace fell for the same heart rate.
        Speed should be grade adjusted when the course is not flat, otherwise a
        climb in the second half looks like fatigue. The usual reading, from
        Friel: under 5% is steady, 5 to 10% shows some drift, above 10% the
        effort outran your aerobic endurance.
      </p>

      <h2>A worked example</h2>
      <p>
        A runner does 90 minutes on a flat loop at 5:20 per km, which is 187.5
        metres per minute.
      </p>
      <ul>
        <li>First 45 minutes: average 142 bpm, so EF1 = 187.5 / 142 = 1.320</li>
        <li>
          Last 45 minutes: same pace, average 150 bpm, so EF2 = 187.5 / 150 =
          1.250
        </li>
        <li>Decoupling = (1.320 − 1.250) / 1.320 × 100 = 5.3%</li>
      </ul>
      <p>
        Just over 5%: some drift. Had the second half averaged 146 bpm, the
        figure would be 2.7%, comfortably steady. On the bike the arithmetic is
        the same with watts: 200 W at 135 bpm, then 195 W at 140 bpm, gives EF
        values of 1.48 and 1.39 and a decoupling of 6.0%. Note that the power
        dropped and the heart rate rose; both count against you.
      </p>

      <h2>How to use it in training</h2>
      <p>
        Decoupling is most useful as a repeatable test of aerobic endurance
        during a base phase. Pick a steady session you will do again: a 75 to
        120 minute easy run on the same flat loop, or a ride at the bottom of
        your endurance zone. Keep the intensity in the{' '}
        <Link href="/tools/heart-rate-zones">
          same heart rate or power zone
        </Link>{' '}
        each time and watch the figure over weeks.
      </p>
      <ul>
        <li>
          If a 90-minute run sits above 5%, the duration or the pace is beyond
          your current endurance. Keep the pace, or slow it slightly, and build
          duration.
        </li>
        <li>
          Once it stays under 5%, extend the run, or add a steady block at
          marathon pace at the end and see whether it holds.
        </li>
        <li>
          Before a marathon or a long trail race, a long run with marathon-pace
          segments that stays under 5% is a reassuring sign. A large drift is a
          reason to rethink the target pace, or the fuelling.
        </li>
      </ul>
      <p>
        OpenAthlete computes decoupling and the efficiency factor on every
        running activity with grade-adjusted speed and heart rate, and on rides
        with power. On the activity page you can leave the warm-up out with a
        slider or select a range of the effort, and the card shows both halves
        and a status: steady, some drift or marked drift. Under 20 minutes, it
        flags the effort as too short to judge endurance.
      </p>

      <h2>Limits</h2>
      <p>
        Decoupling only means something on a steady effort. Intervals, stops at
        traffic lights or a run that ends with a fast finish break the
        comparison. Heat is the biggest confounder: Coyle and González-Alonso
        (2001) describe how rising body temperature drives heart rate up while
        the volume pumped per beat falls, and dehydration adds to it. A 7%
        decoupling on a 30 °C afternoon and 3% on a cool morning can describe
        the same fitness. Optical wrist sensors that lock onto cadence, a chest
        strap with dry contacts or GPS drift under trees all distort one half.
        Finally, decoupling says nothing about speed: you can be perfectly
        coupled at a pace that is too slow for your goal. Read it next to your
        pace, your <Link href="/learn/trimp">training load</Link> and the
        conditions of the day.
      </p>
    </div>
  );
}
