import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Two runs, same loop, same 5:00/km, same average heart rate of 148 bpm.
        On Tuesday it felt like a 3 out of 10. On Thursday, after two short
        nights and a long day at work, it felt like a 6. Your watch files them
        as identical sessions. Your body does not.
      </p>

      <p>
        Heart rate and rating of perceived exertion (RPE) are both measures of
        internal load: how hard the work was for you, as opposed to external
        load, the work itself (distance, pace, power). The distinction comes
        from Impellizzeri, Marcora and Coutts, who argue that internal load is
        what drives adaptation and that the two should be tracked side by side (
        <a href="https://doi.org/10.1123/ijspp.2018-0935">
          Int J Sports Physiol Perform, 2019
        </a>
        ). Heart rate and RPE look at internal load from different angles, and
        they disagree often enough that the disagreement is worth reading.
      </p>

      <h2>What heart rate actually tells you</h2>
      <p>
        Heart rate is the cardiovascular response to the work. Over steady
        efforts of a few minutes or more it tracks intensity well, which is why
        heart-rate zones and TRIMP-style load scores work for most endurance
        training. But it responds to more than intensity.
      </p>
      <p>
        It lags. At the start of a 4-minute interval, heart rate needs a minute
        or two to catch up with the effort, so it underestimates short reps and
        says almost nothing useful about a 30-second hill sprint. It drifts. In
        a long run at constant pace, heart rate climbs slowly as stroke volume
        falls, more so in the heat or when you are dehydrated; Coyle and
        González-Alonso review the mechanisms (
        <a href="https://pubmed.ncbi.nlm.nih.gov/11337829/">
          Exerc Sport Sci Rev, 2001
        </a>
        ). It moves with caffeine, illness, altitude and stress. And the number
        on your wrist may simply be wrong: in a comparison against ECG, wrist
        optical sensors were less accurate than a chest strap, with accuracy
        varying by device and activity (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ).
      </p>

      <h2>What RPE adds</h2>
      <p>
        RPE is your brain's summary of everything at once: breathing, legs,
        heat, motivation, how much attention the session demanded. Carl Foster's
        session-RPE method turns it into a load number: rate the whole session
        on Borg's 0–10 scale about 30 minutes after finishing, multiply by the
        duration in minutes (Foster et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/11708692/">
          J Strength Cond Res, 2001
        </a>
        ). A 50-minute easy run at 3 gives 150 arbitrary units; a 70-minute
        threshold session with 5 × 4' at 7 gives 490.
      </p>
      <p>
        On average, the two methods agree. In young soccer players, session-RPE
        load correlated with three heart-rate-based load methods with individual
        correlations between about 0.50 and 0.85 (Impellizzeri et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/15179175/">
          Med Sci Sports Exerc, 2004
        </a>
        ). In junior cross-country skiers, heart rate and session RPE gave
        almost the same intensity distribution, about three quarters of sessions
        in the easy zone (Seiler and Kjerland,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/16430681/">
          Scand J Med Sci Sports, 2006
        </a>
        ). Correlations in that range also mean they regularly part ways on
        individual sessions. That is where they become useful.
      </p>

      <h2>Reading the disagreement</h2>
      <p>
        <strong>Heart rate normal, RPE higher than usual.</strong> The Thursday
        run above. The cardiovascular system did the same job, but the session
        cost more. Poor sleep, mental fatigue, accumulated training and early
        illness all push RPE up before they show in heart rate. One session like
        this is noise. Three in a week, on easy runs, is a reason to make the
        next hard session easier or move it.
      </p>
      <p>
        <strong>Heart rate higher than usual, RPE normal.</strong> Usually the
        environment or the sensor: heat, humidity, a double espresso, a loose
        watch strap. Check the conditions before concluding anything about
        fitness. If it persists over cool days, and especially with a raised
        resting heart rate, consider illness.
      </p>
      <p>
        <strong>Heart rate lower than usual, RPE higher.</strong> The pattern to
        take seriously, particularly if you can't get your heart rate up in
        intervals. It is one of the signs described in overreached athletes in
        the ECSS/ACSM consensus on overtraining (Meeusen et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/23247672/">
          Med Sci Sports Exerc, 2013
        </a>
        ), though the same paper is clear that no single marker diagnoses it.
        Rest a few days and see whether both numbers return to normal.
      </p>
      <p>
        <strong>Both lower for the same pace.</strong> You are getting fitter.
        Enjoy it, and resist the urge to speed up all your easy runs.
      </p>

      <h2>Which one to use when</h2>
      <p>
        For easy runs and long runs, a heart-rate ceiling is the simplest way to
        keep easy days easy, provided you allow for drift in the last hour. For
        intervals of 5 minutes or less, use pace or power for the target and RPE
        as a check; heart rate arrives too late to steer a rep. For races and
        long mountain days, RPE is the only measure that takes in the heat, the
        climb and the 40 km already in your legs.
      </p>
      <p>
        For load, keep both. TRIMP from heart rate gives you a number that does
        not depend on your mood; session RPE catches the sessions where
        everything else in your life made the run harder. When the two trends
        diverge for a week or more, something outside training has changed.
      </p>

      <h2>This week</h2>
      <p>
        After every session, wait half an hour, ask yourself "how hard was that
        session as a whole?" and write down a number from 0 to 10. Note the
        average heart rate next to it. Pick one easy loop you run often and
        compare the pairs at the end of the week. You don't need more than that
        to start seeing which days your heart rate told the full story and which
        days it didn't.
      </p>

      <p>
        OpenAthlete stores both for each activity: heart-rate TRIMP from your
        watch data and, once you enter an RPE, the session-RPE load next to it.
        If you turn on the AI features, a few short questions after each
        activity fill in the RPE and note any pain for you or your coach. It is
        free; see how the numbers are combined on the{' '}
        <Link href="/features/training-load">training load page</Link>, or set
        your zones first with the{' '}
        <Link href="/tools/heart-rate-zones">heart rate zone calculator</Link>.
      </p>
    </div>
  );
}
