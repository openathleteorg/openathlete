import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Zone 2 is the easy, steady running that fills most of a sensible
        training week: the pace of long runs and recovery days, where you can
        still speak in full sentences. The name comes from the five-zone heart
        rate scale used by most watches and training apps, where it sits between
        very easy jogging (zone 1) and the moderate, &ldquo;comfortably
        hard&rdquo; zone 3. Physiologically, it corresponds to intensities at or
        just below the first lactate threshold, where blood lactate is barely
        above resting values and the effort can be held for hours.
      </p>
      <p>
        It has become fashionable in the last few years, largely through
        discussions of mitochondrial function and fat oxidation. The underlying
        advice is much older: endurance athletes in most sports spend the bulk
        of their training time at low intensity, as Stephen Seiler’s reviews of
        elite training have documented (Seiler, 2010).
      </p>

      <h2>How zone 2 is calculated</h2>
      <p>
        There is no single definition, which is the source of most of the
        confusion. The common heart rate version uses the Karvonen method, on
        your <Link href="/learn/heart-rate-reserve">heart rate reserve</Link>:
      </p>
      <Formula
        where={[
          'HRrest: resting heart rate, measured lying down on waking',
          'HRmax: the highest heart rate you have actually seen, not an age formula if you can avoid it',
        ]}
      >
        Zone 2 = HRrest + (0.60 to 0.70) × (HRmax − HRrest)
      </Formula>
      <p>
        The simpler variant takes 60 to 70% of maximum heart rate. In a lab,
        zone 2 is pinned to measured markers instead: the first lactate or
        ventilatory threshold. Percentages are a stand-in for those thresholds,
        and a rough one.
      </p>
      <p>
        One trap: in the three-zone model used in research (Seiler and others),
        zone 1 is everything below the first threshold and zone 2 is the band
        between the first and second thresholds. That &ldquo;zone 2&rdquo; is
        tempo running, not easy running. When you read a paper, check which
        scale it uses.
      </p>

      <h2>A worked example</h2>
      <p>
        A runner has a resting heart rate of 50 bpm and has seen 190 bpm at the
        end of a hard hill session. Their heart rate reserve is 140 beats.
      </p>
      <ul>
        <li>Bottom of zone 2: 50 + 0.60 × 140 = 134 bpm</li>
        <li>Top of zone 2: 50 + 0.70 × 140 = 148 bpm</li>
        <li>
          With 60–70% of max instead: 0.60 × 190 = 114 to 0.70 × 190 = 133 bpm
        </li>
      </ul>
      <p>
        The two methods barely overlap. For a fit runner with a low resting
        heart rate, 114 bpm is close to a walk, and the percentage-of-max zone
        sits mostly in zone 1. That is why Karvonen is usually the better choice
        for runners, and why the{' '}
        <Link href="/tools/heart-rate-zones">heart rate zones calculator</Link>{' '}
        defaults to it.
      </p>
      <p>
        A second runner, resting at 60 and maxing at 180, gets 132 to 144 bpm.
        Similar numbers, very different people: zones only make sense with your
        own resting and maximum values.
      </p>

      <h2>How to use zone 2 in training</h2>
      <p>
        For most runners training four to six times a week, the large majority
        of running time belongs in zones 1 and 2, with one or two harder
        sessions on top. In practice:
      </p>
      <ul>
        <li>
          Easy days: 40 to 70 minutes in zone 2, ideally at the lower end the
          day after a hard session.
        </li>
        <li>
          Long run: 1h30 to 2h30 mostly in zone 2. Heart rate drifts upward as
          you tire and heat up; accept a few beats of drift rather than slowing
          to a shuffle, and note how much it drifts, which says something about
          your endurance (see{' '}
          <Link href="/learn/aerobic-decoupling">aerobic decoupling</Link>).
        </li>
        <li>
          On hilly ground, walk the steep climbs if that is what keeps you in
          the zone. Trail runners do this in races anyway.
        </li>
        <li>
          Check progress with a fixed reference: the same flat loop at the same
          heart rate every few weeks. If the pace at 140 bpm gets faster, your
          aerobic base is improving.
        </li>
      </ul>
      <p>
        The talk test is a useful cross-check. If you can only manage a few
        words at a time, you are above zone 2 whatever the watch says.
      </p>
      <p>
        In OpenAthlete, heart rate zones can be set from a percentage of maximum
        or of heart rate reserve, per sport, and each activity shows time spent
        in each zone. The{' '}
        <Link href="/features/training-load">training load page</Link> explains
        how heart rate also feeds the <Link href="/learn/trimp">TRIMP</Link> of
        each session.
      </p>

      <h2>Limits</h2>
      <p>
        Percentage zones assume that everyone’s first threshold sits at the same
        share of their heart rate reserve. It doesn’t: in trained runners it can
        be noticeably higher than 70%, in beginners lower. A lab or field
        threshold test gives you better boundaries than any percentage.
      </p>
      <p>
        Maximum heart rate is the weak link. Age formulas such as Tanaka’s (208
        − 0.7 × age) describe a population average and are off by 10 beats or
        more for many individuals, which shifts the whole zone. Heat,
        dehydration, poor sleep and caffeine all raise heart rate for the same
        pace, and heart rate lags behind effort on short climbs.
      </p>
      <p>
        Finally, keep the claims in proportion. Much of the recent enthusiasm
        about zone 2, mitochondria and fat burning rests on comparisons between
        professional cyclists and less-fit people (San-Millán and Brooks, 2018),
        which show how trained athletes differ, not what a given amount of zone
        2 will do for you. Easy volume works; so does a little intensity on top
        of it, which is the point of{' '}
        <Link href="/learn/polarized-training">polarized training</Link>.
      </p>
    </div>
  );
}
