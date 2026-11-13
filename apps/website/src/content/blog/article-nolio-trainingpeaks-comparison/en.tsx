import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('en');

export function ContentEn() {
  return (
    <div>
      <p>
        If you coach endurance athletes in France, or anywhere French clubs set
        the tone, the choice often comes down to TrainingPeaks or Nolio. This
        post adds OpenAthlete, which we build, and compares the three from a
        coach's chair: what you pay as the roster grows, what your athletes
        need, and what each one does better than the others. Prices come from
        each vendor's pricing page, checked on 3 November 2026. Dollar prices
        are before tax, as TrainingPeaks shows them.
      </p>

      <h2>Three pricing logics</h2>
      <p>
        <strong>TrainingPeaks</strong> charges per athlete. The coach plan
        starts at {q('tpCoach')} a month with four Basic athletes and one on
        Premium; every extra Premium athlete costs {q('tpPerMax')} a month,
        falling to {q('tpPerMin')} with volume. There's a {q('tpSetup')} setup
        fee, waived with a promo code. Athletes can stay on Basic (
        {q('tpCoachUnlimited')} a month covers any number of them), but then
        their planned workouts don't reach the watch, so most coaches either pay
        for Premium or ask athletes to pay {q('tpYear')} a year themselves.
      </p>
      <p>
        <strong>Nolio</strong> charges by tier. Starter is {q('nStarter')} a
        month for 3 athletes, Classic {q('nClassic')} for 25, and Pro{' '}
        {q('nPro')} for 30 athletes with two coaches; an extra coach is{' '}
        {q('nExtraCoach')} a month. Athletes don't need to pay for watch sync:
        the free athlete tier includes it. Clubs have their own plans, Club
        Starter at {q('nClubStarter')} and Club Classic at {q('nClubClassic')} a
        month.
      </p>
      <p>
        <strong>OpenAthlete</strong> is free up to five athletes. Above that,
        the Supporter plan at {q('oaYear')} a year removes the limit, whatever
        the roster, and also adds AI on our keys. Watch sync is free for
        athletes. Self-hosting is free without limits. Clubs get a free club
        space, and athletes a coach reaches through a club don't count against
        the five.
      </p>

      <table>
        <thead>
          <tr>
            <th>Athletes</th>
            <th>TrainingPeaks (athletes on Premium)</th>
            <th>Nolio</th>
            <th>OpenAthlete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>3</td>
            <td>{coachYear('trainingpeaks', 3)}</td>
            <td>{coachYear('nolio', 3)} (Starter)</td>
            <td>Free</td>
          </tr>
          <tr>
            <td>10</td>
            <td>{coachYear('trainingpeaks', 10)}</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>25</td>
            <td>{coachYear('trainingpeaks', 25)}</td>
            <td>{coachYear('nolio', 25)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>30</td>
            <td>{coachYear('trainingpeaks', 30)}</td>
            <td>{coachYear('nolio', 30)} (Pro)</td>
            <td>{q('oaYear')}</td>
          </tr>
        </tbody>
      </table>
      <p>
        Yearly cost for one coach, monthly billing, list prices checked on 3
        November 2026. The TrainingPeaks column assumes the coach pays for every
        athlete's Premium; if your athletes already pay for their own, your bill
        is much lower.
      </p>

      <h2>What each one does best</h2>
      <p>
        <strong>TrainingPeaks</strong> is the common language. Many athletes
        arrive with an account and a history there, many coaches think in TSS
        and the Performance Management Chart, and if you sell plans, its
        marketplace puts them in front of buyers. The mobile apps are mature,
        and TrainingPeaks Virtual covers indoor riding. Since 22 July 2026 it
        belongs to Garmin; what that may change is discussed in
        <Link href="/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          TrainingPeaks alternatives after the Garmin acquisition
        </Link>
        .
      </p>
      <p>
        <strong>Nolio</strong> is built for French clubs. It's a Grenoble
        company, partner of the French athletics federation, with association
        pricing, several coaches on one account, native iOS and Android apps and
        a library of more than 200 exercise videos for strength work. If your
        club wants one account for three coaches and sixty members, with native
        apps on every phone, Nolio has a plan for exactly that.
      </p>
      <p>
        <strong>OpenAthlete</strong> keeps the price flat and adds a few things
        the other two don't advertise. AI runs on your own key (or the Supporter
        allowance): you write "10 km easy then 6 × 400 m at 5K pace" and get a
        structured session with the athlete's zones; after each activity the
        athlete gets a short read and a few questions, and the effort and any
        pain they report land in an injury log and on your dashboard. Through
        the MCP server, Claude or ChatGPT can read an athlete's training and
        plan up to 60 sessions into their calendar. Clubs get a free club space
        with no athlete limit: groups with their own coaches, a shared library,
        weekly club sessions that athletes answer, and a session, day or week
        copied to a whole group, adapted to each athlete's zones. The code is
        AGPL-3.0, so a club can also run its own instance with single sign-on
        and invite-only signups.
      </p>

      <h2>What each one lacks</h2>
      <p>
        TrainingPeaks has no built-in AI listed on its pricing pages, and the
        per-athlete fee adds up quickly if you pay for Premium. Nolio's coach
        plans are paid from the first athlete and it doesn't advertise AI.
        Neither is open source.
      </p>
      <p>
        OpenAthlete's gaps are real too. The iOS and Android apps are in
        testing, so athletes use the installable web app for now. The club space
        has no club billing: membership fees stay outside OpenAthlete. No
        marketplace, no exercise video library, no federation partnership.
        Workouts go to Garmin, Suunto and COROS watches, not Polar. Training
        load is Banister TRIMP from heart rate, with session RPE alongside, so
        the numbers won't match TSS if your athletes come from TrainingPeaks.
      </p>

      <h2>Three coaches, three answers</h2>
      <p>
        A solo coach with twelve runners on a mix of Forerunners, a COROS Pace
        and a Suunto: TrainingPeaks costs the most here unless the athletes pay
        their own Premium. Nolio Classic and OpenAthlete both do the job; the
        difference is {coachYear('nolio', 12)} against {q('oaYear')} a year, AI
        on one side and native apps on the other.
      </p>
      <p>
        A club with three coaches and sixty members: if the members want a
        native app on their phone today, Nolio's club plans fit best. If the
        installable web app is enough, OpenAthlete's club space does the job for
        free, with groups, a shared library and Tuesday's track session already
        in every member's calendar. A self-hosted instance is an option if
        someone in the club is happy to run a server.
      </p>
      <p>
        A coach who sells plans to athletes they never speak to: stay on
        TrainingPeaks. Neither Nolio nor OpenAthlete has a marketplace.
      </p>
      <p>
        More detail, with sources for every claim, on the{' '}
        <Link href="/compare/nolio">OpenAthlete vs Nolio</Link> and{' '}
        <Link href="/compare/trainingpeaks">OpenAthlete vs TrainingPeaks</Link>{' '}
        pages, and what OpenAthlete offers coaches on the{' '}
        <Link href="/coaches">coaches page</Link>.
      </p>
    </div>
  );
}
