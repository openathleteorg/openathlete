import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        A taper is the stretch of lighter training before a goal race. The idea
        is old and the logic is simple: weeks of hard training leave you both
        fitter and more tired, and fatigue fades faster than fitness. Cut the
        load for a while and the fatigue drains away while most of the fitness
        stays. Get it right and you start the race fresher than you have felt in
        months. Get it wrong, by cutting too little or resting too much, and you
        arrive either still tired or slightly flat.
      </p>

      <h2>What the research says about a taper</h2>
      <p>
        Bosquet and colleagues (2007) pooled 27 studies of competitive athletes
        in running, cycling and swimming. The pattern that came out best was a
        taper of about two weeks, in which training volume is cut progressively
        by 41 to 60%, while intensity and the number of sessions per week stay
        the same. Mujika and Padilla (2003), reviewing the earlier literature,
        reached a similar recipe: keep the intensity, reduce volume
        substantially, reduce frequency by no more than about 20%, and prefer a
        progressive reduction to a sudden drop. They put the usual performance
        gain at around 3%, with a range of 0.5 to 6%.
      </p>
      <p>
        For recreational marathoners, Smyth and Lawlor (2021) looked at the
        training logs of more than 158,000 runners. Strict tapers, where volume
        falls week after week, were associated with faster finishing times than
        relaxed ones, and three-week strict tapers did best, with a median
        saving of about five and a half minutes (2.6%) over a minimal taper. It
        is observational data, so fitter, more disciplined runners may simply
        taper better, but it points the same way as the trials.
      </p>

      <h2>How a taper shows up in fitness, fatigue and form</h2>
      <p>
        The <Link href="/learn/ctl-atl-tsb">fitness-fatigue model</Link> makes
        the mechanism visible. Fitness (CTL) is an exponential average of daily
        load with a 42-day time constant, fatigue (ATL) one with a 7-day
        constant, and form (TSB) is the difference:
      </p>
      <Formula
        where={[
          'CTL weight per day = 1 − e^(−1/42) ≈ 0.024',
          'ATL weight per day = 1 − e^(−1/7) ≈ 0.133',
        ]}
      >
        CTL(today) = CTL(yesterday) + (load − CTL(yesterday)) × 0.024
      </Formula>
      <p>
        Because ATL reacts about five and a half times faster than CTL, a drop
        in load pulls fatigue down much faster than fitness, and TSB climbs.
        That is the whole taper in one line.
      </p>

      <h2>A worked example</h2>
      <p>
        A marathoner has spent three weeks at about 560{' '}
        <Link href="/learn/trimp">TRIMP</Link> a week (roughly 80 km for this
        runner, or 80 per day on average), after a base of 65 per day. To keep
        the arithmetic readable, the load is spread evenly over each week.
      </p>
      <ul>
        <li>Start of the taper: CTL 70.9, ATL 79.3, TSB −8.4.</li>
        <li>
          Two weeks out, volume drops 30% (about 56 km, 56 per day). At the end
          of that week: CTL 68.6, ATL 64.6, TSB +4.1.
        </li>
        <li>
          Race week, volume drops to 45% of the peak (about 36 per day, some 30
          km before race day). The day before the race: CTL 64.3, ATL 48.1, TSB
          +16.2.
        </li>
      </ul>
      <p>
        Over two weeks, fatigue fell by 31 points and fitness by 6.6, about 9%.
        Had the same runner stopped completely for those 13 days, CTL would have
        dropped to about 52. The model is crude, but it shows why a taper
        reduces volume rather than stopping, and why its effect builds in the
        last few days.
      </p>

      <h2>How to taper in practice</h2>
      <ul>
        <li>
          Marathon: two to three weeks. 10K or half marathon: one to two weeks.
          A B race: three or four easier days.
        </li>
        <li>
          Cut the volume progressively: around 20 to 30% the first week of a
          three-week taper, 40 to 60% by race week. Shorten the long run first.
        </li>
        <li>
          Keep the rhythm of the week and some intensity. A session such as 3 ×
          2 km at marathon pace ten days out, then 6 × 1 min a little faster
          than race pace four days out, keeps the legs used to speed without
          adding fatigue.
        </li>
        <li>
          Sleep, eat normally, and leave new shoes, new gels and new strength
          exercises for after the race.
        </li>
      </ul>
      <p>
        In OpenAthlete you can mark the weeks as a training cycle with the Taper
        phase, and the{' '}
        <Link href="/features/training-load">training load curves</Link> are
        projected over the sessions you have planned, so you see the form you
        are heading for on race day before running a single taper session.
      </p>

      <h2>Limits</h2>
      <p>
        There is no validated target TSB for race day: the number depends on how
        load is measured and on the athlete, and the best tapers in studies were
        found by performance, not by a curve. A taper cannot rescue a block that
        was too short, and it cannot fix accumulated overreaching in a week.
        Taper feelings mislead too: heavy legs and restlessness are common and
        usually gone by the start. Use the curves to plan, and how the race-pace
        sessions feel to judge.
      </p>
    </div>
  );
}
