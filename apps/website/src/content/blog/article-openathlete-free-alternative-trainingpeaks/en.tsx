import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('en');

export function ContentEn() {
  return (
    <div>
      <p>
        TrainingPeaks has been the default training platform for endurance
        coaches for a long time, and for good reasons: the Performance
        Management Chart, a vocabulary (TSS, CTL, TSB) that half the sport now
        speaks, a marketplace full of plans and mature mobile apps. The reasons
        people look elsewhere are mostly about money. The free Basic account
        doesn't send planned workouts to your watch, and coaches pay for each
        athlete on Premium. Since Garmin bought TrainingPeaks on 22 July 2026,
        some also want a platform that doesn't belong to a watch maker. That
        question has its own article,
        <Link href="/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          TrainingPeaks alternatives after the Garmin acquisition
        </Link>
        ; this one sticks to price and features.
      </p>
      <p>
        This post compares four alternatives on what they cost and what they do:
        intervals.icu, Nolio, Final Surge and OpenAthlete, which we make. Prices
        come from each vendor's pricing page, checked on 3 November 2026. Prices
        in US dollars are before tax, as the vendors show them.
      </p>

      <h2>What TrainingPeaks costs</h2>
      <p>
        For an athlete, Basic is free and Premium costs {q('tpMonth')} a month
        or {q('tpYear')} a year. Sending structured workouts to your watch is a
        Premium feature, which is the main reason self-coached runners upgrade.
      </p>
      <p>
        For a coach, the entry plan is {q('tpCoach')} a month, including four
        Basic athletes and one on Premium. Each additional Premium athlete adds{' '}
        {q('tpPerMax')} a month, falling to {q('tpPerMin')} with volume, and
        there is a {q('tpSetup')} setup fee, waived with a promo code. In
        practice, a coach whose athletes all need workouts on the watch pays
        about {coachYear('trainingpeaks', 10)} a year for ten athletes and{' '}
        {coachYear('trainingpeaks', 30)} for thirty, unless the athletes pay
        their own Premium.
      </p>

      <h2>What to compare</h2>
      <p>
        Feature lists all look alike. Four questions separate these platforms
        better:
      </p>
      <ul>
        <li>
          Do planned workouts reach the watch on the free tier, and for which
          brands?
        </li>
        <li>
          How is training load computed, and can you see the formula? None of
          the alternatives uses TSS, so the numbers won't match what you're used
          to.
        </li>
        <li>How does the coach price grow with the roster?</li>
        <li>
          Can you get your data out, and what happens if the company stops?
          Today's Plan, a paid coaching platform, shut down in March 2024 and
          its users had to move every athlete.
        </li>
      </ul>

      <h2>intervals.icu</h2>
      <p>
        intervals.icu is free, with an optional Supporter plan at{' '}
        {q('icuMonth')} a month ({q('icuYear')} a year). It is the strongest
        option here for analysis: power curves, custom charts, and the widest
        list of integrations, including Wahoo and Zwift for workouts, which
        OpenAthlete doesn't cover. Coaching is free; teams and organisations
        need Supporter. There are no official mobile apps (third-party ones
        exist) and the code is closed. If you're a data-minded athlete who
        coaches yourself, start here.
      </p>

      <h2>Nolio</h2>
      <p>
        Nolio, a company from Grenoble and a partner of the French athletics
        federation, has a generous free athlete tier that includes watch sync
        and structured workouts. Premium is {q('nolioPremium')} a month. Coach
        plans are {q('nStarter')} a month for 3 athletes, {q('nClassic')} for 25
        and {q('nPro')} for 30 athletes with two coaches. Club plans for
        associations exist, the apps are native, and there are more than 200
        exercise videos. It doesn't advertise built-in AI, and like the others
        it's closed source. Our{' '}
        <Link href="/blog/nolio-vs-trainingpeaks-vs-openathlete-2025-comparison">
          three-way comparison with TrainingPeaks
        </Link>{' '}
        goes into the coach side in more detail.
      </p>

      <h2>Final Surge</h2>
      <p>
        Final Surge is free for athletes. Coaches pay a flat {q('fsStarter')} a
        month for 1 to 5 athletes or {q('fsPro')} for up to 100, with no
        per-athlete fee. Structured workouts go to Garmin and COROS. It is
        shaped around US running coaches, schools and clubs, with school
        discounts and native apps. Simple, honest pricing; less on the analysis
        side.
      </p>

      <h2>OpenAthlete</h2>
      <p>
        Every feature is free on our servers: calendar, workout builder, planned
        workouts sent to Garmin, Suunto and COROS, training load and coaching up
        to five athletes. The optional Supporter plan ({q('oaMonth')}a month or{' '}
        {q('oaYear')} a year) adds AI on our keys and unlimited coached
        athletes, and nothing else. The code is AGPL-3.0, so you can also run it
        on your own server for free, without limits.
      </p>
      <p>
        Training load is Banister TRIMP from heart rate, with session RPE
        alongside, and fitness, fatigue and form projected over the sessions
        you've planned. AI features run on your own key (OpenAI, Anthropic,
        Mistral and others) on any plan: a structured session from a sentence, a
        short read of each activity, and a few questions after each run that log
        effort and pain for the coach. Claude or ChatGPT can also plan into the
        calendar through the MCP server.
      </p>
      <p>
        What it doesn't do yet: the iOS and Android apps are in testing (the web
        app installs on a phone in the meantime), there is no plan marketplace,
        no indoor training app, no club account, and power analysis is shallower
        than on intervals.icu. Workouts can't go to Polar watches, because
        Polar's API is read-only. Units are metric only.
      </p>

      <h2>The numbers side by side</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Self-coached athlete, workouts on the watch</th>
            <th>Coach with 10 athletes, per year</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TrainingPeaks</td>
            <td>Premium, {q('tpYear')}/year</td>
            <td>{coachYear('trainingpeaks', 10)} (athletes on Premium)</td>
          </tr>
          <tr>
            <td>intervals.icu</td>
            <td>Free (Supporter {q('icuYear')}/year optional)</td>
            <td>Free; teams need Supporter</td>
          </tr>
          <tr>
            <td>Nolio</td>
            <td>Free</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
          </tr>
          <tr>
            <td>Final Surge</td>
            <td>Free</td>
            <td>{coachYear('final-surge', 10)} (Pro)</td>
          </tr>
          <tr>
            <td>OpenAthlete</td>
            <td>Free</td>
            <td>{q('oaYear')} (Supporter)</td>
          </tr>
        </tbody>
      </table>
      <p>
        List prices checked on 3 November 2026. Vendors change them; check their
        pages before you decide.
      </p>

      <h2>Which one fits</h2>
      <p>
        Stay on TrainingPeaks if you sell plans on its marketplace, your
        athletes rely on TrainingPeaks Virtual, or your whole coaching practice
        is built on TSS and you don't want to relearn the numbers. Pick
        intervals.icu for the deepest free analysis, especially with a power
        meter. Pick Nolio if you coach a French club and want association
        pricing and native apps today. Pick Final Surge for a US school or club
        team on simple flat pricing. Pick OpenAthlete if you want workouts on
        Garmin, Suunto or COROS without paying, a flat coach price, AI on your
        own key, or code you can host yourself.
      </p>

      <h2>Moving your history</h2>
      <p>
        Your activities also live in your watch account, which is usually the
        easiest source. In OpenAthlete, Strava and COROS bring your whole
        history, Garmin and Suunto the last 30 days, and Polar only what you
        record after connecting; older FIT, GPX and TCX files can be uploaded in
        bulk. Planned workouts and plans don't transfer between platforms, so
        rebuild your staple sessions as templates. We haven't verified
        TrainingPeaks' bulk export ourselves, so check its help centre before
        you count on it.
      </p>
      <p>
        If you want to try OpenAthlete, the{' '}
        <Link href="/pricing">pricing page</Link> lists exactly what is free and
        what Supporter adds.
      </p>
    </div>
  );
}
