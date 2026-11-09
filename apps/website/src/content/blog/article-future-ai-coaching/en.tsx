import Link from 'next/link';

import { Sources } from './sources';

export function ContentEn() {
  return (
    <div>
      <p>
        A couple of years ago, "AI coaching" mostly meant a chatbot that wrote a
        generic twelve-week plan and forgot about you the moment you closed the
        tab. What has changed since is not that language models suddenly
        understand training better. It is that they can now act: open your
        calendar, read last month's activities, and write sessions into the plan
        your watch will download tomorrow morning. That is what people mean by
        agents, and it is worth thinking through calmly what it changes for
        coaches and what it does not.
      </p>

      <h2>What MCP is, briefly</h2>
      <p>
        The Model Context Protocol is an open standard, introduced by Anthropic
        in November 2024, that lets an AI client such as Claude or ChatGPT call
        tools exposed by another application. A training platform can expose
        tools like "read the calendar for these weeks", "get training load",
        "plan these sessions" or "move this session to Thursday". The model
        decides which tools to call and in what order. The application decides
        what the model is allowed to touch, and checks every request as it would
        check a click from the user.
      </p>
      <p>
        That separation matters. The model brings the language and the
        reasoning; the platform keeps the data, the permissions and the rules. A
        model that misunderstands you can propose something silly, but it cannot
        reach anything the platform does not expose.
      </p>

      <h2>A realistic Monday</h2>
      <p>
        Take a coach with fifteen athletes. On Monday morning one of them, nine
        weeks out from a marathon, writes that she has had the flu since
        Saturday and expects to be back on Thursday at best. The usual job: open
        her calendar, delete or move five or six sessions, rewrite the rest of
        the week, shorten the long run, and check that the following week still
        makes sense. Ten or fifteen minutes, and it is the third such message of
        the day.
      </p>
      <p>
        With an agent connected to the platform, the coach can write: "Anna has
        been ill since Saturday, probably until Thursday. Record it, keep
        everything easy until Sunday, move Saturday's 3 × 15 minutes at marathon
        pace to next Tuesday, and make Sunday's long run 1h15 easy." The agent
        records the illness, reads the calendar, makes the changes and reports
        back. The coach looks at the week in the calendar, fixes one thing, and
        moves on.
      </p>
      <p>
        Notice who made the decisions. Every choice in that instruction (how
        long to stay easy, which session matters enough to move, how long the
        long run should be) came from the coach. The agent did the clicking.
        That is the honest version of what agents offer coaching today: the
        administrative half of the job gets much cheaper, and the judgment half
        stays where it was.
      </p>

      <h2>What agents are still bad at</h2>
      <p>
        <strong>Knowing what they don't know.</strong> An agent will plan a
        block even when the data is thin: no heart rate on half the runs, no
        effort ratings, a week of travel nobody mentioned. Impellizzeri and
        colleagues have argued for years that internal load, how hard the
        training was for this athlete, is what drives adaptation, and that is
        exactly the part most often missing from the data. A coach notices the
        gap. A model tends to fill it with assumptions.
      </p>
      <p>
        <strong>Long-term judgment.</strong> Whether to add a third quality
        session, when to start a taper, whether this athlete needs a down week
        now or can absorb one more: these depend on years of history, on their
        job and family, on how they react to fatigue. When Düking and colleagues
        (2024) had coaching experts rate ChatGPT running plans, the plans
        improved a lot with more input information but were still not rated
        optimal, and the authors recommend an expert coach's review.
      </p>
      <p>
        <strong>Confident mistakes.</strong> A misread zone turns a recovery run
        into a threshold session. A date off by one moves the long run to the
        day before a race. Language models make these errors in fluent,
        reasonable-sounding text, which is what makes them easy to miss.
      </p>
      <p>
        <strong>Responsibility.</strong> When a plan contributes to an injury,
        somebody has to own that decision and talk to the athlete about it. A
        model cannot.
      </p>

      <h2>Keeping the coach in the loop, in practice</h2>
      <p>
        "Human in the loop" is easy to say. In a coaching tool, it comes down to
        a few concrete design choices:
      </p>
      <ul>
        <li>
          The agent writes to the same calendar the coach and the athlete see.
          Nothing happens in a hidden layer, so a bad change is visible at once.
        </li>
        <li>
          It is instructed to move and edit sessions rather than delete and
          recreate them, so a change stays a change.
        </li>
        <li>
          Completed sessions and recorded activities are history. The agent
          cannot rewrite them.
        </li>
        <li>AI runs only after explicit consent, which can be withdrawn.</li>
        <li>
          The data goes to the model provider you chose, under your key. On a
          self-hosted instance with a local model, it does not leave your
          server.
        </li>
      </ul>

      <h2>A cautious guess at the next few years</h2>
      <p>
        The administrative cost of coaching will keep falling. A coach who
        spends Sunday evening rewriting twenty athletes' weeks will spend much
        less time on it. That can go two ways: more athletes per coach, or more
        attention per athlete. The second is the better use of it, and athletes
        will notice which one their coach chose.
      </p>
      <p>
        Self-coached athletes with an agent will do well if they already know
        what good training looks like and use the agent to execute it. It is
        riskier for beginners, who are the least able to spot a bad plan and the
        most likely to follow one. We do not expect reliable injury prediction
        soon; the research on screening and machine learning gives little reason
        to. And the part of coaching that consists of noticing that an athlete's
        "fine" does not mean fine is not going anywhere.
      </p>

      <h2>Trying it</h2>
      <p>
        OpenAthlete has an <Link href="/features/mcp-server">MCP server</Link>{' '}
        that works with Claude, ChatGPT and other clients. It can read an
        athlete's context, calendar, activities and training load, record
        illness or travel, and plan up to 60 sessions in one go; the sessions
        then appear in the calendar and reach Garmin, Suunto and COROS watches.
        It is free, and coaches can use it across the athletes they coach.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
