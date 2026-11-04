import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Polarized training describes a way of spreading training intensity: most
        of the volume clearly easy, a smaller but real share clearly hard, and
        very little in the middle. The idea did not come from a lab protocol but
        from watching what elite endurance athletes actually do. Reviewing the
        descriptive studies, Stephen Seiler found that nationally and
        internationally competitive endurance athletes training 10 to 13 times a
        week tend to settle on about 80% of their sessions at low intensity and
        about 20% dominated by hard work, such as intervals at around 90% of
        VO2max (Seiler, 2010).
      </p>
      <p>
        That pattern is often shortened to “80/20”. The short version hides two
        details that matter: which zones you count, and whether you count
        sessions or minutes.
      </p>

      <h2>The three zones behind it</h2>
      <p>
        Polarized training uses a three-zone model built on two physiological
        thresholds. Zone 1 sits below the first ventilatory or{' '}
        <Link href="/learn/lactate-threshold">lactate threshold</Link> (blood
        lactate around 2 mmol/L): easy running where you can talk in full
        sentences. Zone 2 lies between the two thresholds. Zone 3 is above the
        second threshold (around 4 mmol/L, close to{' '}
        <Link href="/learn/critical-speed">critical speed</Link>), where
        intervals live.
      </p>
      <p>
        Watch out for the name clash. In the five-zone systems on most watches,
        “<Link href="/learn/zone-2">zone 2</Link>” means easy endurance, which
        falls inside zone 1 of the three-zone model. Polarized training does not
        tell you to avoid easy zone 2 runs; it tells you to spend little time
        between the thresholds.
      </p>

      <h2>Putting a number on it</h2>
      <p>
        Treff and colleagues (2019) proposed a polarization index to tell a
        polarized distribution from the others, using the fraction of training
        time (or distance) in each of the three zones:
      </p>
      <Formula
        where={[
          'Z1, Z2, Z3 = fraction of total training time in each zone (0.80 for 80%), Z1 + Z2 + Z3 = 1',
          'Valid when Z1 > Z3 > Z2. If Z3 = 0, PI = 0. If Z2 = 0, use 0.01 for Z2 and Z3 − 0.01 for Z3',
          'PI > 2.00: polarized. PI ≤ 2.00: not polarized',
        ]}
      >
        PI = log10(Z1 / Z2 × Z3 × 100)
      </Formula>

      <h2>A worked example</h2>
      <p>
        A runner trains 8 hours a week. Over a month, time in zones averages 80%
        in zone 1, 5% in zone 2 and 15% in zone 3.
      </p>
      <ul>
        <li>Z1 / Z2 = 0.80 / 0.05 = 16</li>
        <li>16 × 0.15 × 100 = 240</li>
        <li>PI = log10(240) = 2.38, above 2.00: polarized</li>
      </ul>
      <p>
        Change the mix to 75% / 20% / 5%, a pyramid with plenty of tempo running
        and few intervals: PI = log10(0.75 / 0.20 × 0.05 × 100) = log10(18.75) =
        1.27. A threshold-heavy block at 60% / 35% / 5% gives 0.93. Same weekly
        hours, three very different weeks.
      </p>

      <h2>Sessions or minutes</h2>
      <p>
        Seiler’s 80/20 counts sessions. Time in zone gives a different picture,
        because a hard session is mostly warm-up, recoveries and cool-down. A
        70-minute session of 5 × 4' at 3K to 5K pace has 20 minutes of work, and
        with heart rate lagging behind pace, fewer than that are recorded in
        zone 3. Seiler and Kjerland (2006) measured both ways in eleven junior
        cross-country skiers over 32 days: by heart rate, their endurance
        sessions split 75% / 8% / 17% across the three zones, and session RPE
        gave almost the same result. Four easy hour-long runs plus that interval
        session make a week that is 80/20 by sessions, but only 20 of its 310
        minutes, about 6%, are hard. Neither is wrong, but compare like with
        like.
      </p>

      <h2>How to use it</h2>
      <p>
        For a runner with five or six sessions a week, a polarized week can look
        like this: three or four easy runs and a long run, all below the first
        threshold, plus one or two hard sessions such as 5 × 4' or 6 × 3' at 3K
        to 5K pace with equal jog recoveries. The easy days have to stay easy,
        which for most people means slower than they would like; set the ceiling
        with the{' '}
        <Link href="/tools/heart-rate-zones">heart rate zone calculator</Link>{' '}
        or the talk test. OpenAthlete’s statistics show the share of training
        below, between and above your thresholds, which is enough to check which
        kind of week you actually ran.
      </p>

      <h2>Limits</h2>
      <p>
        The strongest controlled support comes from Stöggl and Sperlich (2014):
        48 well-trained runners, cyclists, triathletes and skiers spent nine
        weeks on one of four programmes, and the polarized group improved
        VO2peak by 11.7% and time to exhaustion by 17.4%, more than the
        high-volume, threshold or interval groups. Nine weeks and 48 athletes
        split across four groups is a short and small study, and its subjects
        were already fit. Seiler (2010) himself frames the 80/20 pattern as
        descriptive: it is what successful athletes converge on, not proof that
        it is optimal for everyone. A runner with four hours a week may gain
        more from some threshold work than from strict polarization; that
        question is still open. Finally, the zones depend on thresholds you have
        to test or estimate, and a 10 bpm error moves minutes from one zone to
        the next.
      </p>
    </div>
  );
}
