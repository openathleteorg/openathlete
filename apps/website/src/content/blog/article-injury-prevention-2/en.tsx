import Link from 'next/link';

import { Sources } from './sources';

export function ContentEn() {
  return (
    <div>
      <p>
        You have been running about 40 km a week for two months. Your marathon
        is 16 weeks away and you would like your biggest weeks to reach 70 km.
        This article is about getting from one number to the other without
        spending week 9 with a bag of ice on your shin. It is practical on
        purpose: for what the research does and does not say about load and
        injury, read{' '}
        <Link href="/blog/preventing-training-injuries">
          running injuries and training load
        </Link>
        .
      </p>

      <h2>The 10% rule is a ceiling somebody made up</h2>
      <p>
        Nobody knows quite where the 10% rule came from, and it has been tested
        less than its fame suggests. When Dutch researchers gave 532 novice
        runners either a standard 8-week plan or a slower 13-week plan built on
        10% increases, injury rates were the same: about one runner in five in
        each group (Buist et al., 2008). A Danish cohort of 874 novices found a
        possible signal only above 30% over two weeks, and even that was
        borderline (Nielsen et al., 2014).
      </p>
      <p>
        The rule also fails in both directions. At low volume it is absurdly
        slow: 20 km a week becomes 22. At higher volume, applied every week
        without a break, it compounds. Forty kilometres plus 10% a week for ten
        weeks is 104 km. Nobody should do that, yet it is what the rule says.
      </p>
      <p>
        What the evidence and the IOC consensus on load (Soligard et al., 2016)
        do support is the general idea: increase gradually, avoid sudden large
        jumps, and adjust to the person in front of you. The rest is coaching
        judgement, and I will label it as such.
      </p>

      <h2>How I build volume instead</h2>
      <p>
        <strong>Step, then hold.</strong> Add a chunk, say 4 to 6 km or 30
        minutes, then stay at that level for a week or two before the next step.
        In my experience runners absorb a level they have repeated better than a
        new record every single week. That is observation, not trial data.
      </p>
      <p>
        <strong>Lighter week every third or fourth.</strong> Cut volume by
        roughly a quarter to a third and keep one short quality session, for
        example 6 × 1&apos; fast on the Wednesday, so you do not arrive at the
        next block feeling flat. The exact percentage has no strong study behind
        it. The habit of planning the week before you need it does.
      </p>
      <p>
        <strong>One new thing at a time.</strong> Do not add 6 km in the same
        week as your first track session of the season, your first long hilly
        trail or a new pair of shoes with less drop. The Run Clever trial found
        that progressing intensity or progressing volume gave similar injury
        rates (Ramskov et al., 2018). Progressing both at once was not the
        question, and I would not volunteer to find out.
      </p>
      <p>
        <strong>Grow the long run on its own track.</strong> Ten to fifteen
        minutes more each time it goes up, and early in a build keep it to about
        a third of the week or less. A runner on 40 km doing a 25 km long run is
        putting most of the week into one session.
      </p>
      <p>
        <strong>Count what actually loads you.</strong> On the road, kilometres
        are a decent proxy. On trails, count time and elevation: 1,000 m of
        descent in a week is a stress that no distance figure captures, and your
        quadriceps will report it with a two-day delay.
      </p>
      <p>
        <strong>Respect breaks.</strong> After a few days off, carry on. After
        two or three weeks off, I restart at half to two-thirds of the previous
        volume and rebuild over three or four weeks. Your recent average has
        dropped, even if your memory of it has not.
      </p>

      <h2>A 16-week example</h2>
      <p>
        Here is how the 40 to 70 km build could look. Long run durations assume
        an easy pace of around 6:00 per km.
      </p>
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Volume</th>
            <th>Long run</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>40 km</td>
            <td>1h20</td>
            <td>Current level</td>
          </tr>
          <tr>
            <td>2</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>First step</td>
          </tr>
          <tr>
            <td>3</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Hold</td>
          </tr>
          <tr>
            <td>4</td>
            <td>34 km</td>
            <td>1h15</td>
            <td>Lighter week</td>
          </tr>
          <tr>
            <td>5</td>
            <td>48 km</td>
            <td>1h40</td>
            <td></td>
          </tr>
          <tr>
            <td>6</td>
            <td>52 km</td>
            <td>1h45</td>
            <td></td>
          </tr>
          <tr>
            <td>7</td>
            <td>52 km</td>
            <td>1h50</td>
            <td>Hold</td>
          </tr>
          <tr>
            <td>8</td>
            <td>40 km</td>
            <td>1h30</td>
            <td>Lighter week</td>
          </tr>
          <tr>
            <td>9</td>
            <td>56 km</td>
            <td>2h00</td>
            <td></td>
          </tr>
          <tr>
            <td>10</td>
            <td>60 km</td>
            <td>2h05</td>
            <td></td>
          </tr>
          <tr>
            <td>11</td>
            <td>60 km</td>
            <td>2h15</td>
            <td>Hold</td>
          </tr>
          <tr>
            <td>12</td>
            <td>46 km</td>
            <td>1h40</td>
            <td>Lighter week</td>
          </tr>
          <tr>
            <td>13</td>
            <td>65 km</td>
            <td>2h20</td>
            <td></td>
          </tr>
          <tr>
            <td>14</td>
            <td>70 km</td>
            <td>2h30</td>
            <td>Peak</td>
          </tr>
          <tr>
            <td>15</td>
            <td>52 km</td>
            <td>1h45</td>
            <td>Taper</td>
          </tr>
          <tr>
            <td>16</td>
            <td>30 km + race</td>
            <td>Race</td>
            <td>Race week</td>
          </tr>
        </tbody>
      </table>
      <p>
        Look at week 5. Compared with the lighter week 4 it is a 41% jump, which
        would set off every alarm in a ratio-based app. Compared with weeks 2
        and 3, the level the runner actually trained at, it is 9%. Compare a new
        week with the training before the recovery week, not with the recovery
        week itself.
      </p>
      <p>
        Notice also what the plan does not do: it never adds volume and a new
        type of session in the same week, and the peak is two weeks out, not
        one. If your goal race is a hilly trail, swap kilometres for hours and
        add a column for D+.
      </p>

      <h2>What to compare a week against</h2>
      <p>
        If you want a single number, compare this week with the average of the
        previous three or four weeks, without counting this week in that
        average. Use it as a prompt to look more closely, not as a verdict. The
        popular acute:chronic workload ratio and its 0.8 to 1.3 &quot;sweet
        spot&quot; have been criticised heavily, including for that exact
        double-counting problem (Impellizzeri et al., 2020). There is no
        validated threshold, for you or anyone else.
      </p>

      <h2>When to hold or step back</h2>
      <p>
        Stop progressing, and usually stop running for a few days, if a pain
        changes the way you run, gets worse during a run, or is worse the next
        morning. Pain on one precise spot of a bone, like the shin or the top of
        the foot, deserves a professional opinion before the next run, not after
        the next three.
      </p>
      <p>
        Hold the current level, or take the lighter week early, if easy runs
        feel harder than usual several days in a row, if the same easy pace
        costs you more heart rate, or if your sleep has gone. Those are the
        early signs covered in{' '}
        <Link href="/blog/5-signs-of-overtraining-and-how-to-avoid-it">
          overtraining and overreaching
        </Link>
        . Moving a step one week later costs you almost nothing. A stress
        fracture costs you the race.
      </p>

      <h2>Planning it in OpenAthlete</h2>
      <p>
        The season view in OpenAthlete lets you draw a build like the one above
        as blocks (base, specific, taper, recovery) with your race on top, and
        each week shows its load against a range built from your recent weeks.
        That range is a rule of thumb to frame a week, not a safety limit.
        Fitness, fatigue and form are projected over the sessions you have
        planned, so you can see what a lighter week does to your form before you
        run it. Pain mentioned in the optional post-activity questions goes into
        an injury log your coach can see. More on the{' '}
        <Link href="/features/training-calendar">training calendar</Link> and{' '}
        <Link href="/features/training-load">training load</Link> pages.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
