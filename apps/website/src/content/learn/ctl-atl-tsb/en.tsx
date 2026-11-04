import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        CTL, ATL and TSB are three curves drawn from the same daily training
        load. CTL (chronic training load) is usually called fitness, ATL (acute
        training load) fatigue, and TSB (training stress balance) form. They
        come from the impulse-response model Eric Banister published in 1975:
        every session raises both your fitness and your fatigue, fatigue fades
        within days, fitness over weeks, and performance sits somewhere in the
        gap between the two. The CTL, ATL and TSB names were popularised later
        by cycling software, but the maths is Banister’s.
      </p>

      <h2>How they are calculated</h2>
      <p>
        Start with one load number per day, for example the sum of the{' '}
        <Link href="/learn/trimp">TRIMP</Link> of that day’s sessions (0 on a
        rest day). Fitness and fatigue are exponentially weighted averages of
        that series, with different time constants:
      </p>
      <Formula
        where={[
          'CTL: τ = 42 days, so each day weighs 1 − e^(−1/42) ≈ 0.0235',
          'ATL: τ = 7 days, so each day weighs 1 − e^(−1/7) ≈ 0.133',
          'TSB = CTL − ATL',
        ]}
      >
        today = yesterday + (1 − e^(−1/τ)) × (load − yesterday)
      </Formula>
      <p>
        With τ = 42 days, the effect of a session on CTL halves in about 29
        days; on ATL, it halves in under 5 days. Some tools use the
        moving-average shortcut 2 / (N + 1) for the daily weight. That is not
        the same model: with N = 42 it gives 0.047, twice 0.0235, which
        effectively halves both time constants and makes the curves react much
        faster (Clarke and Skiba, 2013, walk through the derivation).
      </p>
      <p>
        Tools also differ on which day TSB uses. OpenAthlete subtracts the
        values of the same day, after that day’s load is counted; others use
        yesterday’s values, so that TSB describes how fresh you are when you
        start today’s session. On the same data the two can differ by a few
        points, so don’t compare numbers across apps.
      </p>

      <h2>A worked example</h2>
      <p>
        A runner has averaged 60 TRIMP a day for months: CTL and ATL both sit at
        60, TSB at 0. They start a hard week at 90 a day. After the first day:
      </p>
      <ul>
        <li>CTL = 60 + 0.0235 × (90 − 60) = 60.7</li>
        <li>ATL = 60 + 0.133 × (90 − 60) = 64.0</li>
        <li>TSB = 60.7 − 64.0 = −3.3</li>
      </ul>
      <p>
        After seven days at 90, CTL has crept up to 64.6 while ATL has jumped to
        79.0: TSB is −14.4. The runner is a little fitter and clearly tired.
        They then drop to 40 a day for a week. ATL falls quickly to 54.3, CTL
        only slips to 60.8, and TSB turns positive at +6.5. That asymmetry,
        fatigue leaving faster than fitness, is the whole principle of a{' '}
        <Link href="/learn/taper">taper</Link>.
      </p>

      <h2>How to use them in training</h2>
      <p>
        CTL tells you how much training you have been absorbing over the last
        month or two. A steady rise of a few points a week during a build is the
        usual picture; a sharp jump is worth questioning, a long plateau too if
        you expected progress. ATL moves with each week and mainly explains why
        you feel heavy. TSB is the one people watch before a race: most athletes
        race well somewhere between slightly negative and clearly positive, but
        the right value is personal and you only learn it by noting your TSB
        before races that went well and badly.
      </p>
      <p>
        The curves get more useful when they extend into the future. If your
        planned sessions carry a load estimate, the model can project CTL, ATL
        and TSB to race day and show whether the last two weeks really bring you
        in fresh. OpenAthlete does this: it computes the curves from your
        activities and projects them over the sessions in your calendar. It
        flags a TSB below −20 or above +25; those thresholds are conventions to
        describe the curve, not validated limits. See the{' '}
        <Link href="/features/training-load">training load page</Link> for the
        details and the code.
      </p>

      <h2>Limits</h2>
      <p>
        The model is only as good as the daily load you feed it. Heart-rate
        TRIMP underrates sprints, strength work and downhill running, so the
        curves miss part of what a trail runner or a triathlete does in the gym.
        Missing data hurts too: a week of runs without a heart rate strap looks
        like a week off.
      </p>
      <p>
        The time constants are conventions. Banister fitted them per athlete,
        and fitted values vary widely; 42 and 7 days are reasonable defaults,
        not your physiology. Hellard and colleagues (2006) showed how unstable
        the fitted parameters are even with good data from elite swimmers. And
        nothing in the model knows about sleep, illness or stress outside sport.
        A negative TSB does not diagnose overreaching, and a high one does not
        mean you are ready. Read the curves with{' '}
        <Link href="/learn/session-rpe">session RPE</Link>,{' '}
        <Link href="/learn/hrv">HRV</Link> and how you feel.
      </p>
    </div>
  );
}
