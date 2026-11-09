import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Functional threshold power, or FTP, is the highest power you can hold in
        a roughly steady state for about an hour, in watts. Andrew Coggan
        defined it as a practical stand-in for the lab thresholds, and Hunter
        Allen and Coggan’s book <em>Training and Racing with a Power Meter</em>{' '}
        made it the anchor of most cycling training: zones, workouts and load
        scores are all expressed as percentages of it. Running power meters have
        since brought the same idea to running.
      </p>
      <p>
        FTP is a field number, measured with a power meter and a hard effort,
        not a physiological boundary measured in a lab. Its closest relative in
        exercise physiology is critical power, which is worth understanding
        alongside it, because the two often land within a few watts of each
        other and are still not the same thing.
      </p>

      <h2>How FTP is estimated</h2>
      <p>
        The original definition is the average power of a one-hour time trial.
        Few people want to do that often, so the common test is 20 minutes all
        out, usually preceded by a hard 5-minute effort to take the edge off
        your anaerobic reserve, with the result scaled down by 5%:
      </p>
      <Formula
        where={['P20 = average power of a 20-minute all-out effort, in watts']}
      >
        FTP ≈ 0.95 × P20
      </Formula>
      <p>
        The 0.95 factor is an average correction for the fact that you can push
        harder for 20 minutes than for 60. It fits some riders well and others
        poorly, as the limits below show.
      </p>

      <h2>Critical power</h2>
      <p>
        Critical power comes from Monod and Scherrer (1965). Plot your best
        efforts as total work against time and, between about 2 and 20 minutes,
        the points fall on a straight line. Its slope is critical power (CP);
        its intercept, W′ (“W prime”), is a fixed amount of work you can do
        above CP before you have to slow down:
      </p>
      <Formula
        where={[
          'CP = critical power, in watts',
          'W′ = work capacity above CP, in joules',
          't = duration of the effort, in seconds',
        ]}
      >
        P(t) = CP + W′ / t
      </Formula>
      <p>
        Physiologically, CP marks the boundary between the heavy domain, where
        oxygen uptake and blood lactate settle, and the severe domain, where
        they keep rising until you stop (Poole et al., 2016). Above CP, every
        second spends some W′; below it, W′ slowly refills. The running
        equivalent, with speed instead of power, is{' '}
        <Link href="/learn/critical-speed">critical speed</Link>.
      </p>

      <h2>A worked example</h2>
      <p>
        A cyclist averages 262 W over a 20-minute test. Their best efforts from
        recent rides are 340 W for 3 minutes, 310 W for 5, 275 W for 12 and that
        262 W for 20.
      </p>
      <ul>
        <li>FTP ≈ 0.95 × 262 = 249 W</li>
        <li>
          Fitting work against time over the four efforts (61.2, 93.0, 198.0 and
          314.4 kJ) gives CP = 248 W and W′ = 18.0 kJ
        </li>
        <li>
          Predicted 10-minute power: 248 + 17,965 / 600 = 278 W, consistent with
          the 5- and 12-minute bests on either side
        </li>
        <li>
          An attack at 400 W spends 400 − 248 = 152 joules of W′ per second, so
          17,965 / 152 ≈ 118 seconds before the reserve is empty
        </li>
      </ul>
      <p>
        Here FTP and CP agree within a watt. That is common in groups and
        unreliable for individuals: in 17 trained cyclists, Karsten et al.
        (2021) found CP averaged 256 W and FTP 249 W, but the gap for a given
        rider ranged from about 19 W one way to 33 W the other.
      </p>

      <h2>How to use FTP in training</h2>
      <p>
        Coggan’s classic power zones are percentages of FTP. With 249 W:
        endurance (56–75%) is 139 to 187 W, tempo (76–90%) 189 to 224 W,
        threshold (91–105%) 227 to 261 W and VO2max work (106–120%) 264 to 299
        W. Typical sessions follow from there:
      </p>
      <ul>
        <li>2 × 20 minutes at 95–100% of FTP (237 to 249 W), 5 minutes easy</li>
        <li>3 × 12 minutes at 100–105% with 4 minutes of recovery</li>
        <li>5 × 4 minutes at 110–120% (274 to 299 W), equal recovery</li>
        <li>Long endurance rides of 2 to 4 hours below 75%</li>
      </ul>
      <p>
        CP and W′ add something FTP does not: they tell you how long you can
        stay above threshold. That is useful for pacing a climb, a short time
        trial or a race with repeated surges. Retest every six to eight weeks,
        or sooner when threshold sessions feel too easy or impossible.
      </p>
      <p>
        In OpenAthlete, FTP for cycling and running is a metric you enter or
        sync; the app does not run a test for you. Workout steps in the{' '}
        <Link href="/features/workout-builder">workout builder</Link> can target
        a percentage of FTP or of critical power. The Capacities view of the
        statistics fits critical power from your 2- to 20-minute cycling power
        bests and shows a 95% interval: those bests come from training, not
        maximal tests, so the result is at most what they show.
      </p>

      <h2>Limits</h2>
      <p>
        The hour in the definition is loose. When Borszcz et al. (2018) asked 23
        trained cyclists to ride at their 20-minute FTP until exhaustion, they
        lasted 50.9 minutes on average, with a standard deviation of nearly 16
        minutes: some went well past an hour, others stopped after about half.
        Riders with a large anaerobic capacity get an inflated FTP from the
        20-minute test; diesel types get one that is too low.
      </p>
      <p>
        Test conditions also move the number: indoor heat without enough
        cooling, pacing errors, fatigue, motivation. Critical power has its own
        weak points. It depends on which durations you feed it, it fails outside
        roughly 2 to 20 minutes, and efforts taken from ordinary rides are
        rarely all out. Neither number says anything about durability, how much
        of that power is left after three hours in the saddle. For intensity in
        heart rate terms, see{' '}
        <Link href="/learn/heart-rate-reserve">heart rate reserve</Link>; for
        the lab thresholds FTP tries to approximate, see{' '}
        <Link href="/learn/lactate-threshold">lactate threshold</Link>.
      </p>
    </div>
  );
}
