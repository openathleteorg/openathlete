import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Your muscles produce lactate at every pace, even walking, and clear it
        just as steadily. At easy speeds the two balance and the concentration
        in your blood stays close to resting, around 1 mmol/L. Speed up and, at
        some point, production starts to outrun clearance. That point is what
        people mean by lactate threshold, and it is the reason a pace you can
        hold for an hour feels so different from one only 15 seconds per
        kilometre faster.
      </p>
      <p>
        The trouble is that “the” lactate threshold does not exist as one agreed
        number. Faude, Kindermann and Meyer (2009) reviewed more than twenty
        threshold concepts in the literature, built on different protocols and
        different rules for reading the same curve. In practice they fall into
        two families. The first threshold (LT1, often called the aerobic
        threshold) is where lactate first rises above its resting level. The
        second (LT2, the anaerobic threshold or, in its strictest form, the
        maximal lactate steady state) is the highest intensity at which lactate
        still settles at a stable value instead of climbing until you stop. When
        a coach says “threshold run”, they nearly always mean LT2.
      </p>

      <h2>How it is measured</h2>
      <p>
        The classic test is a step test on a treadmill or a track: stages of 3
        to 5 minutes, each 0.5 to 1 km/h faster than the last, with a drop of
        blood taken from a fingertip or earlobe at the end of each stage. You
        then read the threshold off the curve. Two rules are common: a fixed
        concentration, usually 4 mmol/L for LT2, and a rise above baseline,
        often baseline + 1 mmol/L for LT1. The speed between two stages is found
        by linear interpolation:
      </p>
      <Formula
        where={[
          'La = target lactate (4 mmol/L, or baseline + 1)',
          'v1, La1 = speed and lactate of the last stage below the target',
          'v2, La2 = speed and lactate of the first stage above it',
        ]}
      >
        v = v1 + (La − La1) / (La2 − La1) × (v2 − v1)
      </Formula>
      <p>
        The maximal lactate steady state is the reference the others try to
        approximate, but it takes several days of 30-minute constant-pace runs
        to pin down, which is why few people outside laboratories ever measure
        it (Jones et al., 2019).
      </p>

      <h2>A worked example</h2>
      <p>
        A runner does 4-minute stages from 10 km/h, adding 1 km/h each time.
        Lactate at the end of each stage: 1.1, 1.2, 1.4, 1.8, 2.6, 4.1 and 6.3
        mmol/L at 10, 11, 12, 13, 14, 15 and 16 km/h.
      </p>
      <ul>
        <li>
          LT2 at 4 mmol/L: between 14 km/h (2.6) and 15 km/h (4.1). v = 14 + (4
          − 2.6) / (4.1 − 2.6) × 1 = 14.9 km/h, or 4:01 per km.
        </li>
        <li>
          LT1 at baseline + 1: the lowest value is 1.1, so the target is 2.1
          mmol/L, between 13 km/h (1.8) and 14 km/h (2.6). v = 13 + 0.3 / 0.8 =
          13.4 km/h, or 4:29 per km.
        </li>
      </ul>
      <p>
        Same test, same blood, and the two thresholds sit almost 30 seconds per
        kilometre apart. Read the curve with another rule (the point of maximal
        distance from a line joining the first and last stages, for example) and
        you would get yet another value. That is not a flaw of the test; it is
        the reason to always ask which threshold a number refers to.
      </p>

      <h2>How to use it in training</h2>
      <p>
        Without a lab, a good field estimate of LT2 is the pace you could race
        for about an hour, which for most trained runners sits between their 10K
        and half marathon pace. The <Link href="/pace-charts">pace charts</Link>{' '}
        give that pace from a recent race time. Heart rate at LT2 is usually 85
        to 92% of maximum, but individual spread is wide.
      </p>
      <ul>
        <li>
          Threshold sessions: 3 × 10' or 5 × 6' at LT2 pace with 1 to 2 minutes
          of jogging, or 20 to 30 minutes continuous. The pace should feel
          “comfortably hard”: you could speak a few words, not a sentence.
        </li>
        <li>
          Easy running stays below LT1. That ceiling is what{' '}
          <Link href="/learn/zone-2">zone 2</Link> tries to capture, and in a{' '}
          <Link href="/learn/polarized-training">polarized</Link> week most of
          your minutes live there.
        </li>
        <li>
          Retest every 6 to 10 weeks, or use races: the threshold moves with
          fitness, and old zones drift into the wrong place.
        </li>
      </ul>
      <p>
        OpenAthlete does not measure lactate. You enter or sync your zones, and
        its statistics show how your time splits below, between and above your
        thresholds over weeks and months, next to the{' '}
        <Link href="/features/training-load">training load</Link> curves.
      </p>

      <h2>Limits</h2>
      <p>
        The number depends on the protocol: shorter stages give a higher
        threshold speed, because lactate has not caught up when the blood is
        taken. Portable lactate meters differ from each other by a few tenths of
        a mmol/L, which shifts a fixed-value threshold noticeably on a flat part
        of the curve. Low muscle glycogen lowers lactate at every speed and
        makes the threshold look better than it is. And a speed found on a
        treadmill at 18 °C does not transfer as is to a hilly course in the
        heat. If you want a pace anchor that comes from your own races rather
        than a blood sample, look at{' '}
        <Link href="/learn/critical-speed">critical speed</Link>, which sits
        just above the maximal lactate steady state.
      </p>
    </div>
  );
}
