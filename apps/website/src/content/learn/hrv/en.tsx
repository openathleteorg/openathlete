import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Your heart does not beat like a metronome. At 50 bpm the average gap
        between beats is 1.2 seconds, but one gap might be 1,150 ms and the next
        1,240 ms. Heart rate variability (HRV) measures that variation. Most of
        the fast, beat-to-beat part comes from the vagus nerve, the
        parasympathetic “brake” on the heart, so HRV is a window, narrow and
        noisy, onto how your autonomic nervous system is handling training,
        sleep, illness and stress.
      </p>

      <h2>How HRV is calculated</h2>
      <p>
        Dozens of HRV indices exist (the 1996 Task Force paper lists most of
        them). Athletes and their watches mostly use rMSSD, the root mean square
        of successive differences between beat-to-beat (RR) intervals:
      </p>
      <Formula
        where={[
          'RRi = the time between two consecutive beats, in milliseconds',
          'N = the number of intervals in the recording',
        ]}
      >
        rMSSD = √( Σ (RRi+1 − RRi)² / (N − 1) )
      </Formula>
      <p>
        rMSSD reflects vagal activity well, and it stays usable on short
        recordings: a few minutes lying down on waking, or the deep-sleep
        windows a watch picks during the night. Because daily values are skewed
        (a few very high nights pull a plain average up), training studies
        usually take the natural logarithm, ln rMSSD, before averaging.
      </p>

      <h2>A worked example</h2>
      <p>
        Take five consecutive RR intervals: 1,000, 1,050, 980, 1,020 and 990 ms.
      </p>
      <ul>
        <li>Successive differences: +50, −70, +40, −30 ms</li>
        <li>Squares: 2,500 + 4,900 + 1,600 + 900 = 9,900</li>
        <li>Mean over the 4 differences: 9,900 / 4 = 2,475</li>
        <li>rMSSD = √2,475 = 49.7 ms, so ln rMSSD = 3.91</li>
      </ul>
      <p>
        A real recording has hundreds of intervals, but the arithmetic is the
        same. Now a week of nightly readings: 62, 58, 65, 48, 60, 63 and 59 ms.
        The mean of their logarithms is 4.08, which converts back to 59 ms. The
        48 ms night after a long run on Sunday looks alarming on its own and
        barely moves the weekly figure. If the next week reads 52, 49, 55, 50,
        47, 51 and 48 ms, the 7-day value drops to 3.92 (50 ms). That is a
        sustained shift, and worth a question.
      </p>

      <h2>How to use HRV in training</h2>
      <p>
        One morning’s number tells you little. Plews and colleagues (2013)
        showed that in elite endurance athletes the rolling 7-day average of ln
        rMSSD, and how much it fluctuates, tracks adaptation far better than
        single readings. A practical routine:
      </p>
      <ul>
        <li>
          Measure the same way every day: overnight with the same watch, or on
          waking, lying down, before coffee.
        </li>
        <li>
          Build a baseline from at least three or four weeks of normal training,
          and define your usual range around it.
        </li>
        <li>
          Read the 7-day average against that range, next to resting heart rate,
          sleep and how sessions feel.
        </li>
      </ul>
      <p>
        Kiviniemi and colleagues (2007) went further: one group of moderately
        fit men did their hard sessions only on days when HRV had not dropped,
        and easy running otherwise. They improved their maximal running speed
        more than a group following a fixed plan. That is a useful idea, but one
        study with small groups, not a rule. For most athletes, HRV works best
        as a reason to look harder at a week: if the 7-day average has sat below
        your range for a week, resting heart rate is up and the 5 × 4' at
        threshold felt like a race, take the easy day.
      </p>
      <p>
        OpenAthlete imports nightly HRV from Garmin, Polar, Suunto and COROS (or
        you can log it by hand), shows last night’s value in the calendar’s
        daily wellness row, and plots the rolling 7-day mean of ln rMSSD in the
        recovery statistics. It shows the trend; it does not turn it into a
        readiness score.
      </p>

      <h2>Limits</h2>
      <p>
        Absolute values are personal: healthy, fit people range from under 30 to
        over 100 ms, so comparing with a training partner is pointless. Devices
        differ too. Some report rMSSD from the whole night, some from a 5-minute
        window, some a proprietary score; switching watches resets your
        baseline. Alcohol, a late meal, heat, travel and the menstrual cycle all
        move HRV with no link to training. And higher is not always better:
        Buchheit (2014) points out that in very fit athletes HRV can stop rising
        or even fall during heavy training while they adapt well, and that a
        sharp rise can accompany deep fatigue. HRV is one signal among others;
        read it with{' '}
        <Link href="/learn/session-rpe">how hard sessions felt</Link> and with{' '}
        <Link href="/learn/ctl-atl-tsb">your training load curves</Link>, never
        alone.
      </p>
    </div>
  );
}
