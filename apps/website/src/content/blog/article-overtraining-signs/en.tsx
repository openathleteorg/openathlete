import Link from 'next/link';

import { Sources } from './sources';

export function ContentEn() {
  return (
    <div>
      <p>
        Most runners who say they are overtrained are not. They are tired from a
        hard block, which is the point of a hard block. Or they are overreached,
        under-fuelled, coming down with something, or sleeping six hours a night
        because of work. True overtraining syndrome is rare, serious and slow to
        fix. The useful skill is telling these states apart early, because the
        right response to each is different.
      </p>

      <h2>Three states, one continuum</h2>
      <p>
        The reference here is the joint consensus statement of the European
        College of Sport Science and the American College of Sports Medicine
        (Meeusen et al., 2013). It describes a continuum, defined less by
        symptoms than by how long it takes to bounce back.
      </p>
      <ul>
        <li>
          <strong>Functional overreaching.</strong> A deliberate overload leaves
          your performance down for a few days to a couple of weeks. After rest
          you come back at the same level or slightly better. A training camp,
          or the hardest week of a marathon build, often ends here.
        </li>
        <li>
          <strong>Non-functional overreaching.</strong> The same dip, but it
          lasts weeks to months, and there is no rebound to show for it, only
          lost time. Mood and sleep usually suffer too.
        </li>
        <li>
          <strong>Overtraining syndrome.</strong> Performance stays down for
          months or longer, with a wider set of symptoms. Doctors can only
          diagnose it by ruling out everything else.
        </li>
      </ul>
      <p>
        One uncomfortable consequence: you only know which one you had in
        hindsight. Two weeks into a slump, functional and non-functional
        overreaching look the same.
      </p>
      <p>
        Is functional overreaching worth chasing? A French study of trained
        triathletes says be careful. After three weeks of overload and a taper,
        the athletes who had been heavily fatigued without losing performance
        improved the most. Those who had tipped into functional overreaching
        gained less, and caught more infections (Aubry et al., 2014). Training
        hard enough to feel it is fine. Training until your performance drops is
        not a better version of the same thing.
      </p>

      <h2>The five signs worth watching</h2>
      <p>
        None of these is a diagnosis on its own, and each can have an ordinary
        explanation. What matters is several of them together, lasting longer
        than a normal recovery would.
      </p>

      <h3>1. Performance drops and an easy week does not bring it back</h3>
      <p>
        This is the core sign in the consensus statement. In practice it looks
        like a threshold session you usually run at 4:15 per km that now takes
        everything you have at 4:25, or intervals where your heart rate will not
        climb as high as usual even though you are going flat out. One bad
        session means nothing. The same story after four or five easy days is
        worth taking seriously.
      </p>

      <h3>2. The usual sessions feel harder</h3>
      <p>
        Your effort rating creeps up for the same pace and heart rate. An easy 8
        km you would normally score 3 out of 10 now feels like a 5. It is a
        subtle signal and an early one. A systematic review found that how
        athletes rate their own fatigue, mood and soreness tracked training
        stress better than common objective markers did (Saw et al., 2016). That
        only works if you log it after every session, honestly, including the
        boring ones.
      </p>

      <h3>3. Your mood changes</h3>
      <p>
        Irritability, flat motivation, not wanting to go out for a run you would
        normally enjoy. Studies on swimmers in the 1980s showed mood disturbance
        rising with training load and falling again when the load came down
        (Morgan et al., 1987). The people around you often notice before you do.
      </p>

      <h3>4. Sleep and resting markers drift</h3>
      <p>
        You are exhausted but sleep badly, wake at 4 a.m., or feel unrested
        after eight hours. Resting heart rate and heart rate variability can
        shift too, but read them with care. A single morning reading is mostly
        noise: look at the weekly average against your own baseline (Plews et
        al., 2013). And HRV can move in either direction when you are
        overreached, so &quot;HRV went up&quot; is not automatically good news.
      </p>

      <h3>5. Heavy legs that stay heavy, and you keep getting ill</h3>
      <p>
        Normal fatigue lifts after two or three easy days. This kind does not.
        It often comes with one cold after another, or small niggles that move
        from one leg to the other. In the triathlete study above, infections
        were far more common in the overreached group.
      </p>

      <h2>Rule out the usual suspects</h2>
      <p>
        Before blaming the training, consider what else causes the same picture.
        A virus you have not shaken off. Iron deficiency, common in endurance
        runners and especially in women. Low energy availability, where you eat
        too little for what you burn: the IOC consensus on Relative Energy
        Deficiency in Sport lists underperformance, fatigue, frequent illness
        and bone stress injuries among its consequences (Mountjoy et al., 2023).
        Thyroid problems. Work or family stress, which your body counts as load
        even if your training log does not. If you have been underperforming and
        tired for more than two or three weeks without a clear reason, see a
        doctor and ask for a blood test.
      </p>

      <h2>What to do at each stage</h2>
      <p>
        <strong>After a planned overload,</strong> take the lighter week you
        planned. Easy running, sleep, normal meals. If you feel sharp again in
        five to ten days, you were where you meant to be.
      </p>
      <p>
        <strong>If the lighter week did not work,</strong> drop all intensity
        for another week or two. Short easy runs or rest, no intervals, no
        races. Then test yourself gently, with something like 3 × 8&apos; at
        threshold, and compare the pace and heart rate with what you managed
        before.
      </p>
      <p>
        <strong>If you suspect the real syndrome,</strong> stop structured
        training and see a sports physician. Recovery is measured in months, and
        coming back early is the most common way to make it longer.
      </p>

      <h2>Keeping it from happening</h2>
      <p>
        Plan lighter weeks before you need them, every third or fourth week.
        Avoid stacking a big block on top of a stressful month at work. Vary
        your days: Carl Foster described how training that is hard every day,
        with little difference between days (he called it monotony), coincided
        with illness in the athletes he followed (Foster, 1998). And spend
        thirty seconds each morning rating your sleep, stress, fatigue and
        soreness. That is the Hooper index (Hooper et al., 1995), and over a few
        weeks it says more than any single number from your watch.
      </p>

      <h2>What OpenAthlete shows, and what it does not</h2>
      <p>
        OpenAthlete does not diagnose overreaching or overtraining. It keeps the
        signals above in one place. Each session has a load from heart rate
        (TRIMP) and, when you rate it, a session RPE, so you can see effort
        climbing for the same work. Fitness, fatigue and form are drawn over
        time. Sleep, HRV and resting heart rate come in from Garmin, Polar,
        Suunto or COROS, or you enter them by hand, and the Hooper index sits
        next to each day on the calendar. If you turn on the optional
        post-activity questions, effort and any pain you mention are recorded,
        and that pain shows up for your coach. The form thresholds in the app
        are conventions to describe the curve, not a diagnosis. More on the{' '}
        <Link href="/features/training-load">training load page</Link>, and for
        the planning side, see{' '}
        <Link href="/blog/injury-prevention-2-when-algorithms-predict-the-break">
          how to build volume with lighter weeks
        </Link>
        .
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
