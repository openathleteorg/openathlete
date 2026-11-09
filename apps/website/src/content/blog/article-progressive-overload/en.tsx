import Link from 'next/link';

import { Sources } from './sources';

export function ContentEn() {
  return (
    <div>
      <p>
        Progressive overload is the oldest idea in training: give the body a
        little more than it is used to, let it recover, and it adapts. In
        running it usually gets reduced to &quot;add kilometres&quot;. Volume is
        one lever, and we cover it in{' '}
        <Link href="/blog/injury-prevention-2-when-algorithms-predict-the-break">
          how fast to increase your mileage
        </Link>
        . This article is about the others: how to make the sessions themselves
        progress, how to keep the easy days from spoiling it, and when to stop
        pushing.
      </p>

      <h2>Not everything adapts at the same speed</h2>
      <p>
        Your heart and muscles respond to aerobic training within weeks. Your
        tendons and bones take longer. Adult tendon tissue renews slowly, and it
        adjusts to new loading over months rather than weeks (Magnusson and
        Kjaer, 2019). That gap explains a classic: the cyclist who takes up
        running, has the aerobic engine to hold 4:30 per km from the first
        month, and has an angry Achilles by the third. The engine was ready. The
        chassis was not.
      </p>
      <p>
        The practical rule follows. When you are new to running, or coming back
        from a long break, build the habit and the impact first, and add
        intensity once the legs have had time to catch up. The pace you could
        hold is not the pace your legs are ready to repeat.
      </p>

      <h2>The levers you can pull</h2>
      <p>For a given session, you can make it harder in several ways:</p>
      <ul>
        <li>longer repetitions (4 minutes becomes 5);</li>
        <li>more repetitions (5 becomes 6);</li>
        <li>shorter recoveries (2 minutes becomes 90 seconds);</li>
        <li>a faster pace;</li>
        <li>
          a session that looks more like the race: closer to race pace, on the
          race terrain, at the time of day you will race.
        </li>
      </ul>
      <p>
        Move one lever at a time, and only move pace when the current one feels
        controlled. A good check: at the end of the last rep, you could have
        done one more at the same pace. If the last rep is a fight, the session
        is where it should be for now.
      </p>

      <h2>A threshold session over six weeks</h2>
      <p>
        Take a runner whose threshold pace is around 4:30 per km, roughly
        someone who runs 10 km in 43 to 44 minutes. Their weekly threshold
        session could progress like this:
      </p>
      <ul>
        <li>
          Week 1: 5 × 4&apos; at 4:30, 90&quot; jog (20 minutes at threshold)
        </li>
        <li>Week 2: 6 × 4&apos;, 90&quot; jog (24 minutes)</li>
        <li>Week 3: 5 × 5&apos;, 90&quot; jog (25 minutes)</li>
        <li>Week 4: lighter week, 4 × 4&apos; (16 minutes)</li>
        <li>Week 5: 4 × 7&apos;, 2&apos; jog (28 minutes)</li>
        <li>Week 6: 3 × 10&apos;, 2&apos; jog (30 minutes)</li>
      </ul>
      <p>
        The pace does not change. What progresses is the time spent at threshold
        and the length of each block, until the runner can hold 2 × 15&apos; or
        25 minutes continuous. The pace gets updated when a race or a test says
        it should, not because it is week 7 and the plan expects something new.
      </p>

      <h2>The long run</h2>
      <p>
        Progress the duration first, then the content. For a marathon build, a
        sequence could be 1h45 easy, 2h easy, 2h with the last 20 minutes at
        marathon pace, a lighter week, then 2h15 with 2 × 20&apos; at marathon
        pace, and later 2h20 with 40 minutes at marathon pace. Each step changes
        one thing. A long run that suddenly gets longer and faster on the same
        Sunday is two progressions at once.
      </p>

      <h2>Keep the easy days easy</h2>
      <p>
        Hard sessions only progress if the rest of the week lets you recover.
        Stephen Seiler&apos;s review of well-trained endurance athletes found
        that around 80% of their sessions were done at low intensity (Seiler,
        2010). Whether you follow that ratio exactly matters less than avoiding
        the common drift: as fitness improves, the easy runs creep up to a
        moderate pace, nobody notices, and the Tuesday intervals start to fall
        apart. If your easy pace has been getting faster at the same effort,
        good. If it has been getting faster because you are pushing it, slow
        down.
      </p>

      <h2>Blocks and lighter weeks</h2>
      <p>
        Most coaches, me included, organise this into blocks of three to six
        weeks with a lighter week at the end. It is worth knowing that the
        classic periodisation models rest more on tradition than on evidence
        (Kiely, 2012). What holds up is simpler: planned variation, and
        adjusting the plan to how the athlete actually responds. Plan the block.
        Adjust the week.
      </p>

      <h2>You do not have to progress every week</h2>
      <p>
        Overload is not infinite, and a block that ends with you able to handle
        3 × 10&apos; at threshold is a good place to stay for a while. Holding a
        level is cheaper than reaching it. A review on the minimum dose of
        exercise found that endurance could be maintained for up to 15 weeks
        with as few as two sessions a week, or with volume cut by a third to
        two-thirds, as long as intensity was kept (Spiering et al., 2021). Those
        data come mostly from the general population, not trained runners, but
        the direction is useful in a busy month: keep one quality session, cut
        the rest, and you lose less than you fear.
      </p>

      <h2>Signs the progression is ahead of you</h2>
      <p>
        The same session at the same pace needs a higher heart rate or feels a
        point or two harder on the effort scale than last time. You fail the
        last rep two weeks in a row. Your easy runs feel heavy. Any of these
        means holding the current level, or taking the lighter week early. When
        several come together and last, read{' '}
        <Link href="/blog/5-signs-of-overtraining-and-how-to-avoid-it">
          the signs of overreaching
        </Link>
        .
      </p>

      <h2>Doing it in OpenAthlete</h2>
      <p>
        In OpenAthlete you build a session like 5 × 4&apos; with targets from
        your own zones, a pace or a percentage of your VMA, and it is sent to
        your Garmin, Suunto or COROS watch. Copying it to next week and changing
        one repetition takes a few seconds. Planned sessions get an estimated
        load, so fitness, fatigue and form are projected over the block before
        you run it. After each session, your effort rating sits next to the
        heart rate load, which is how you spot the same workout getting harder.
        See the <Link href="/features/workout-builder">workout builder</Link>{' '}
        and the{' '}
        <Link href="/features/training-calendar">training calendar</Link>.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
