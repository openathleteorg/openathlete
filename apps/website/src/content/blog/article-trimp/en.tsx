import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        TRIMP, short for training impulse, is the oldest serious attempt to put
        one number on a training session. Eric Banister and his colleagues
        proposed it in the 1970s as the input to their fitness-fatigue model,
        and fifty years later it still sits, in one form or another, under most
        training-load charts that run on heart rate. It is simple enough to
        compute by hand, which is the best way to understand both what it gets
        right and where it misleads you.
      </p>

      <h2>The formula</h2>
      <p>
        Banister's TRIMP multiplies the duration of a session by how far into
        your heart rate reserve you were, then weights that intensity
        exponentially, so that hard minutes cost more than easy ones:
      </p>
      <p>
        <code>TRIMP = duration (min) × HRr × 0.64 × e^(1.92 × HRr)</code>
      </p>
      <p>
        where <code>HRr = (HRavg − HRrest) / (HRmax − HRrest)</code>, the
        fraction of your heart rate reserve used during the session. For women,
        the coefficients become 0.86 and 1.67:{' '}
        <code>TRIMP = duration × HRr × 0.86 × e^(1.67 × HRr)</code>.
      </p>
      <p>
        The exponential weighting is the interesting part. It was fitted to the
        way blood lactate climbs with heart rate, which is close to flat at easy
        intensities and steep near threshold (Morton, Fitz-Clarke and Banister,
        1990). The separate coefficients for men and women come from the same
        work and describe group averages, not you. Nobody has shown that they
        fit any individual athlete well, and that's worth keeping in mind before
        treating a TRIMP of 112 as more precise than one of 105.
      </p>

      <h2>A worked example</h2>
      <p>
        Take a runner with a resting heart rate of 50 and a maximum of 190, so a
        reserve of 140 beats. They go out for an easy hour at an average of 140
        bpm.
      </p>
      <ul>
        <li>HRr = (140 − 50) / (190 − 50) = 90 / 140 = 0.643</li>
        <li>Weighting = 0.64 × e^(1.92 × 0.643) = 0.64 × 3.44 = 2.20</li>
        <li>TRIMP = 60 × 0.643 × 2.20 = 85</li>
      </ul>
      <p>
        With the women's coefficients, the same hour comes out at 97. Same
        heart, same run, a 14% difference from the coefficient choice alone,
        which tells you how much the absolute number depends on assumptions.
      </p>
      <p>
        Now a threshold session for the same runner: 20 minutes of warm-up at
        135 bpm, 5 × 4' at 175 bpm with 3' jog recoveries at 140, then 8 minutes
        of cool-down at 130. Sixty minutes again. Summed block by block, it
        gives a TRIMP of 114. Computed from the average heart rate of the whole
        session (149 bpm), it gives 105.
      </p>
      <p>
        That gap is the exponential at work: four minutes at 175 cost far more
        than the average suggests, so averaging a session that mixes easy and
        hard running always underestimates it. Banister's original method used
        the average, because that's what heart rate monitors of the time could
        give. Today, any watch records heart rate every second, and integrating
        it second by second is the better choice. The longer and more varied the
        session, the more it matters.
      </p>
      <p>
        For scale, a steady 2 h 30 long run at 135 bpm comes to about 187, and
        20 minutes at 185 bpm (close to flat out for this runner) to about 79.
        The formula does say that a short, very hard effort can cost as much as
        an easy hour. Whether your legs agree is another matter.
      </p>

      <h2>What you need to get right</h2>
      <p>
        TRIMP is only as good as its two reference values. An HRmax set 10 beats
        too high makes every session look easier; one set too low inflates
        everything. Use the highest value you've seen in a hard race or an
        all-out hill effort, not 220 minus your age, which is often off by 10
        bpm or more in either direction. Resting heart rate is best taken lying
        down on waking, averaged over a few mornings. If you don't know your
        numbers, our{' '}
        <Link href="/tools/heart-rate-zones">heart rate zones tool</Link>{' '}
        explains how to estimate them.
      </p>
      <p>
        Then the sensor. Optical wrist sensors are fine on steady runs and often
        wrong in the first minutes of a session, in the cold, and during short
        intervals. A chest strap removes most of that noise. A cadence-locked
        wrist reading of 170 bpm on an easy jog will hand you a TRIMP that has
        nothing to do with the run.
      </p>

      <h2>Where TRIMP goes wrong</h2>
      <p>
        Heart rate measures what your cardiovascular system is doing, not what
        your muscles are paying. That has predictable consequences.
      </p>
      <p>
        Downhill running is the classic case. A trail race with 1,500 m of
        descent can leave your quads wrecked for four days while heart rate
        stays moderate on the way down, so TRIMP underrates it. Strength
        sessions, plyometrics and hill sprints have the same problem.
      </p>
      <p>
        Short intervals are another. Heart rate takes a minute or two to catch
        up with effort, so in a 30/30 session it never reaches the level the
        work deserves, and the TRIMP comes out low.
      </p>
      <p>
        Heat works the other way. On a hot day, cardiac drift can push heart
        rate up by ten beats or more at the same pace over an hour. TRIMP counts
        it as a harder session. Physiologically it was, so this isn't entirely
        wrong, but it makes a summer week look heavier than the same week in
        March.
      </p>
      <p>
        Finally, heart rate isn't comparable across sports. Most people reach
        lower heart rates on the bike than running, and lower still in the
        water, so a cycling TRIMP and a running TRIMP of the same number don't
        represent the same stress. Some coaches use sport-specific maximums for
        this reason.
      </p>

      <h2>Other versions, and session RPE</h2>
      <p>
        Several variants try to fix parts of this. Edwards' TRIMP (1993)
        multiplies the minutes spent in each of five heart rate zones by 1 to 5.
        Lucía's TRIMP (Lucía et al., 2003) uses three zones set from ventilatory
        thresholds, weighted 1, 2 and 3. Manzi's individualised TRIMP (Manzi et
        al., 2009) replaces Banister's population curve with the athlete's own
        lactate profile, which is more accurate and needs a lab test.
      </p>
      <p>
        The simplest alternative skips heart rate entirely. Foster's session RPE
        (Foster et al., 2001) multiplies the duration in minutes by how hard the
        session felt on a 0 to 10 scale: 50 minutes at RPE 6 makes 300. It sees
        muscle damage, heat, poor sleep and a bad day at work, because you do.
        Studies that compared the two methods found them well correlated but far
        from identical (Impellizzeri et al., 2004), which is the point: when
        TRIMP and session RPE disagree, something is going on. A threshold run
        that felt like an 8 when the TRIMP looks ordinary is worth a second
        look.
      </p>

      <h2>From one session to fitness and fatigue</h2>
      <p>
        A single TRIMP doesn't tell you much. Its use is as a daily input to
        Banister's model, which keeps two exponentially weighted averages of
        your load: a slow one for fitness, usually with a 42-day time constant
        (often called CTL), and a fast one for fatigue, with 7 days (ATL). Form,
        or TSB, is the difference. During a block form sits below zero; in a
        taper fatigue falls faster than fitness and form climbs back above it.
        The model is a description, not a law, and the 42 and 7 days are
        conventions rather than values measured on you, but the trend over weeks
        is useful.
      </p>
      <p>
        Two practical rules follow. Compare your load with itself, not with
        someone else's, and not across systems: a TRIMP of 100 and a
        TrainingPeaks TSS of 100 are different units. And read the curve over
        weeks; a single day means little.
      </p>

      <h2>How OpenAthlete uses it</h2>
      <p>
        OpenAthlete computes Banister TRIMP for every activity with heart rate,
        second by second when the stream is there, with the 0.64/1.92 and
        0.86/1.67 coefficients and the max and resting heart rate from your
        metrics. When you give an activity an effort score, it also shows
        session RPE next to it, so you can see when the two disagree. Fitness,
        fatigue and form are then projected over the sessions you have planned.
        The <Link href="/features/training-load">training load page</Link> has a
        small TRIMP calculator and links to the formulas in the source code.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>
          Banister EW, Calvert TW, Savage MV, Bach T. A systems model of
          training for athletic performance. Australian Journal of Sports
          Medicine, 1975;7:57–61.
        </li>
        <li>
          Morton RH, Fitz-Clarke JR, Banister EW. Modeling human performance in
          running. Journal of Applied Physiology, 1990;69(3):1171–1177.{' '}
          <a href="https://doi.org/10.1152/jappl.1990.69.3.1171">
            doi:10.1152/jappl.1990.69.3.1171
          </a>
        </li>
        <li>
          Banister EW. Modeling elite athletic performance. In: MacDougall JD,
          Wenger HA, Green HJ (eds), Physiological Testing of the
          High-Performance Athlete. Human Kinetics, 1991.
        </li>
        <li>Edwards S. The Heart Rate Monitor Book. Polar Electro, 1993.</li>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
        <li>
          Lucía A, Hoyos J, Santalla A, Earnest C, Chicharro JL. Tour de France
          versus Vuelta a España: which is harder? Medicine and Science in
          Sports and Exercise, 2003;35(5):872–878.
        </li>
        <li>
          Impellizzeri FM, Rampinini E, Coutts AJ, Sassi A, Marcora SM. Use of
          RPE-based training load in soccer. Medicine and Science in Sports and
          Exercise, 2004;36(6):1042–1047.
        </li>
        <li>
          Manzi V, Iellamo F, Impellizzeri F, D'Ottavio S, Castagna C. Relation
          between individualized training impulses and performance in distance
          runners. Medicine and Science in Sports and Exercise,
          2009;41(11):2090–2096.
        </li>
      </ul>
    </div>
  );
}
