import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        A modern running watch records a lot: GPS track, pace, heart rate,
        cadence, sometimes power, plus sleep and heart rate variability
        overnight. Then it hands you conclusions: a VO2max estimate, a recovery
        time, a readiness score, a training status that says "productive" or
        "unproductive". The measurements are mostly good. The conclusions are
        where you need to be careful, because the watch is missing most of what
        a coach would want to know.
      </p>

      <h2>What the watch measures and what it estimates</h2>
      <p>
        Time, distance and pace from GPS are reliable enough for training, apart
        from tall buildings, tree cover and tight track bends. Heart rate is
        measured, but how well depends on the sensor. In a study against ECG,
        wrist optical sensors were less accurate than a chest strap, and
        accuracy varied with the device and the type of exercise (Gillinov et
        al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ). In practice, optical sensors do fine on steady runs and struggle with
        intervals, cold weather and loose straps.
      </p>
      <p>
        Everything else is an estimate built on those inputs. Calories are the
        clearest example: a Stanford study of seven wrist devices found that
        most measured heart rate with a median error under 5% on the bike, but
        none estimated energy expenditure with an error below 20% (Shcherbina et
        al.,{' '}
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5491979/">
          J Pers Med, 2017
        </a>
        ). VO2max, recovery time and readiness scores come from proprietary
        algorithms that manufacturers describe in general terms but do not
        publish in a way you can check. They can be useful trends. They are not
        measurements.
      </p>

      <h2>What the watch doesn't know</h2>
      <p>
        It doesn't know what the session was supposed to be. A 10 km run at
        4:45/km is a good tempo for one runner and a mistake for another who had
        an easy run planned. Without the plan, there's nothing to compare
        against.
      </p>
      <p>
        It doesn't know how the session felt. Perceived exertion is often the
        first thing to change when fatigue builds up, before heart rate or pace
        do. A systematic review found that athletes' self-reported measures
        responded to training load more sensitively and consistently than
        objective markers, resting heart rate included (Saw et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/26423706/">
          Br J Sports Med, 2016
        </a>
        ). Some watches now ask for a rating after a run; if yours does, use it.
      </p>
      <p>
        It doesn't know your life. Mental fatigue raises perceived effort
        without changing heart rate or lactate, at least in lab conditions (
        <a href="https://pubmed.ncbi.nlm.nih.gov/28044281/">
          Van Cutsem et al., Sports Med, 2017
        </a>
        ). Work stress, a newborn, a long-haul flight: the watch may pick up
        part of it through sleep and HRV, but it can't know why.
      </p>
      <p>
        It doesn't know about the niggle in your Achilles, the race in eight
        weeks, or the fact that you're coming back from three weeks off. It will
        happily call you "unproductive" during a taper.
      </p>

      <h2>Use it for what it's good at</h2>
      <p>
        Trust the measurements, question the conclusions. For sessions where
        heart rate matters, a chest strap is worth the money. Look at readiness
        and HRV trends over a week or more, not as a daily verdict: a low score
        after a good night's sleep with fresh legs is probably the algorithm
        being wrong, not you.
      </p>
      <p>
        Add the context yourself. After each session, a rating from 0 to 10 and
        one line of notes ("calves tight", "hot, 28 °C", "slept badly") take
        thirty seconds and make your data readable a month later. Once a week,
        compare what you did with what you planned: sessions done, missed,
        changed, and why.
      </p>
      <p>
        And keep the plan somewhere other than your head. The watch's own
        suggested workouts are built from its estimates and don't know your goal
        race beyond what you entered. A plan written by you or a coach, with key
        sessions placed around your life, gives the data something to be
        measured against.
      </p>

      <h2>This week</h2>
      <p>
        Pick one estimate your watch gives you (training status, recovery time
        or readiness) and write it down each day next to your own 0–10 rating of
        how fresh you feel. At the end of the week, see how often they agreed.
        You'll know how much weight to give that number.
      </p>

      <p>
        OpenAthlete is a free platform that sits on top of your watch: it
        imports activities from Garmin, COROS, Suunto, Polar and Strava (or FIT,
        GPX and TCX files), puts them next to the planned session, and keeps
        RPE, heart-rate TRIMP and sleep and HRV from your device on the same
        calendar. Structured workouts can be sent to Garmin, Suunto and COROS
        watches. See <Link href="/features/watch-sync">watch sync</Link> and{' '}
        <Link href="/features/training-load">training load</Link>.
      </p>
    </div>
  );
}
