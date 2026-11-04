import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        VO2max is the highest rate at which you can take oxygen from the air and
        use it in your muscles. It is measured in litres per minute, or more
        usefully for runners in millilitres per kilogram per minute, since a
        heavier body costs more to carry. A. V. Hill described the plateau of
        oxygen uptake in the 1920s, and VO2max has been the headline number of
        endurance physiology ever since. It sets the size of your aerobic
        engine. It does not, on its own, decide how fast you race.
      </p>

      <h2>What sets VO2max: the Fick equation</h2>
      <p>
        Oxygen uptake is the product of how much blood the heart pumps and how
        much oxygen the muscles extract from it:
      </p>
      <Formula
        where={[
          'Q = cardiac output (litres of blood per minute) = heart rate × stroke volume',
          'CaO2 − CvO2 = arterial minus venous oxygen content (ml of O2 per litre of blood)',
        ]}
      >
        VO2 = Q × (CaO2 − CvO2)
      </Formula>
      <p>
        At maximal effort, extraction differs less between trained and untrained
        people than cardiac output does, and maximum heart rate does not rise
        with training. What separates a 40 from a 70 is mostly stroke volume,
        the amount of blood pushed out at each beat, which is why Bassett and
        Howley (2000) conclude that in trained athletes VO2max is limited mainly
        by oxygen delivery rather than by the muscles.
      </p>

      <h2>How it is measured or estimated</h2>
      <p>
        The reference is a lab test: an incremental run on a treadmill with a
        mask that analyses the air you breathe, until oxygen uptake stops rising
        despite a higher speed. Everything else is an estimate:
      </p>
      <ul>
        <li>
          The Cooper test (Cooper, 1968): distance run in 12 minutes, then
          VO2max = (distance in metres − 504.9) / 44.73.
        </li>
        <li>
          The heart rate ratio (Uth et al., 2004): VO2max ≈ 15.3 × HRmax /
          HRrest. Quick, but it needs a real maximum heart rate and ignores how
          fast you actually run.
        </li>
        <li>
          Race performance: Daniels’ <Link href="/learn/vdot">VDOT</Link> turns
          a race time into an “effective” VO2max that includes your economy.
        </li>
        <li>
          Watches: Garmin, Polar, COROS and others estimate it from heart rate
          against pace or power during runs, with models they do not fully
          publish.
        </li>
      </ul>

      <h2>A worked example</h2>
      <p>
        Take a runner who covers 2,900 m in the Cooper test, has a resting heart
        rate of 48 and a maximum of 188, and recently ran a 10K in 45:00.
      </p>
      <ul>
        <li>Cooper: (2,900 − 504.9) / 44.73 = 53.5 ml/kg/min</li>
        <li>Heart rate ratio: 15.3 × 188 / 48 = 59.9 ml/kg/min</li>
        <li>VDOT from the 10K: 45.3</li>
      </ul>
      <p>
        Three numbers from 45 to 60 for the same person. None is wrong; they
        measure different things. The ratio method looks only at the heart, the
        Cooper test at a 12-minute effort, VDOT at what the runner actually
        produces over 45 minutes. A gap like this usually says the runner has a
        decent engine and room to improve economy and endurance.
      </p>
      <p>
        For the lab version, plug in plausible values: a cardiac output of 25
        litres per minute and an extraction of 160 ml of oxygen per litre of
        blood give 4,000 ml/min, or 57 ml/kg/min for a 70 kg runner.
      </p>

      <h2>VO2max, VMA and running economy</h2>
      <p>
        On flat ground, running costs roughly 3.5 ml/kg/min of oxygen for each
        km/h of speed (Léger and Mercier, 1984). Divide VO2max by that cost and
        you get an approximate{' '}
        <Link href="/learn/vma">VMA (maximal aerobic speed)</Link>: 53.5 / 3.5 ≈
        15.3 km/h, close to the 15 km/h this runner gets from a 6-minute test. A
        runner who uses less oxygen per km/h, the more economical one, reaches a
        higher speed with the same VO2max. Joyner and Coyle (2008) describe
        endurance performance as three factors working together: VO2max, the
        fraction of it you can sustain (linked to lactate threshold) and
        economy.
      </p>

      <h2>How to use it in training</h2>
      <p>
        VO2max responds to work close to it: 4 to 6 repetitions of 3 to 5
        minutes at 95 to 100% of VMA, with recoveries of about the same length,
        or shorter formats like 30/30. It also rises with easy volume, through a
        bigger stroke volume. For setting paces, VMA and VDOT are more
        practical, since they are speeds. In OpenAthlete, VO2max is a metric
        that can be imported from Garmin, Polar or COROS or entered by hand, and
        you can follow it on the metrics page next to{' '}
        <Link href="/learn/hrv">HRV</Link> and resting heart rate. The{' '}
        <Link href="/tools/vma">VMA calculator</Link> gives you the paces.
      </p>

      <h2>Limits</h2>
      <p>
        Among runners of a similar level, VO2max predicts race results poorly:
        economy and sustainable fraction matter as much. Watch values move with
        heat, hills, fatigue and a wrong maximum heart rate, so read them as a
        trend over weeks. Genetics set a large part of the ceiling, and gains
        slow down after the first years of training, while threshold and economy
        can keep improving for a long time.
      </p>
    </div>
  );
}
