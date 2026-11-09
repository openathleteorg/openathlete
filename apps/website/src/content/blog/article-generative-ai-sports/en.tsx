import Link from 'next/link';

import { Sources } from './sources';

export function ContentEn() {
  return (
    <div>
      <p>
        Generative AI is neither a gadget nor a revolution for an endurance
        athlete. It is a text tool. It is very good at turning loose language
        into structure and structure into readable language, and unreliable
        whenever it has to be right about your body or about numbers nobody gave
        it. Once you see it that way, it becomes clear where it saves time and
        where it can hurt you.
      </p>

      <h2>Good at: writing a session</h2>
      <p>
        Typing a structured workout into a watch app is tedious. Describing it
        is not. "20 minutes easy, then 6 × 3 minutes hard with 2 minutes
        jogging, 10 minutes cool-down" is the kind of sentence a language model
        handles well: it splits it into steps, works out the repeats, and, if it
        knows your zones, gives each step a target. "Hard" for 3 minutes becomes
        your VO2max pace range, "jogging" becomes recovery pace.
      </p>
      <p>
        Two things are worth checking before the session goes to your watch: the
        total duration (models occasionally drop or double a block) and the
        intensity it chose for vague words. "Hard" can mean threshold to one
        person and 5 km pace to another. If the model picked the wrong one, tell
        it, or write "at threshold" next time.
      </p>

      <h2>Good at: turning feedback into data</h2>
      <p>
        After a long run, most people will not fill in a form with five sliders.
        They will say something like "first hour fine, then the heat got to me,
        last 5 km were a struggle and my right calf tightened up." A language
        model can turn that into an effort rating of around 8 and a note: right
        calf, tightness, late in the run. Over weeks, those notes become
        something a coach can actually filter.
      </p>
      <p>
        This matters more than it sounds. A systematic review by Saw and
        colleagues (2016) found that subjective, self-reported measures track
        training load better than most objective markers. The bottleneck has
        always been getting athletes to record them. Lowering the effort to a
        sentence or a voice note helps.
      </p>

      <h2>Good at: summarising and rewriting</h2>
      <p>
        Paste four weeks of session notes and ask for a summary before you talk
        to your coach: it will pull out the recurring themes (the Achilles that
        complains after hills, the Thursday sessions that keep getting skipped)
        faster than you would. It can rewrite a week around a constraint, say a
        work trip from Tuesday to Thursday with only a hotel treadmill, and give
        you a reasonable draft. It can translate a plan your coach wrote in
        another language. In each case you get a draft to check, not an answer
        to obey.
      </p>

      <h2>Usable with care: explaining</h2>
      <p>
        Ask what separates threshold work from VO2max intervals, or why long-run
        pace should feel easy, and you will usually get a decent explanation.
        The risk is that it will add a confident detail that is wrong, or cite a
        study that does not exist. Language models produce fluent text, not
        checked facts, a problem researchers call hallucination (Ji and
        colleagues, 2023). If an answer cites a source, look the source up
        before you repeat it.
      </p>

      <h2>Bad at: diagnosing</h2>
      <p>
        Type "outside of my knee hurts after 20 km" and you will get a tidy
        answer about the iliotibial band, with stretches and a return-to-run
        plan. It might be right. It might also be something else entirely, and
        the model has no way to tell: it cannot examine you, watch you run or
        press on the sore spot. A plausible answer to a medical question is
        worse than no answer, because it delays the visit that would have sorted
        it out. Pain that persists, makes you limp, gets worse as you run or is
        there at rest belongs with a physiotherapist or a doctor.
      </p>

      <h2>Bad at: full plans from nothing</h2>
      <p>
        Düking and colleagues (2024) asked ChatGPT for six-week running plans
        and had coaching experts rate them on 22 criteria. With little input,
        the plan scored below the midpoint on 19 of them. With detailed input it
        did much better, but the authors still advise against following such
        plans without an expert coach. The typical failure is easy to picture:
        you run 30 km a week, you ask for a marathon plan, and the first week
        has 50 km in it because the model filled your history with an average
        runner's.
      </p>

      <h2>Bad at: numbers it wasn't given</h2>
      <p>
        Ask "how much did I run in September?" without giving it your data and a
        chat model may simply invent a plausible figure. Even with the data
        pasted in, adding up thirty rows is not its strength. Totals, averages
        and load calculations should come from software that computes them, and
        the language model should only talk about the result.
      </p>

      <h2>Getting more useful answers</h2>
      <p>
        Give it context: your zones or recent race times, your weekly volume
        over the past four to six weeks, the race and its date, the days you can
        train, and any current niggle. Ask it to state its assumptions before it
        writes anything. Then check the output against a few plain rules: no big
        jump in weekly volume, no more hard sessions than you are used to (two a
        week is plenty for most amateur runners), and easy days that are
        actually easy.
      </p>

      <h2>In OpenAthlete</h2>
      <p>
        The AI features in OpenAthlete stay on the text side of that line. It
        writes a structured session from a sentence using your zones, edits a
        session from a short instruction, asks three or four questions after an
        activity and turns the answers into an effort score and a pain note for
        your coach, and gives a short read of each activity. You see every
        session before it goes to your watch. It does not diagnose anything, and
        it runs only with your consent, on your own API key or the Supporter
        allowance. The <Link href="/features/ai-coach">AI page</Link> has the
        details.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
