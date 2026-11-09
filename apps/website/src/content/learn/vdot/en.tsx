import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        VDOT is the number at the heart of Jack Daniels’ training system. The
        name comes from “V-dot-O2max”, the way physiologists write VO2max, but
        it is not measured in a lab. Daniels and the mathematician Jimmy Gilbert
        worked it back from race results in the 1970s: given how fast you ran a
        distance, what VO2max would explain it if your running economy were
        average? The answer is a single score that ranks your current running
        fitness, predicts what you could run at other distances, and gives you a
        set of training paces.
      </p>
      <p>
        Because it comes from a performance, VDOT already includes things a lab
        VO2max leaves out: how economical your stride is and how large a share
        of your maximum you can hold for a whole race. Those three factors
        together explain most of endurance performance (Joyner and Coyle, 2008).
        That is why two runners with the same{' '}
        <Link href="/learn/vo2max">VO2max</Link> can have VDOTs several points
        apart, and why VDOT predicts race times better than VO2max does.
      </p>

      <h2>How VDOT is calculated</h2>
      <p>
        The Daniels-Gilbert formulas have two parts. The first gives the oxygen
        cost of running at a speed v, in metres per minute. The second gives the
        share of VO2max a runner can sustain for a race lasting t minutes: close
        to 100% for about 10 minutes, around 90% for 45 minutes, below 85% for a
        marathon.
      </p>
      <Formula
        where={[
          'Oxygen cost (ml/kg/min) = −4.6 + 0.182258 × v + 0.000104 × v²',
          'Sustainable share = 0.8 + 0.1894393 × e^(−0.012778 × t) + 0.2989558 × e^(−0.1932605 × t)',
          'v = distance (m) / time (min); t = race time in minutes',
        ]}
      >
        VDOT = oxygen cost / sustainable share
      </Formula>
      <p>
        The formulas hold from about 1,500 m to the marathon. Below that, races
        lean on anaerobic capacity; beyond it, fuelling and heat decide more
        than aerobic fitness.
      </p>

      <h2>A worked example</h2>
      <p>A runner finishes a flat 10K in 45:00.</p>
      <ul>
        <li>Speed: 10,000 m / 45 min = 222.2 m/min</li>
        <li>
          Oxygen cost: −4.6 + 0.182258 × 222.2 + 0.000104 × 222.2² = 41.0
          ml/kg/min
        </li>
        <li>
          Sustainable share for 45 minutes: 0.8 + 0.1894 × e^(−0.575) + 0.2990 ×
          e^(−8.70) = 0.907
        </li>
        <li>VDOT = 41.0 / 0.907 = 45.3</li>
      </ul>
      <p>
        Run the formulas backwards and the same VDOT predicts about 21:42 for 5
        km, 1:39:44 for the half marathon and 3:27:15 for the marathon.
      </p>
      <p>
        Training paces come from fixed shares of VDOT, converted back into a
        speed with the oxygen cost formula. For a VDOT of 45.3:
      </p>
      <ul>
        <li>Easy (59 to 74%): 6:21 to 5:18 per km</li>
        <li>Marathon (the predicted marathon speed): 4:55 per km</li>
        <li>Threshold (88%): 4:37 per km</li>
        <li>Interval (97.5%): 4:15 per km</li>
        <li>Repetition (105%): 4:00 per km, or 96 seconds per 400 m</li>
      </ul>

      <h2>How to use VDOT in training</h2>
      <p>
        Each pace has a job. Threshold pace is for tempo runs of 20 minutes or
        cruise intervals such as 5 × 1 km with one-minute jogs. Interval pace is
        for repeats of three to five minutes, for instance 5 × 1,000 m with
        equal jogging recoveries, which is close to what French coaches call
        work at <Link href="/learn/vma">VMA</Link>. Repetition pace is for
        short, fast reps of 200 or 400 m with full recovery, aimed at economy.
        Easy pace covers most of the week.
      </p>
      <p>
        Two habits keep the system honest. Set your VDOT from a recent race, not
        from the one you hope to run: training at goal pace before you have the
        fitness is the classic way to dig a hole. And raise it in small steps,
        one point after a good race or a block of sessions that felt controlled,
        rather than chasing every good day.
      </p>
      <p>
        In OpenAthlete, the records page computes your VDOT from your strongest
        effort between 1,500 m and the marathon and shows the matching training
        paces. On this site, the <Link href="/pace-charts">pace charts</Link>{' '}
        use the same formulas, and the{' '}
        <Link href="/tools/race-predictor">race predictor</Link> gives a second
        opinion with Riegel’s formula.
      </p>

      <h2>Limits</h2>
      <p>
        VDOT assumes your endurance matches your speed. A runner with a quick
        10K and little mileage will usually miss the predicted marathon, often
        by several minutes, because the tables assume training suited to the
        distance. Hills, heat, wind and a poorly paced race all lower the score,
        so a VDOT from a bad day underestimates you. The sustainable share is an
        average curve: some runners hold a higher fraction of their maximum than
        others, and trail or ultra events are outside what the formulas were
        built for. Treat VDOT as a well-calibrated starting point, and adjust
        paces by feel and heart rate.
      </p>
    </div>
  );
}
