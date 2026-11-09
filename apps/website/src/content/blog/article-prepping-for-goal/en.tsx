import Link from 'next/link';

import { Sources } from './sources';

export function ContentEn() {
  return (
    <div>
      <p>
        A 16-week marathon plan assumes 16 normal weeks. The odds of getting
        them are poor. Somewhere in there will be a cold, a work trip, a child
        who stops sleeping or a week where the job eats every evening. A plan
        that only works if nothing goes wrong is not much of a plan. What
        matters is knowing, before it happens, what to protect and what to let
        go.
      </p>

      <h2>Know which sessions carry the week</h2>
      <p>
        Most plans have two or three key sessions a week: one quality session
        (threshold or intervals, say 5 × 4&apos; at threshold on Tuesday), the
        long run, and sometimes a second quality session or some marathon-pace
        work. Everything else is easy running that supports them. When the week
        goes wrong, protect the key sessions and sacrifice the easy runs. A
        missed 40-minute jog changes nothing about your marathon.
      </p>

      <h2>A missed session or two</h2>
      <p>
        Do not stack. If Tuesday&apos;s threshold session falls through, move it
        to Wednesday or Thursday only if there are still about 48 hours before
        your next hard effort. Never put it the day before the long run. If it
        does not fit, drop it and pick up the plan as written. The same goes for
        the long run: move it to the next free day if that does not crash into
        another key session, otherwise skip it. Two long runs in one week to
        catch up is how a missed session becomes a missed month.
      </p>

      <h2>Illness</h2>
      <p>
        The rule most runners know is the &quot;neck check&quot;: symptoms above
        the neck only (runny nose, mild sore throat), and an easy short run is
        probably fine; fever, aches, chest symptoms or a stomach bug, and you do
        not train. It is clinical common sense more than a tested rule, but it
        errs on the right side. With a fever, do not run at all.
      </p>
      <p>
        Coming back, my rule of thumb is as many easy days as you had sick days,
        before the first real session, and that first session is a shortened
        one: 3 × 6&apos; at threshold rather than the 5 × 5&apos; on the plan.
        Do not try to make up the lost sessions. You rejoin the plan at the week
        it is now, not the week you left.
      </p>
      <p>
        It is also worth noticing when you get ill. The IOC consensus on load
        and illness lists rapid changes in training load, psychological stress
        and travel among the factors linked to illness in athletes (Schwellnus
        et al., 2016). A cold in the week after a big jump in volume and a hard
        week at work is not bad luck.
      </p>

      <h2>Travel</h2>
      <p>
        Travel days are load, even when you sit still for most of them: early
        alarms, bad sleep, airport food, hours in a seat. Plan them as rest or
        easy days. Crossing time zones adds jet lag, and the body clock takes
        several days to adjust, usually longer when flying east (Waterhouse et
        al., 2007). Do not schedule a key session for the day after a long
        flight.
      </p>
      <p>
        On a business trip, run by time rather than distance in an unknown city,
        and do not fight a hotel treadmill over pace. A week of easy 30-minute
        runs keeps more fitness than you think, and the key session can wait
        until you are home.
      </p>

      <h2>Missed weeks: what you actually lose</h2>
      <p>
        Fitness fades more slowly than it feels. Reviews of detraining show that
        a few days to two weeks of reduced training cost relatively little,
        while aerobic capacity and endurance performance drop more clearly after
        two to four weeks of stopping completely (Mujika and Padilla, 2000). And
        if you can keep a little intensity, you can keep most of your endurance
        on much less volume for a while (Spiering et al., 2021).
      </p>
      <p>
        From that, here is how I adjust. These are coaching rules, not lab
        results.
      </p>
      <ul>
        <li>
          Up to about five days lost: carry on with the plan, and skip or
          shorten the next hardest session.
        </li>
        <li>
          One to two weeks lost: one week of rebuilding (easy running plus one
          short quality session), then rejoin the plan at the current week with
          the long run capped 20 to 30 minutes below what was planned.
        </li>
        <li>
          Three weeks or more, or two weeks lost within the last six before the
          race: reconsider the goal. A slower target time, a switch to the half
          marathon or another race later in the season are all better than
          racing a time your training no longer supports.
        </li>
      </ul>
      <p>
        Whatever happens, do not steal from the taper. A meta-analysis found the
        best results with a taper of about two weeks, volume reduced by 41 to
        60% and intensity kept (Bosquet et al., 2007). If weeks go missing, take
        them out of the build. Training through the taper to catch up arrives at
        the start line tired and no fitter.
      </p>

      <h2>An example: flu in week 9</h2>
      <p>
        A runner is aiming for a marathon at the end of week 16. In week 9, flu:
        fever from Tuesday to Thursday, feeling human again by Sunday.
      </p>
      <ul>
        <li>
          Week 9: the threshold session and the 2-hour long run are deleted, not
          moved. Moving them would only pile them onto week 10.
        </li>
        <li>
          Week 10: Monday to Wednesday, easy runs of 30 to 40 minutes. Thursday,
          3 × 6&apos; at threshold. Saturday, a 1h30 long run instead of 2h05.
        </li>
        <li>
          Week 11: back to the plan, but the long run is 1h50 instead of 2h15.
        </li>
        <li>
          Week 12 was a planned lighter week. Week 9 was not training, but it
          was not rest either, so week 12 becomes a moderate week rather than a
          full recovery week.
        </li>
        <li>
          Week 13: 2h15 with 2 × 20&apos; at goal marathon pace. If that pace
          feels controlled at the usual heart rate, the goal stands. If not, the
          goal pace is adjusted now, not on race day.
        </li>
        <li>Weeks 15 and 16: the taper is left alone.</li>
      </ul>

      <h2>Adjusting a plan in OpenAthlete</h2>
      <p>
        In the OpenAthlete calendar, you drag across the days you will not train
        and mark them as an Illness, Injury or Travel period. If the period
        covers sessions still to do, OpenAthlete asks whether to move them after
        the period or delete them. You can also shift the rest of a week by a
        day, or copy and paste a week, and undo either. Changes reach your
        Garmin, Suunto or COROS watch. Each week shows its load against a range
        built from your recent weeks, and form is projected over the sessions
        left, so you can see what the adjusted plan does before race day. The
        periods are described on the{' '}
        <Link href="/features/training-calendar">training calendar page</Link>.
        If you use Claude or ChatGPT, telling it &quot;I&apos;ve had a fever
        since yesterday&quot; through the{' '}
        <Link href="/features/mcp-server">MCP server</Link> records the period
        and adapts the next sessions.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
