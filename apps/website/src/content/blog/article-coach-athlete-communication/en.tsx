import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        In 2014, a research group in Groningen asked the coaches of two elite
        youth football squads to rate, before each session, how hard they
        intended it to be. After the session, the players rated how hard it
        actually felt. Over a full season and more than 2,400 sessions, the two
        barely matched. Players found the easy days harder than planned and the
        hard days easier (
        <a href="https://doi.org/10.1123/ijspp.2013-0009">
          Brink et al., International Journal of Sports Physiology and
          Performance, 2014
        </a>
        ).
      </p>
      <p>
        That was a full-time setting, with coaches watching every session in
        person. A remote coach with fifteen amateur runners sees much less. If
        you don't ask how the training felt, in a structured way, you are
        planning on assumptions about how it went.
      </p>

      <h2>Decide where each kind of message lives</h2>
      <p>
        Most communication problems between coaches and athletes are filing
        problems. The feedback on Tuesday's intervals is buried in a WhatsApp
        thread between a photo of a dog and a question about race registration.
        Three weeks later, neither of you can find it.
      </p>
      <p>A simple rule set fixes most of this:</p>
      <ul>
        <li>
          Anything about a session goes on that session: how it felt, a question
          about the paces, your reply. It stays attached to the data and you can
          find it again when you plan the next block.
        </li>
        <li>
          Logistics and chat go in the general conversation: travel, race
          entries, "can I swap Saturday and Sunday?".
        </li>
        <li>
          Anything emotional or complicated goes to a call: a bad race, an
          injury that keeps coming back, doubts about the goal. Text strips out
          tone, and a ten-minute call settles what twenty messages won't.
        </li>
      </ul>
      <p>Tell new athletes this on day one. They won't guess it.</p>

      <h2>A weekly check-in that takes ten minutes</h2>
      <p>
        A regular check-in beats ad-hoc messages because it makes silence
        visible. Ask athletes to send, by Sunday evening, four short lines:
      </p>
      <ul>
        <li>How the week felt overall, from 1 to 10.</li>
        <li>Sleep, work and stress: anything unusual.</li>
        <li>
          Any pain: where, and how bad from 0 to 10. "Nothing" is a useful
          answer.
        </li>
        <li>One thing they want for next week, or a constraint.</li>
      </ul>
      <p>Reply on Monday with four things as well:</p>
      <ul>
        <li>
          One observation from the data, specific: "Your easy runs came down
          from 142 to 136 bpm at the same pace since September."
        </li>
        <li>
          One thing that went well, and why it matters. "Good job" is not
          feedback; "you held back on the first two reps, which is why the last
          one was your fastest" is.
        </li>
        <li>What next week is for, in one sentence.</li>
        <li>Any change to the plan, and the reason.</li>
      </ul>
      <p>
        For athletes on a cheaper plan, make it fortnightly or monthly. The
        structure matters more than the frequency.
      </p>

      <h2>Use RPE as a conversation, not a form</h2>
      <p>
        Session RPE, the athlete's rating of the whole session on a 0–10 scale
        given after it ends, multiplied by its duration in minutes, is a simple
        and well-studied way to quantify internal load (
        <a href="https://doi.org/10.1519/00124278-200102000-00019">
          Foster et al., Journal of Strength and Conditioning Research, 2001
        </a>
        ). It's also the cheapest feedback channel you have. A 45-minute easy
        run rated 7 is a question worth asking. Three in a row is a pattern:
        poor sleep, an illness on the way, paces set too high, or a life that
        got heavier.
      </p>
      <p>
        Comment on the number, at least sometimes. Athletes stop filling in RPE
        when they feel nobody reads it.
      </p>

      <h2>Write the purpose on the session</h2>
      <p>
        "Tempo 3 × 10'" tells the athlete what to do, not why. A line of intent
        changes how the session is run: "Comfortably hard, you should be able to
        say a short sentence. If the last rep is much slower than the first, the
        first was too fast." It also answers the questions you would otherwise
        get by message.
      </p>
      <p>
        Vocabulary deserves the same care. Threshold, tempo, Z2, VMA, "easy":
        each coach uses them a little differently. Keep a short glossary with
        your definitions and the athlete's own paces, and link to it in the
        first week.
      </p>

      <h2>Bad sessions and bad races</h2>
      <p>
        These are where trust is built or lost. A few things that tend to work:
        ask before you analyse ("How did it feel from the inside?"), separate
        what was in their control from what wasn't (heat, a course that turned
        out hillier, a cold), name one thing to keep and one thing to change,
        and move on to the next goal within the week. Avoid post-mortems by text
        the same evening. The athlete is tired and disappointed; you're reading
        a graph. Tomorrow, by phone, is better.
      </p>

      <h2>Set expectations on response time</h2>
      <p>
        Athletes don't need instant replies. They need to know when they'll get
        one. Put it in writing: "I answer within one working day, not at
        weekends, except during race week." Then keep to it. That beats replying
        at 11 p.m. one week and after four days the next.
      </p>
      <p>
        Sport psychologists who study the coach-athlete relationship describe it
        with words like closeness, commitment and complementarity (Jowett and
        Ntoumanis,{' '}
        <a href="https://doi.org/10.1111/j.1600-0838.2003.00338.x">
          Scandinavian Journal of Medicine &amp; Science in Sports, 2004
        </a>
        ). Remote coaching builds those mostly through small, reliable routines:
        the Monday reply that always comes, the comment that shows you looked at
        the run.
      </p>

      <h2>How OpenAthlete is set up for this</h2>
      <p>
        In OpenAthlete, every session and activity has its own comment thread,
        separate from the general chat, which can be one-to-one or a group, with
        read receipts. You choose which athlete events post a notice in your
        conversation (a new activity, a comment, a changed RPE), and you can
        require an RPE or a comment before a session counts as done. With AI
        turned on, athletes can answer a few short questions after each
        activity, by text or voice, and reported pain lands in your list of
        athletes to look at. More on the{' '}
        <Link href="/coaches">coaches page</Link>.
      </p>
    </div>
  );
}
