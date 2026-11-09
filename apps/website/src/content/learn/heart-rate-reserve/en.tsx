import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Heart rate reserve is the range your heart actually has to work with:
        your maximum heart rate minus your resting heart rate. A runner who
        rests at 50 and tops out at 190 has 140 beats of reserve. Training zones
        built on that range, rather than on a plain percentage of maximum, are
        what most people mean by the Karvonen method, after the Finnish
        physiologist Martti Karvonen, who used it in a 1957 study of how
        training lowered heart rate.
      </p>
      <p>
        The appeal is that it accounts for where you start. Two runners with the
        same maximum but different resting heart rates do not have the same easy
        pace in beats per minute, and the reserve sees that. It also lines up
        better with physiology than percentages of maximum do: Swain and
        Leutholtz (1997) showed that a given percentage of heart rate reserve
        matches the same percentage of oxygen uptake reserve, while a percentage
        of maximum heart rate does not match the same percentage of VO2max.
      </p>

      <h2>How it is calculated</h2>
      <Formula
        where={[
          'HRR = HRmax − HRrest, in beats per minute',
          'intensity = the share of the reserve you want, 0.6 for 60%',
        ]}
      >
        target HR = HRrest + (HRmax − HRrest) × intensity
      </Formula>
      <p>
        The usual five zones are bands of 10% of the reserve: 50–60%, 60–70%,
        70–80%, 80–90% and 90–100%. The percentages are conventions, not
        thresholds measured on you, which matters later.
      </p>

      <h2>A worked example</h2>
      <p>
        Resting heart rate 50 bpm, maximum 190 bpm, so a reserve of 140 beats.
      </p>
      <ul>
        <li>Zone 1 (50–60%): 50 + 0.5 × 140 = 120 to 134 bpm</li>
        <li>Zone 2 (60–70%): 134 to 50 + 0.7 × 140 = 148 bpm</li>
        <li>Zone 3 (70–80%): 148 to 162 bpm</li>
        <li>Zone 4 (80–90%): 162 to 176 bpm</li>
        <li>Zone 5 (90–100%): 176 to 190 bpm</li>
      </ul>
      <p>
        With percentages of maximum, the same zone 2 would be 114 to 133 bpm, a
        good 15 beats lower. For a fit runner, 114 bpm is barely a jog, which is
        why people who switch to Karvonen often find their easy runs stop
        feeling like walking.
      </p>
      <p>
        Now keep the maximum at 190 but raise the resting heart rate to 65. The
        reserve drops to 125 beats and zone 2 becomes 65 + 0.6 × 125 = 140 to 65
        + 0.7 × 125 = 152.5, so roughly 140 to 153 bpm. Same maximum, a
        different zone, because the starting point moved.
      </p>

      <h2>Getting the two numbers right</h2>
      <p>
        Resting heart rate is best taken lying down on waking, before coffee,
        over several mornings; take a typical value, not the lowest one ever
        seen. Watches often report the minimum during sleep, which can sit a few
        beats lower and inflates the reserve slightly.
      </p>
      <p>
        Maximum heart rate is the harder one. The highest value you have seen at
        the end of a hard race, or after the last of a set of hard hill repeats,
        is worth more than any formula. If you have nothing, Tanaka, Monahan and
        Seals (2001) give 208 − 0.7 × age, so 180 bpm at 40. It is a population
        average: many people sit 10 beats or more either side, and a maximum
        that is 10 beats too high shifts every zone up by about 6 to 9 beats.
      </p>

      <h2>How to use it in training</h2>
      <p>
        Heart rate zones work best for long, steady efforts, where the heart has
        time to settle. Easy runs and long runs in{' '}
        <Link href="/learn/zone-2">zone 2</Link> are the obvious case: for the
        runner above, 134 to 148 bpm, whatever the pace on a hilly or windy day.
        Tempo runs of 30 to 40 minutes in zone 3, or 2 × 15 minutes near the top
        of zone 4 (around 169 to 173 bpm, 85–88% of reserve), are also easy to
        steer by heart rate.
      </p>
      <p>
        For short intervals such as 5 × 4 minutes at threshold, heart rate lags
        behind the effort: it takes a minute or two to climb, and the first rep
        will look easy on the watch when it is not. Steer those by pace or power
        and use heart rate afterwards to check that the session did what you
        wanted. The same reserve fraction also feeds load scores such as{' '}
        <Link href="/learn/trimp">TRIMP</Link>, so getting your resting and
        maximum values right pays twice.
      </p>
      <p>
        The{' '}
        <Link href="/tools/heart-rate-zones">heart rate zones calculator</Link>{' '}
        does the arithmetic for both methods. In OpenAthlete, heart rate zones
        can be set from a percentage of maximum or of reserve, the reserve is
        calculated from your resting and maximum heart rate metrics, and workout
        steps can target a percentage of heart rate reserve.
      </p>

      <h2>Limits</h2>
      <p>
        Everything rests on two inputs, and both are noisy. Resting heart rate
        moves by several beats with sleep, stress, heat or an oncoming cold;
        heart rate during exercise rises with heat, dehydration, caffeine and
        altitude, and drifts upward over long efforts. Some medications, beta
        blockers in particular, change both ends of the range.
      </p>
      <p>
        The bigger limit is that 60%, 70% or 80% of reserve are the same for
        everyone, while physiology is not. One runner’s{' '}
        <Link href="/learn/lactate-threshold">lactate threshold</Link> sits at
        82% of reserve, another’s at 90%. If you know your threshold heart rate
        from a lab test or a 30-minute race effort, anchoring zones on it is
        more accurate. Karvonen is a sound default when you don’t.
      </p>
    </div>
  );
}
