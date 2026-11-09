import { DISCORD_URL } from '@/config';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        A structured workout on your watch does three useful things: it tells
        you when each step starts and ends, it shows whether you're inside the
        target range, and it counts the reps so you don't have to. On a session
        like 15' easy, 5 × 4' at threshold with 2' jog, 10' easy, that is the
        difference between running the session and doing arithmetic while you
        run it.
      </p>
      <p>
        Getting the session from a training plan onto the wrist depends on the
        brand. This guide covers the three brands that accept workouts from
        other apps (Garmin, COROS and Suunto), what to do with a Polar, and ends
        with a checklist for the day a workout doesn't show up.
      </p>

      <h2>Which watches can receive workouts</h2>
      <p>
        Every brand lets you build a workout in its own app. Fewer let an
        outside platform send one in.
      </p>
      <ul>
        <li>
          <strong>Garmin</strong> accepts workouts from approved partners. They
          land in your Garmin Connect calendar and reach the watch at its next
          sync.
        </li>
        <li>
          <strong>Suunto</strong> accepts them as guides: a guide is Suunto's
          name for a structured session you pick when you start an exercise.
        </li>
        <li>
          <strong>COROS</strong> accepts structured run, trail and bike
          sessions, which appear in the COROS app calendar and then on the
          watch.
        </li>
        <li>
          <strong>Polar</strong>'s public API lets apps read your activities and
          sleep, not write to your account, so OpenAthlete can't send workouts
          there. You can still build sessions by hand in Polar Flow.
        </li>
        <li>
          <strong>Strava</strong> has no structured workouts at all, so there is
          nothing to send to.
        </li>
      </ul>

      <h2>What makes a workout "structured"</h2>
      <p>
        A watch can only guide you through steps. Each step needs a length (a
        duration or a distance) and, ideally, a target: a pace range, a heart
        rate range or a power range. Repeats group steps together, so "5 × (4'
        at 4:10–4:20/km, 2' easy)" is one repeat block of two steps.
      </p>
      <p>
        A session that is only "60 minutes easy", with no steps, sends nothing:
        there is nothing for the watch to guide. If you want it on the watch,
        make it a single 60-minute step with a heart rate cap.
      </p>
      <p>
        Targets written as zones deserve a word. Your zones in a training
        platform and the zones in your watch are rarely the same. When a step
        targets one of your zones, OpenAthlete sends the actual numbers (say,
        148–158 bpm or 4:35–4:45/km) rather than "zone 3", so the target on the
        wrist matches the plan whatever the watch thinks your zones are. The
        same goes for percentages of max heart rate or threshold power, as long
        as those values are filled in your metrics.
      </p>

      <h2>Garmin</h2>
      <p>
        Once Garmin is connected with workout export turned on, each structured
        session goes to your Garmin Connect calendar. The watch picks it up at
        its next sync with the phone app. On most recent Forerunner, Fenix and
        Venu models, a workout scheduled for today is offered when you start the
        matching activity; otherwise look in the training menu, under workouts
        or the training calendar. Menu names vary between models, so check your
        manual if you don't see it.
      </p>
      <p>
        Move or edit the session in OpenAthlete and the Garmin copy follows.
        Running, cycling, pool swimming, strength, cardio, yoga and pilates
        sessions are sent. For pool swims, Garmin only takes pace as a target,
        so heart rate targets on swim steps are dropped. Garmin also caps a
        workout at 100 steps, repeats included, which only matters if you write
        very long track sessions step by step.
      </p>
      <p>
        Setup details are on the{' '}
        <Link href="/connect/garmin">Garmin connection page</Link>.
      </p>

      <h2>COROS</h2>
      <p>
        Running, trail running and cycling sessions go to COROS. They appear in
        the calendar of the COROS app and reach the watch when it syncs. Swims
        and strength sessions aren't sent.
      </p>
      <p>
        COROS has one quirk worth knowing before race week: an app can't delete
        a planned session there. If you move or remove a session in OpenAthlete,
        the old one stays on the COROS calendar marked as cancelled, and you
        delete it in the COROS app. When you connect, pick the region where you
        created your COROS account (Europe, the United States and other regions,
        or mainland China); COROS keeps each account on one regional server.
      </p>
      <p>
        The COROS connector is the newest one, live since November 2026. Details
        and known limits are on the{' '}
        <Link href="/connect/coros">COROS connection page</Link>.
      </p>

      <h2>Suunto</h2>
      <p>
        Running, trail running, cycling and swimming sessions arrive in your
        Suunto account as guides. On the watch, choose the guide when you start
        the exercise, like any other Suunto guide. Strength sessions stay in
        OpenAthlete. See the{' '}
        <Link href="/connect/suunto">Suunto connection page</Link> for setup.
      </p>

      <h2>Polar: activities in, workouts by hand</h2>
      <p>
        With a Polar watch, your activities, sleep and nightly HRV can still
        come into OpenAthlete automatically. For the session itself you have two
        options: build it in Polar Flow as a training target with phases and
        sync the watch, or follow it from the OpenAthlete app on your phone.
        Neither is as convenient as a direct sync, and it's worth knowing before
        you buy a watch if structured sessions matter to you.
      </p>

      <h2>When your coach plans the sessions</h2>
      <p>
        Sessions go out through the athlete's own connection, not the coach's.
        Your coach can plan on your calendar from any watch, or none; as long as
        you have connected Garmin, COROS or Suunto with workout export on, their
        sessions reach your wrist like the ones you plan yourself. One coach can
        have athletes on all three brands without doing anything different for
        each.
      </p>

      <h2>The workout isn't on my watch: a checklist</h2>
      <p>Go through these in order. The first two explain most cases.</p>
      <ul>
        <li>
          <strong>Is the session within the next seven days?</strong>{' '}
          OpenAthlete sends the coming week, not the whole plan. A session three
          weeks out goes to the watch on its own once it's within seven days.
          Past sessions aren't sent.
        </li>
        <li>
          <strong>Has the watch synced since?</strong> The workout reaches
          Garmin Connect, the COROS app or the Suunto app first. Open the
          brand's phone app and let the watch sync.
        </li>
        <li>
          <strong>Is export turned on?</strong> In Settings, Connectors, check
          that workout export is on for that brand.
        </li>
        <li>
          <strong>Does the session have steps?</strong> A duration with no steps
          sends nothing.
        </li>
        <li>
          <strong>Is the sport supported by that brand?</strong> A strength
          session won't go to COROS or Suunto; a swim won't go to COROS.
        </li>
        <li>
          <strong>Can your model follow structured workouts?</strong> Most
          recent running watches can; some entry-level or older models can't.
        </li>
        <li>
          <strong>COROS only:</strong> a session you moved may appear twice,
          once marked as cancelled. Delete the cancelled one in the COROS app.
        </li>
        <li>
          <strong>Still nothing?</strong> Disconnect and reconnect the brand in
          Settings, Connectors, then ask on our{' '}
          <a href={DISCORD_URL}>Discord</a> with the date of the session.
        </li>
      </ul>

      <h2>Doing it by hand</h2>
      <p>
        You don't need any platform to put a workout on a watch. Garmin Connect,
        the COROS app and Polar Flow all have a workout builder: create the
        steps, save, sync. For one key session a week that's ten minutes and
        works fine. It gets tedious when a plan changes often, when a coach
        writes sessions for several athletes, or when paces should follow
        updated zones. That's the case for letting a platform send them.
      </p>
      <p>
        OpenAthlete sends workouts to Garmin, COROS and Suunto on the free plan,
        and imports activities from those three plus Polar and Strava. The{' '}
        <Link href="/features/watch-sync">watch sync page</Link> has the full
        brand-by-brand table.
      </p>
    </div>
  );
}
