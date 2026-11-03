import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Nobody publishes good data on why people stop paying their running or
        triathlon coach, so be wary of anyone quoting percentages. What most
        coaches will tell you from experience is less tidy: athletes rarely
        leave after one bad week. They drift. The comments get shorter, the RPE
        stops being filled in, a session is cut to 40 minutes without a word,
        the monthly call gets moved twice. By the time the cancellation email
        arrives, the decision was made weeks earlier.
      </p>
      <p>
        So retention is mostly about two things: building a relationship that
        survives a bad patch, and noticing the drift early enough to do
        something about it.
      </p>

      <h2>What the research does say</h2>
      <p>
        There is useful work on motivation in sport, even if none of it is about
        coaching businesses. Mageau and Vallerand's motivational model of the
        coach-athlete relationship (
        <a href="https://doi.org/10.1080/0264041031000140374">
          Journal of Sports Sciences, 2003
        </a>
        ) builds on self-determination theory: athletes stay motivated when they
        feel some autonomy, feel competent, and feel connected to the people
        around them. The coaching behaviours the authors associate with autonomy
        are concrete. Give a reason for what you ask. Offer choices within
        limits. Acknowledge how the athlete feels. Avoid controlling feedback
        and guilt.
      </p>
      <p>
        That maps neatly onto the three things that tend to precede a quiet
        exit: the athlete can't see that they're improving (competence), feels
        like a line in a spreadsheet (connection), or feels the plan is
        something done to them rather than with them (autonomy).
      </p>

      <h2>The first six weeks decide a lot</h2>
      <p>
        New athletes are at their most motivated and their most fragile. A few
        habits help:
      </p>
      <ul>
        <li>
          A proper intake: goals, race calendar, injury history, work and family
          constraints, which days are untouchable. Ask what made them leave
          their previous coach or plan, if they had one.
        </li>
        <li>
          A first week that's deliberately easy to get right. Nothing proves a
          point like completing every session; nothing deflates like failing the
          first threshold workout because the paces came from an old 10K.
        </li>
        <li>
          A short note on each key session saying what it's for. "The point
          today is to finish feeling you could have done one more rep" prevents
          more problems than any heart rate cap.
        </li>
        <li>
          A call or a longer message at the end of week two, while things are
          still being calibrated.
        </li>
      </ul>

      <h2>Make progress visible, on purpose</h2>
      <p>
        Endurance progress is slow and noisy. An athlete who gained 15 seconds
        per kilometre at the same heart rate over four months may not notice,
        because every individual run felt about the same. Your job is to show
        them.
      </p>
      <p>
        Pick one or two repeatable benchmarks and schedule them every six to
        eight weeks: the same 30-minute run on the same flat loop, the same hill
        at a fixed heart rate, a 5 km parkrun, a 20-minute power test on the
        bike. Put them in the calendar like any other session and comment on the
        result. Compare a month with the same month last year. Point out the
        dull wins too: twelve weeks without missing a long run is progress.
      </p>

      <h2>When an athlete goes quiet</h2>
      <p>
        Have a routine for it, so you don't have to decide each time whether
        it's worth bothering them. Something like this:
      </p>
      <p>
        <strong>Day 3 or 4 without activity or reply.</strong> A light message
        with no reproach: "Saw the week went sideways. Everything OK? No need to
        make anything up, we'll adjust."
      </p>
      <p>
        <strong>Day 7.</strong> A direct, practical question, and an easier
        option: "Would a lighter week help? I can cut it to three short runs."
        Lowering the bar is often what gets people moving again.
      </p>
      <p>
        <strong>Day 14.</strong> Ask for a short call, or offer a pause. Many
        athletes cancel because they feel guilty paying for a plan they aren't
        following. A pause option (a month or two, plan frozen, reduced or no
        fee, depending on your terms) turns some of those cancellations into a
        return.
      </p>
      <p>
        What not to do: send the same week again as if nothing happened, or
        write anything that sounds like disappointment. Life happens to
        amateurs: a new job, a sick child, a house move. The coach who says
        "fine, let's rebuild from here" is the one they come back to.
      </p>

      <h2>Let the athlete own part of the plan</h2>
      <p>
        Autonomy doesn't mean letting them write their own intervals. It means
        small, real choices: which day the long run falls on, whether Thursday
        is the track session or the hilly one, whether to race the local 10K.
        Ask for their opinion before changing the shape of a block, and explain
        your reasoning when you overrule it. Athletes who feel the plan is
        partly theirs tend to defend it on the hard days.
      </p>

      <h2>Track your own numbers</h2>
      <p>
        You don't need a CRM. A simple sheet will do: when each athlete started,
        when they left, and the reason they gave, in their words. Add a
        one-question exit survey ("What would have made you stay?") and read the
        answers once a quarter. After a year you'll know whether you lose people
        at month three, after their goal race, or in November, and that tells
        you where to put your effort. Athletes who leave after achieving their
        goal are not a failure; offering them a next objective before the race,
        not after, sometimes is.
      </p>

      <h2>Where OpenAthlete helps</h2>
      <p>
        A few things in{' '}
        <Link href="/coaches">OpenAthlete's coaching tools</Link> make the drift
        easier to see. The roster view lists athletes with no activity for
        several days or who never started, pain reported after sessions, and
        unread messages. Every session shows a coloured strip for how close it
        was to the plan, and you can require an RPE or a comment before a
        session counts as done. Races carry a target and an A/B/C priority, and
        fitness and form are projected over the planned weeks up to race day,
        which gives you something concrete to show in a monthly review. None of
        it replaces the message you write; it tells you who to write to first.
      </p>
    </div>
  );
}
