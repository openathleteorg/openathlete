import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        OpenAthlete is a training platform for endurance athletes and their
        coaches. It has a calendar for planned sessions, structured workouts
        that go to your watch, activities that come back from it, a training
        load model, and a shared space where a coach and an athlete work on the
        same plan. The code is open source under the AGPL-3.0 licence. The
        hosted version is free, and you can also run it on your own server.
      </p>
      <p>
        This page explains why it exists, what it does today and, just as
        useful, what it does not do.
      </p>

      <h2>Why it exists</h2>
      <p>
        OpenAthlete is built by an independent developer in Grenoble who runs
        ultras. There are no investors behind it. It started from a familiar
        routine: planning the season in a spreadsheet, retyping every interval
        session into the watch maker's app, then opening a third app to see
        whether the session went as planned. Three tools, and none of them knew
        about the others.
      </p>
      <p>
        The commercial platforms that solve this properly are good products.
        They also charge coaches by the athlete, and they keep years of training
        history on their servers, under their terms. When Today's Plan shut down
        in March 2024, its users found out how much of that history they could
        actually take with them. In July 2026 Garmin bought TrainingPeaks, one
        of the best-known coaching platforms, which puts the plans of a lot of
        coaches in the hands of a watch maker.
      </p>
      <p>
        The idea behind OpenAthlete is that the core of a training platform (a
        calendar, structured workouts, a load model, a link to the watch) is
        infrastructure. Infrastructure is better when anyone can read it, run it
        and keep it alive.
      </p>

      <h2>What it does today</h2>
      <p>
        <strong>Planning.</strong> You build workouts step by step, say 15
        minutes easy, 5 × 4 minutes at threshold with 2 minutes of jogging, 10
        minutes easy, and the targets come from your own zones, paces or
        percentages of VMA, FTP or maximum heart rate. Sessions live in a
        calendar you can drag around, and a coach can move or copy whole weeks
        at once.
      </p>
      <p>
        <strong>Your watch.</strong> Planned workouts are sent to Garmin, Suunto
        and COROS watches. Completed activities come in from Garmin, COROS,
        Suunto, Polar and Strava, or from a FIT, GPX or TCX file. When you
        connect an account, Strava and COROS bring your full history, Garmin and
        Suunto the last 30 days, and Polar only new activities.
      </p>
      <p>
        <strong>Training load.</strong> Load is computed with TRIMP from heart
        rate, with session RPE recorded alongside it. Fitness, fatigue and form
        (CTL, ATL and TSB) are projected over the sessions you have planned, so
        you can see what the next three weeks will do to your form before the
        race rather than after. The{' '}
        <Link href="/features/training-load">training load page</Link> explains
        the model.
      </p>
      <p>
        <strong>Coaching.</strong> A coach plans directly in each athlete's
        calendar, reuses templates and sees what was actually done. An athlete
        can have more than one coach, and there is a group chat. Coaching up to
        five athletes is free. Clubs get a free club space, with groups and
        their coaches, a shared workout library, weekly club sessions and plans
        copied to a whole group; athletes a coach reaches through a club don't
        count against that limit.
      </p>
      <p>
        <strong>AI, if you want it.</strong> Nothing runs until you agree to it,
        and you can withdraw that consent. When it is on, AI can write a
        structured session from a sentence, edit a session from a short
        instruction, ask you three or four questions after an activity and turn
        your answers into an effort score and a pain note your coach can see,
        give a short read of each new activity, and estimate the load of a
        planned session. You use your own API key (OpenAI, Anthropic, Google,
        Mistral and others, or a local model on a self-hosted instance) or the
        allowance that comes with the Supporter plan. There is no chat inside
        the app: if you want a conversation, the{' '}
        <Link href="/features/mcp-server">MCP server</Link> lets Claude or
        ChatGPT read your training and plan sessions in your calendar.
      </p>

      <h2>What it does not do</h2>
      <ul>
        <li>
          Workouts cannot be sent to Polar watches or to Strava. Both are
          sources of activities only.
        </li>
        <li>
          There is no club billing: the club space is free, and membership fees
          are handled outside OpenAthlete.
        </li>
        <li>
          It does not predict injuries. It records pain when athletes report it
          and shows it to their coach, which is less impressive and more honest.
        </li>
        <li>Units are metric only.</li>
        <li>
          The iOS and Android apps are in testing. In the meantime the web app
          works on a phone and can be installed on the home screen.
        </li>
        <li>
          The COROS connection is new, so expect rough edges and tell us when
          you find one.
        </li>
      </ul>

      <h2>How it is paid for</h2>
      <p>
        Every feature is free on the hosted version. The Supporter plan, at €5 a
        month or €50 a year, adds two things: AI that runs on OpenAthlete's
        keys, with a monthly allowance, and coaching for more than five
        athletes. Self-hosting is free, with no limits. Details are on the{' '}
        <Link href="/pricing">pricing page</Link>.
      </p>
      <p>
        The hosted API and database run at OVH in France, and the web app is
        served by Vercel. A self-hosted instance sends nothing to OpenAthlete,
        and an automated test checks that on every release.
      </p>

      <h2>Where to start</h2>
      <p>
        If you train on your own, connect your watch, set your zones (the{' '}
        <Link href="/tools/heart-rate-zones">heart rate zone calculator</Link>{' '}
        is a reasonable starting point if you have never measured them) and plan
        one week. If you coach, invite a single athlete first and run a full
        week together before moving everyone over.
      </p>
      <p>
        The source code is on{' '}
        <a href="https://github.com/openathleteorg/openathlete">GitHub</a>. Bug
        reports and feature requests go there or on Discord. They are read, and
        they decide a good part of what gets built next.
      </p>
    </div>
  );
}
