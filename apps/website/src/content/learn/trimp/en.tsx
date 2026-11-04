import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        TRIMP, short for training impulse, turns a session into a single number
        from two things your watch already records: how long you trained and how
        high your heart rate was. Eric Banister proposed it in the 1970s as the
        input to his fitness-fatigue model, and most heart-rate-based load
        charts still run on some version of it. It is simple enough to work out
        by hand, which is the best way to see what it captures and what it
        misses.
      </p>

      <h2>How TRIMP is calculated</h2>
      <p>
        Banister’s TRIMP takes the share of your heart rate reserve you used,
        multiplies it by the duration, then applies an exponential weighting so
        that a minute near threshold costs much more than a minute of jogging:
      </p>
      <Formula
        where={[
          'HRr = (HR − HRrest) / (HRmax − HRrest), the fraction of heart rate reserve',
          'y = 0.64 and k = 1.92 for men; y = 0.86 and k = 1.67 for women',
        ]}
      >
        TRIMP = minutes × HRr × y × e^(k × HRr)
      </Formula>
      <p>
        The weighting was fitted to the way blood lactate climbs with heart
        rate: nearly flat at easy intensities, steep near threshold (Morton,
        Fitz-Clarke and Banister, 1990). The two sets of coefficients are
        averages from the men and women in those studies. Nobody has shown they
        fit any one athlete closely, so a TRIMP of 112 is not meaningfully more
        precise than 105.
      </p>
      <p>
        You can apply the formula once to the average heart rate of the whole
        session, or minute by minute (second by second with a recorded stream)
        and add the pieces. The second way is better, for a reason the example
        below makes concrete.
      </p>

      <h2>A worked example</h2>
      <p>
        A runner with a resting heart rate of 48 and a maximum of 188 has a
        reserve of 140 beats. They run 45 minutes at an average of 150 bpm.
      </p>
      <ul>
        <li>HRr = (150 − 48) / 140 = 0.729</li>
        <li>Weighting = 0.64 × e^(1.92 × 0.729) = 0.64 × 4.05 = 2.59</li>
        <li>TRIMP = 45 × 0.729 × 2.59 = 85</li>
      </ul>
      <p>
        With the women’s coefficients, the same run scores 95. Same heart, same
        run, a 12% gap from the coefficient choice alone.
      </p>
      <p>
        Now split 20 minutes of the same average differently: 10 minutes at 175
        bpm and 10 minutes at 125 bpm. Computed on the average (150 bpm for 20
        minutes), the TRIMP is 38. Computed block by block, it is 33 + 10 = 43,
        about 15% more. Because the weighting is exponential, the hard minutes
        add more than the easy ones take away, and an average flattens exactly
        the part that tires you. That is why interval sessions are
        underestimated when only the average heart rate is used.
      </p>

      <h2>How to use TRIMP in training</h2>
      <p>
        A single session score is of little use. TRIMP becomes useful when you
        add it up: a weekly total to compare blocks, and a daily series that
        feeds the{' '}
        <Link href="/learn/ctl-atl-tsb">fitness, fatigue and form curves</Link>{' '}
        (CTL, ATL, TSB). A few habits help:
      </p>
      <ul>
        <li>
          Keep your resting and maximum heart rate up to date. A maximum set 10
          beats too high shrinks every HRr and lowers every score.
        </li>
        <li>
          Compare yourself with yourself. A weekly 600 means nothing in absolute
          terms; going from 450 to 650 in two weeks does.
        </li>
        <li>
          Read TRIMP next to how the session felt. When a usual easy run scores
          20% higher than normal, heat, poor sleep or an oncoming cold are more
          likely explanations than a sudden fitness change.
        </li>
      </ul>
      <p>
        OpenAthlete computes Banister’s TRIMP from the second-by-second heart
        rate of each activity (from the average when there is no stream), using
        the coefficients above, and shows{' '}
        <Link href="/learn/session-rpe">session RPE</Link> alongside it. The{' '}
        <Link href="/features/training-load">training load page</Link> has a
        calculator and links to the source code.
      </p>

      <h2>Limits</h2>
      <p>
        Heart rate is an internal measure, and it lags. In 30-second sprints or
        short hill reps it barely has time to rise, so TRIMP underrates
        anaerobic and neuromuscular work. Strength sessions, downhill running
        and the muscle damage of a trail race barely show. Heat, dehydration,
        caffeine and altitude push heart rate up for the same work, and{' '}
        <Link href="/learn/aerobic-decoupling">cardiac drift</Link> inflates the
        second half of long efforts. Finally, the formula ignores sport: an hour
        at 140 bpm on the bike and an hour at 140 bpm running score the same,
        though the run usually leaves more damage. Pair TRIMP with a subjective
        score, and treat it as a trend, not a verdict.
      </p>
    </div>
  );
}
