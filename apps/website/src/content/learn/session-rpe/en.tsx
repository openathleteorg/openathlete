import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Session RPE is the simplest training load measure that holds up in
        research: rate how hard the whole session was on a 0 to 10 scale,
        multiply by its duration in minutes, and you have a load in arbitrary
        units. Carl Foster and colleagues described it in the late 1990s and
        tested it against heart-rate methods in 2001. It needs no sensor, works
        for any sport, including strength and technical sessions, and captures
        things heart rate cannot see, like heavy legs on a downhill or the
        mental cost of a race.
      </p>

      <h2>How session RPE is calculated</h2>
      <Formula
        where={[
          'RPE: rating of perceived exertion for the whole session, on the 0–10 category-ratio scale (CR-10)',
          'minutes: total duration of the session, warm-up and cool-down included',
          'result in arbitrary units (AU)',
        ]}
      >
        session load = RPE × minutes
      </Formula>
      <p>
        The scale is a version of Borg’s CR-10: 0 is rest, 1 very easy, 3
        moderate, 5 hard, 7 very hard, 10 maximal. The question is about the
        session as a whole, not the hardest interval or how you feel now.
        Foster’s protocol asks for the rating about 30 minutes after the end,
        once the last effort no longer dominates the answer. In practice, rating
        it when you upload the activity, the same day, works well enough if you
        stay consistent.
      </p>

      <h2>A worked example</h2>
      <p>A runner’s week, rated session by session:</p>
      <ul>
        <li>Tuesday, 60 min with 5 × 4' at threshold, RPE 7: 420 AU</li>
        <li>Wednesday, 45 min easy, RPE 3: 135 AU</li>
        <li>Thursday, 50 min steady, RPE 4: 200 AU</li>
        <li>Saturday, 100 min long run, RPE 5: 500 AU</li>
        <li>Sunday, 40 min recovery jog, RPE 2: 80 AU</li>
      </ul>
      <p>
        The weekly load is 1,335 AU. The threshold session is 15% of the
        training time but almost a third of the load, which matches how most
        runners would describe their week. Foster (1998) also derived two weekly
        indicators from the daily values. Monotony is the mean daily load
        divided by its standard deviation: here 191 / 184 ≈ 1.0, with two rest
        days and real contrast between hard and easy days. Strain is weekly load
        × monotony, about 1,390. Training the same moderate amount every day
        pushes monotony up, and in Foster’s data illnesses tended to follow
        weeks of high strain.
      </p>

      <h2>How to use it in training</h2>
      <p>
        Rate every session, including the easy ones and the gym. Gaps make the
        weekly total meaningless. Then look at trends: a week 30% above your
        recent weeks is a jump, whatever the absolute number. Comparing the
        planned effort with the rated one is often more telling than the load
        itself. An easy run rated 5 instead of 3, or a threshold session that
        felt like a 9, says something about fatigue, heat or illness before any
        curve does.
      </p>
      <p>
        Session RPE also works best next to an objective measure. When{' '}
        <Link href="/learn/trimp">TRIMP</Link> stays flat while session RPE
        climbs for the same workouts, the body is paying more for the same
        output. Coaches use exactly that gap to adjust the next days.
      </p>
      <p>
        In OpenAthlete, every activity has an RPE from 0 to 10, and a coach can
        require it before a session counts as done. The training load view shows
        session RPE (RPE × minutes) alongside heart-rate TRIMP. If the AI
        features are switched on, a few short questions after an activity can
        fill in the RPE from the athlete’s answer. More on the{' '}
        <Link href="/features/training-load">training load page</Link>.
      </p>

      <h2>Limits</h2>
      <p>
        It is subjective, which is both the point and the weakness. Ratings
        drift with mood, motivation and experience; beginners tend to compress
        everything into 4 to 7. The arbitrary units do not convert to TRIMP or
        TSS, so the numbers cannot be mixed in the same curve without rescaling.
        Duration weighs linearly: a 3-hour easy ride at RPE 3 (540 AU) outscores
        a hard 40-minute interval session at RPE 8 (320 AU), which is right for
        total load and wrong for the specific stress of intensity. And a rating
        says nothing about why the session was hard. The review by Haddad and
        colleagues (2017) finds session RPE valid across many sports, with
        correlations to heart-rate methods that are generally good but far from
        perfect. Use it as a second opinion that is always available, not as the
        only number.
      </p>
    </div>
  );
}
