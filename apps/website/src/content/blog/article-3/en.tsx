import Link from 'next/link';

import { Sources } from './sources';

export function ContentEn() {
  return (
    <div>
      <p>
        Ask ten runners why they got hurt and most will name a cause: new shoes,
        the track session, the downhill race, "doing too much too soon". Ask the
        research and the answer is less tidy. The link between training load and
        running injuries is real, but it is weaker, noisier and more individual
        than the dashboards in most training apps suggest. This article is about
        what the evidence actually supports, and where it runs out.
      </p>

      <h2>How often runners get hurt</h2>
      <p>
        A systematic review of distance runners found yearly injury rates
        anywhere between 19% and 79% depending on the study (van Gent et al.,
        2007). That spread says as much about how differently studies define an
        injury as it does about running. Counting per hour of running is more
        useful: a later meta-analysis put novices at roughly 18 injuries per
        1,000 hours against about 8 for recreational runners (Videbæk et al.,
        2015). Beginners get hurt about twice as often for the same time on
        their feet, which is the first clue that what matters is the gap between
        what you do and what your body is used to.
      </p>
      <p>
        The most consistent risk factor across studies is not mileage or pace.
        It is a previous injury (van der Worp et al., 2015). If you have had an
        Achilles problem before, that tendon deserves more caution than any
        ratio on a chart.
      </p>

      <h2>Load against capacity</h2>
      <p>
        The most useful way to think about overuse injuries comes from Bertelsen
        and colleagues (2017). An injury happens when the load on a specific
        structure, say the tibia or the plantar fascia, exceeds what that
        structure can tolerate, repeatedly, over a period of time. Two things
        move: the load you apply, and the capacity of the tissue, which goes up
        with gradual training and down with poor sleep, low energy intake,
        illness or a previous injury.
      </p>
      <p>
        That framework exposes the main weakness of every load metric. Your
        watch measures time, distance and heart rate. Your tibia does not care
        about heart rate. A two-hour trail run with 1,200 m of descent and a
        two-hour flat run at the same average heart rate give a similar TRIMP,
        but your quadriceps and knees will tell you they were not the same day.
        Training load numbers describe the cost to your cardiovascular system
        quite well. They describe the cost to a given tendon or bone only
        indirectly.
      </p>

      <h2>What the running studies show</h2>
      <p>
        There are fewer good studies on runners than you would expect, and most
        follow novices. Three are worth knowing.
      </p>
      <p>
        In a Danish cohort of 874 novice runners wearing GPS watches, those who
        increased their weekly distance by more than 30% over two weeks had a
        higher rate of "distance-related" injuries (patellofemoral pain,
        iliotibial band syndrome, shin splints and a few others) than those who
        stayed under 10% (Nielsen et al., 2014). The overall injury rate did not
        differ between groups, and even the specific finding was borderline
        statistically. The authors called the study exploratory.
      </p>
      <p>
        In a Dutch randomised trial, 532 novices preparing for a 6.7 km race
        followed either a standard 8-week plan or a gentler 13-week plan built
        on the 10% rule. Injury rates were almost identical: 20.8% and 20.3%
        (Buist et al., 2008).
      </p>
      <p>
        In the Run Clever trial, 447 recreational runners progressed either the
        volume or the intensity of their running for 16 weeks. The researchers
        expected each approach to produce its own type of injury. They found no
        difference (Ramskov et al., 2018).
      </p>
      <p>
        Put together: big, sudden jumps probably matter, especially for
        beginners. Fine-tuning the rate of progression below that has not been
        shown to change much. For what that means in practice, week by week, see{' '}
        <Link href="/blog/injury-prevention-2-when-algorithms-predict-the-break">
          how fast to increase your mileage
        </Link>
        .
      </p>

      <h2>The acute:chronic workload ratio, and why it is contested</h2>
      <p>
        If you have read about injury and load, you have met the acute:chronic
        workload ratio (ACWR): last week's load divided by your average weekly
        load over the last four weeks. It grew out of studies on cricket fast
        bowlers (Hulin et al., 2014) and was popularised by Tim Gabbett's 2016
        paper on the "training-injury prevention paradox", which described a
        "sweet spot" between 0.8 and 1.3 and a danger zone above 1.5 (Gabbett,
        2016). Within a few years those numbers were in apps, coaching courses
        and plenty of blog posts, including an earlier version of this one.
      </p>
      <p>The critique arrived just as fast.</p>
      <ul>
        <li>
          In the usual calculation, last week is part of both the numerator and
          the denominator. Lolli and colleagues (2019) showed that this
          mathematical coupling creates a correlation on its own, even with
          random data.
        </li>
        <li>
          Impellizzeri and colleagues (2020) argued that dividing by chronic
          load assumes a relationship between the two that was never tested,
          that the ratio behaves differently depending on whether you use
          rolling or exponentially weighted averages, and that the thresholds
          were drawn from a few team-sport samples, then applied to everyone. A
          year later they went further and recommended dismissing the ACWR and
          its underlying theory (Impellizzeri et al., 2021).
        </li>
        <li>
          Most ACWR studies are observational, in team sports, with a modest
          number of injuries. A variable associated with injury across a group
          does not predict which individual will get hurt. Roald Bahr made that
          point about screening tests in general, and it applies here too (Bahr,
          2016).
        </li>
      </ul>
      <p>
        My reading: the idea underneath the ACWR, that you should not suddenly
        do much more than you have recently been doing, is old, sensible and
        consistent with the running data above. The precise thresholds are not
        established. Treat "1.5" as folklore, not physiology, and be wary of
        anything that turns your training into a single injury-risk percentage.
      </p>

      <h2>What to do with all this</h2>
      <p>
        Uncertain evidence is not a reason to ignore load. It is a reason to use
        it for what it is good at: noticing that this week is very different
        from the last few, and asking why.
      </p>
      <p>
        Look at the changes that load metrics miss. A first track session in
        months, a race with a lot of descent, new shoes with a lower drop, a
        switch from trails to tarmac: each loads specific tissues in a new way
        even if the weekly total barely moves. Change one of those at a time.
      </p>
      <p>
        Take self-reports seriously. A systematic review found that how athletes
        say they feel (mood, fatigue, soreness) responded to training more
        reliably than common objective markers such as heart rate or blood tests
        (Saw et al., 2016). Write down pain the day it appears, with a word on
        where and how bad. Pain that changes how you run, that is worse the next
        morning, or that sits on one precise spot of a bone is a reason to stop
        and get it looked at, whatever any chart says.
      </p>
      <p>
        And account for capacity. A bad week of sleep, a stomach bug or a
        stretch of eating too little lowers what your tissues can handle. The
        same training plan is not the same load for the same runner in every
        month of the year.
      </p>

      <h2>Where OpenAthlete fits</h2>
      <p>
        OpenAthlete does not predict injuries and does not give you a risk
        score. It shows the numbers this article argues are worth watching, side
        by side. Each session gets a load from heart rate (TRIMP), with session
        RPE next to it. Fitness, fatigue and form are drawn over your past
        training and projected over the sessions you have planned, and each week
        shows its load against a range built from your recent weeks, which is a
        rule of thumb, not a safety limit. After an activity, a few optional
        questions record how hard it felt and any pain you mention; that pain
        goes into an injury log your coach sees. The details and formulas are on
        the <Link href="/features/training-load">training load page</Link>.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
