import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        "Listen to your body" is good advice that gets used to justify almost
        anything. You feel great on Monday, so the easy run becomes a tempo.
        Tuesday's intervals get skipped because you're a bit flat. Wednesday is
        nice weather, so you add 5 km. A month in, you've trained a lot and
        progressed very little, and every session has been somewhere between
        moderate and hard.
      </p>
      <p>
        That is not listening to your body. It is training on mood. The two look
        similar from the inside, and the difference is the most common thing I'd
        change in a self-coached runner's training.
      </p>

      <h2>Two kinds of feeling</h2>
      <p>
        One kind of feeling is a signal: pain that changes how you run, a
        resting heart rate well above normal, a warm-up where your legs won't
        wake up and the effort for an easy pace is clearly too high, symptoms of
        illness. These are reasons to change the plan, and ignoring them is how
        runners get hurt.
      </p>
      <p>
        The other kind is a preference: wanting to go hard because it's sunny,
        not wanting to do intervals because they're unpleasant, wanting to race
        your friend on the easy run. These have nothing to do with how well
        you'll absorb training. Following them consistently pushes almost every
        runner in the same direction: easy days too hard, hard days not hard
        enough.
      </p>

      <h2>Why mood-based training stalls</h2>
      <p>
        Well-trained endurance athletes tend to do most of their sessions
        clearly easy and a smaller share clearly hard. In junior cross-country
        skiers, about three quarters of sessions were in the easy zone, and
        surprisingly little was done around threshold (Seiler and Kjerland,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/16430681/">
          Scand J Med Sci Sports, 2006
        </a>
        ). The exact best distribution is still debated, but the separation
        between easy and hard is a constant.
      </p>
      <p>
        Training on mood erases that separation. When you feel good, you speed
        up; when you feel tired, you still run, just a bit slower. You end up
        with a week of medium days. Carl Foster quantified something close to
        this with his monotony index: weeks where daily load barely varies,
        combined with high total load, were followed by more illness in his
        athletes (
        <a href="https://doi.org/10.1097/00005768-199807000-00023">
          Med Sci Sports Exerc, 1998
        </a>
        ).
      </p>
      <p>
        There's also the simple problem of progression. Getting faster over 10
        km or a marathon depends on doing specific sessions repeatedly and
        building them up over weeks: 5 × 4' at threshold becoming 4 × 6', long
        runs growing by 15 minutes every other week. If whether a session
        happens depends on the day's mood, that build-up never happens.
      </p>

      <h2>Adjusting a plan is not abandoning it</h2>
      <p>
        None of this means following a plan blindly. There is research on
        letting daily readings steer training. In one study, moderately fit men
        whose hard sessions were scheduled based on their morning heart rate
        variability were compared with a group on a fixed plan (Kiviniemi et
        al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/17849143/">
          Eur J Appl Physiol, 2007
        </a>
        ). The HRV-guided group did well, though the abstract reports no
        significant difference between groups in the change in VO2peak. The
        studies are small, and the takeaway is modest: adjusting to real signals
        is at least as good as rigid planning, not a shortcut to faster
        progress.
      </p>
      <p>
        The difference with mood-based training is that the rules are decided in
        advance, and they mostly make sessions easier, not harder. A workable
        version for most runners:
      </p>
      <ul>
        <li>
          Resting heart rate clearly above your usual for two mornings, or signs
          of illness: replace the hard session with an easy run or rest.
        </li>
        <li>
          Pain that changes your stride: stop, and don't run through it the next
          day.
        </li>
        <li>
          Warm-up feels wrong (the effort for your easy pace is two or more
          points higher than usual on the 0–10 scale): do the session at the
          bottom of the target range, or cut a rep.
        </li>
        <li>
          Feeling great: do the planned session well. Don't add reps, don't
          speed up the easy run.
        </li>
        <li>
          Life gets in the way: move the key session to another day, and drop an
          easy run rather than the key session.
        </li>
      </ul>
      <p>
        Notice that "I don't feel like it" is not on the list. On those days,
        start the warm-up. Most of the time the reluctance disappears after 15
        minutes. If it doesn't and the warm-up rule applies, you have a real
        reason.
      </p>

      <h2>Make the plan easy to follow</h2>
      <p>
        Much of the discipline is logistics. If you have to remember the
        workout, calculate paces and decide on the spot, the session is already
        up for negotiation. If it's on your watch with targets, you start it and
        follow the beeps. Write the week on Sunday, put the key sessions on days
        you can protect, and keep the decision out of the moment.
      </p>
      <p>
        Then log how each session felt, honestly, on the 0–10 scale. Over a few
        weeks that record shows whether the plan suits you: easy runs that keep
        coming out at 5 mean the plan is too fast, or your life is heavier than
        it looks.
      </p>

      <h2>This week</h2>
      <p>
        Write your adjustment rules down before Monday, three to five lines like
        the list above. Then follow the plan as written unless one of them
        applies, and note each time you changed something and why. At the end of
        the week, count how many changes were signals and how many were mood.
      </p>

      <p>
        OpenAthlete is a free tool for exactly this: build structured sessions
        in the <Link href="/features/workout-builder">workout builder</Link>,
        send them to a Garmin, Suunto or COROS watch, move a session or mark an
        illness period in the calendar, and log RPE after each activity. See{' '}
        <Link href="/features/watch-sync">watch sync</Link> for how workouts
        reach your watch.
      </p>
    </div>
  );
}
