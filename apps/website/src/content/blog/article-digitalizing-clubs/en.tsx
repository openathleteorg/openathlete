import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Picture a typical running or triathlon club. Track on Tuesday, a tempo
        or hill session on Thursday, a group long run on Sunday. Three or four
        volunteer coaches, a head coach who also does the club's website, and
        somewhere between forty and two hundred members ranging from first-time
        10K runners to people chasing a sub-3 marathon. The training lives in a
        WhatsApp group, a shared spreadsheet that one person understands, and
        the head coach's memory.
      </p>
      <p>
        It works, until it doesn't. The spreadsheet owner moves away. A member
        with a sore Achilles tells one coach, who isn't there the following
        Tuesday. The WhatsApp group has 140 people and half of them have muted
        it. Moving training online doesn't fix any of this by itself, but
        organising it a little does.
      </p>

      <h2>Start with who coaches whom</h2>
      <p>
        Before choosing any tool, write down the structure. Clubs that run
        smoothly usually have the same few elements, whatever the software:
      </p>
      <ul>
        <li>
          Groups defined by current pace, not by ambition. A "5:30–6:00/km easy"
          group and a "4:45–5:15/km" group are clearer than "intermediate" and
          "advanced", and members can move between them without it feeling like
          a promotion or a demotion.
        </li>
        <li>
          One named coach per group, and a deputy for the weeks they're away.
        </li>
        <li>
          For members who want an individual plan, one primary coach. Other
          coaches can help, but one person is responsible for the overall load.
        </li>
        <li>
          A single place where injuries and niggles get written down, so the
          next coach on duty knows.
        </li>
      </ul>

      <h2>Write the club sessions once</h2>
      <p>
        Most club sessions repeat with variations: 6 to 10 × 400 m at 5K pace
        with 200 m jog, 3 × 8' at threshold, hill reps of 45". The head coach
        (or whoever enjoys it) writes the week's sessions once, with targets
        expressed as a percentage of each member's VMA, threshold or max heart
        rate rather than fixed paces. Then the 4:00/km runner and the 6:00/km
        runner do the same workout at their own intensity, and group coaches
        only adjust the volume: eight reps for one group, five for another.
      </p>
      <p>
        Keep these in a shared library, not in someone's head. The day the head
        coach steps down, the club keeps its sessions.
      </p>

      <h2>Separate announcements from training talk</h2>
      <p>
        A single group chat for everything is where information goes to die.
        Split it: one channel for announcements only (venue changes, races,
        AGM), where only coaches post, and training conversations per group.
        Feedback about a specific person's session belongs with that session,
        not in a chat with sixty people.
      </p>

      <h2>Health data needs care</h2>
      <p>
        Pain reports and injury notes are health data, a special category under
        the GDPR in the EU, and heart rate or sleep data can count too. Members
        are entitled to know who sees it. In practice: ask members before
        connecting their watch data, give coaches access only to the members
        they actually coach, and decide who can see injury notes. For junior
        members, involve the parents.
      </p>

      <h2>Two ways to run a club on OpenAthlete</h2>
      <p>
        OpenAthlete has a club space. It is free on our servers, with no limit
        on the number of athletes, and a club that prefers its own server gets
        the same features by installing OpenAthlete there.
      </p>
      <p>
        <strong>A club space, on our servers.</strong> A coach creates the club
        in Settings &gt; Clubs and gives each member a role: owner, admin,
        coach, assistant or athlete. Every coach of the club reaches the club's
        athletes, and those athletes don't count against the five-athlete limit
        of a free coach account. Members join from a list you import (pasted, or
        a CSV from the club spreadsheet, groups included), with a join code, or
        through links that expire. Each group, by pace or level, has its own
        coaches, and the club library holds the workouts and folders every coach
        of the club uses.
      </p>
      <p>
        To plan for a group, copy a session, a day or a week to many athletes at
        once. Each copy is adapted to the athlete's own zones and thresholds, a
        preview shows what each athlete is missing before you confirm, and one
        undo takes the whole lot back. Weekly club sessions, such as Tuesday
        track at the stadium, land in the group's calendars four weeks ahead:
        athletes say whether they're coming, the coach sees the count, and
        calling off one date sends everyone a notification. Messages go to a
        group or to the whole club, now or at a scheduled time, and every
        session keeps its own comment thread. The coach dashboard is built for
        dozens of athletes, with totals over a period, alerts when a metric such
        as resting heart rate or weight crosses a threshold, and a sidebar made
        for switching between thirty athletes.
      </p>
      <p>
        An athlete can still have several coaches, so the running coach and the
        strength coach plan in the same calendar. Members can be on any watch:
        activities come from Garmin, COROS, Suunto, Polar, Strava or files, and
        planned workouts reach Garmin, COROS and Suunto watches, not Polar ones.
        Members can also subscribe to their planned sessions from Google or
        Apple Calendar. What's still missing is club billing: membership fees
        are handled outside OpenAthlete.
      </p>
      <p>
        <strong>The club runs its own instance.</strong> OpenAthlete is open
        source, so a club can install it on a small server and have its own
        platform at its own address, with the same club features, no athlete
        limit and no subscription. Members can sign in through single sign-on
        with Authentik, Keycloak or any OpenID Connect provider, and sign-ups
        can be invite-only or closed. A self-hosted instance sends nothing to
        OpenAthlete. One honest caveat: COROS sync works out of the box, but
        Garmin, Suunto, Polar and Strava require the club to register with each
        brand's developer program, and Garmin and Suunto approve partners one by
        one. File import always works.
      </p>
      <p>
        For most clubs, the club space on our servers is the quicker start. A
        club that wants its members' data on its own server, and has someone
        comfortable running one, can take the second route. The{' '}
        <Link href="/clubs">clubs page</Link> covers both, and the{' '}
        <Link href="/self-hosting">self-hosting page</Link> covers the install.
        If your club has specific needs, telling us how you actually train is
        the most useful input we can get.
      </p>
    </div>
  );
}
