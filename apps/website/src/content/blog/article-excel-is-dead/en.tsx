import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Plenty of good coaches run their whole practice from a spreadsheet. One
        tab per athlete, one row per day, a colour for each kind of session, and
        a column for comments that the athlete fills in, or doesn't. It's free,
        it bends to any method, and nobody can take it away from you. The title
        of this post is a bit unfair: Excel isn't dead, and for some coaches
        it's still the right tool.
      </p>
      <p>
        It does have costs, though, and they grow with the number of athletes in
        ways that are easy to miss. This post goes through them, shows how to
        get more out of a spreadsheet if you stay, and where dedicated software
        starts to earn its place.
      </p>

      <h2>Where the spreadsheet works</h2>
      <p>
        With three to five athletes you know well, who train mostly by feel and
        send you a message after key sessions, a spreadsheet is hard to beat.
        You can write anything in a cell: "6 × 1 km at 10K pace, 90'' jog, stop
        at 4 if the calves complain" is a perfectly good prescription, and no
        software will force you into its own vocabulary. Sharing is easy with
        Google Sheets, history stays where you put it, and there's no
        subscription.
      </p>

      <h2>Where it starts to cost</h2>
      <p>
        The first cost is on the athlete's side. A session written in a cell has
        to be retyped into Garmin Connect or the COROS app to appear on the
        watch, or remembered during the run. Most athletes do it for the key
        session of the week and skip it for the rest, which means the threshold
        run gets done at the pace they remember, not the one you wrote.
      </p>
      <p>
        The second is the loop back. To compare what was planned with what was
        done, someone has to copy the run from Strava or the watch app into the
        sheet: distance, time, maybe average heart rate. Either the athlete does
        it, inconsistently, or you do, on Sunday evening. Either way you get a
        summary of the session, not the session: you see that the 6 × 1 km
        averaged 4:05/km, not that the last two reps were at 4:15 with heart
        rate climbing.
      </p>
      <p>
        The third is change. A race moves by two weeks, an athlete is ill for
        five days, a trip to the mountains replaces a block of track work. In a
        spreadsheet you rewrite rows by hand, check that the weekly totals still
        make sense, and hope the athlete opened the latest version and not the
        one attached to last Tuesday's email.
      </p>
      <p>
        The fourth is load. Most coaches who stay on spreadsheets track volume
        (kilometres, hours) and little else, because anything more means
        formulas and data entry. Volume alone hides a lot: 60 km of easy running
        and 60 km with two quality sessions are not the same week.
      </p>

      <h2>If you stay on a spreadsheet, do it well</h2>
      <p>A few habits fix most of the above without changing tools.</p>
      <ul>
        <li>
          Use one shared online sheet per athlete instead of files sent by
          email. There is then only one version, and the athlete sees changes as
          soon as you make them.
        </li>
        <li>
          Add two columns the athlete fills after each session: duration in
          minutes and effort on a 0 to 10 scale. Multiply them and you have
          Foster's session RPE (Foster et al., 2001), a load measure that needs
          no device at all: 50 minutes at RPE 6 is 300. Sum it by week and you
          can see a block building, or a week that went too far.
        </li>
        <li>
          Keep a template for each recurring session ("threshold 5 × 4'", "long
          run with the last 20' at marathon pace") and copy it rather than
          retyping it. Fewer typos, and the athlete learns the vocabulary.
        </li>
        <li>
          Ask for one line of comment per session, not a paragraph. "Legs heavy,
          left Achilles stiff in the morning" is what you need to catch a
          problem early.
        </li>
      </ul>
      <p>
        With these, a spreadsheet does a decent job for a handful of athletes.
        It still won't put the session on the watch, and it still relies on
        people typing numbers that already exist somewhere else.
      </p>

      <h2>What software changes</h2>
      <p>
        The point of a coaching platform isn't the charts. It's that the data
        moves without anyone copying it. You write the session once, with
        targets taken from the athlete's own zones; it goes to their watch; the
        activity comes back on its own after the run and sits next to the plan,
        step by step. When a race moves, you drag the block to a new date and
        the watch follows. Load is computed from every session, whether anybody
        remembered to fill in a column or not.
      </p>
      <p>
        It isn't free of costs either. You'll spend an evening or two rebuilding
        your usual sessions as templates, some of your athletes will need help
        connecting their watch, and you give up a little of the freedom of the
        blank cell. Whether that's worth it depends mostly on how many athletes
        you have and how often plans change. As a rough rule, the question
        becomes real somewhere past five athletes, or the first time one of them
        runs a key session from an outdated version of the plan.
      </p>

      <h2>Trying it without paying</h2>
      <p>
        OpenAthlete is free for coaches with up to five athletes, with every
        feature: calendar, workout builder, sessions sent to Garmin, Suunto and
        COROS watches, activities imported from those brands plus Polar and
        Strava, and training load from heart rate with session RPE alongside.
        Above five athletes, Supporter costs €50 a year for an unlimited roster.
        You can run it next to your spreadsheet with one or two athletes for a
        month before deciding. The <Link href="/coaches">coaches page</Link>{' '}
        shows what the coach side looks like.
      </p>

      <h2>Source</h2>
      <ul>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
      </ul>
    </div>
  );
}
