import Link from 'next/link';

import { Sources } from './sources';

export function ContentEn() {
  return (
    <div>
      <p>
        "AI" covers two very different things in training software, and the
        marketing tends to blur them. The first is statistical models that work
        on numbers: heart rate, pace, power, heart rate variability, sleep. They
        estimate or try to predict something. The second is language models, the
        ChatGPT, Claude and Mistral family, which read and write text. The
        evidence for each is quite different, so it helps to take them one at a
        time.
      </p>

      <h2>A lot of what is sold as AI is arithmetic</h2>
      <p>
        Fitness, fatigue and form curves (CTL, ATL, TSB) are exponentially
        weighted averages of daily load, descended from Banister's
        impulse-response model of the 1970s. TRIMP turns duration and heart rate
        into a load score. Session RPE is even simpler: Foster's method
        multiplies the athlete's rating of effort on a 0–10 scale by the
        duration in minutes, so a 60-minute run at RPE 6 is 360 units. None of
        this is machine learning, and that is a good thing. You can check the
        formula, you know what it ignores, and when the number looks wrong you
        can work out why.
      </p>
      <p>
        The consensus statement on load monitoring published by Bourdon and
        colleagues in 2017 recommends exactly this kind of tooling: measure what
        was done (external load, such as distance and pace) and how hard it was
        for the athlete (internal load, such as heart rate and RPE), and look at
        both together over time. That is still the backbone of good practice,
        and it needs no neural network.
      </p>

      <h2>Prediction is weaker than the adverts suggest</h2>
      <p>
        Injury prediction is where claims run furthest ahead of the data. Roald
        Bahr's 2016 review in the British Journal of Sports Medicine explains
        why screening tests cannot predict injury for an individual: even a
        strong risk factor at group level leaves huge overlap between the
        athletes who get hurt and those who do not. Machine learning has not
        changed that picture much yet. A 2021 systematic review by Van Eetvelde
        and colleagues found eleven studies on machine learning for sports
        injury prediction, with performance ranging from barely better than a
        coin toss (an AUC of 0.52) to good (0.87), and called for more work on
        interpreting the models.
      </p>
      <p>
        The acute:chronic workload ratio is a useful cautionary tale. For a few
        years, the idea that a ratio between 0.8 and 1.3 was a safe "sweet spot"
        spread through apps and coaching courses. Impellizzeri and colleagues
        showed in 2020 that the ratio has basic statistical problems, and that
        the evidence for the sweet spot does not hold up. Big week-to-week jumps
        in load are still a bad idea. A precise risk figure built on that ratio
        is not.
      </p>
      <p>
        So when an app shows you "injury risk: 23%", ask how that number was
        validated, on whom, and how often it was wrong. If there is no answer,
        treat it as decoration.
      </p>

      <h2>Where models on numbers do help: HRV, with a baseline</h2>
      <p>
        Heart rate variability is the most useful daily signal most athletes can
        measure at home. In a small four-week study, Kiviniemi and colleagues
        (2007) let morning HRV decide each day's session: hard if HRV held
        steady or rose, easy or rest if it dropped below the athlete's own
        recent range. That group improved maximal running speed more than a
        group following a fixed plan. Plews and colleagues (2013) added an
        important practical point: a single morning reading is noisy, and
        rolling averages over about a week, compared against the athlete's own
        baseline, are much more informative.
      </p>
      <p>
        Notice what this is: a personal baseline and a simple rule. It works
        because it is individual, not because the model is clever. It also needs
        disciplined measurement, every morning in the same conditions, which is
        where most people fall down.
      </p>

      <h2>Subjective data still beats most sensors</h2>
      <p>
        Saw, Main and Gastin's 2016 systematic review compared subjective
        measures (mood, perceived stress, fatigue) with objective ones (blood
        markers, resting heart rate, heart rate response to exercise). The
        subjective measures tracked changes in training load with better
        sensitivity and consistency. In plain terms, asking the athlete how they
        feel, and recording it every time, is one of the best monitoring tools
        available.
      </p>
      <p>
        This is where language models turn out to be genuinely useful, in an
        unglamorous way. An athlete will happily type or say "legs heavy from km
        8, left Achilles a bit sore on the stairs afterwards", and rarely fill
        in five sliders. A language model can turn that sentence into an effort
        score and a pain note (left Achilles, mild, after the run) that a coach
        can filter and chart. It is structured data entry, done by something
        that understands loose phrasing.
      </p>

      <h2>Language models writing training plans</h2>
      <p>
        Düking and colleagues (2024) asked ChatGPT for six-week running plans
        with three levels of detail in the prompt and had coaching experts rate
        them against 22 quality criteria. With minimal input, the plan scored
        below the midpoint on 19 of the 22 criteria. With detailed input
        (training history, goals, constraints), that dropped to one. The authors
        still advise against using such plans without an expert coach's
        feedback. A study of resistance training programmes by Washif and
        colleagues (2024) reached a similar conclusion: plausible drafts that
        need fine-tuning by someone who knows the field.
      </p>
      <p>
        Language models also state false things fluently, a failure known as
        hallucination (Ji and colleagues, 2023, survey the problem). In
        training, that looks like a weekly volume that does not add up, a
        "study" that does not exist, or a recovery run quietly placed at
        threshold pace. These errors are easy to miss precisely because the rest
        of the text reads well.
      </p>

      <h2>What this means in practice</h2>
      <p>
        Use language models for text work: writing a structured session from a
        description, summarising a month of notes, capturing feedback after a
        session, explaining a concept. Keep decisions about load and intensity
        on numbers you can check, ideally with a coach or your own experience as
        the final filter. Be sceptical of any risk score whose validation you
        cannot see. And if you want one habit that the research clearly
        supports, record how every session felt.
      </p>

      <h2>How OpenAthlete uses AI</h2>
      <p>
        Training load in OpenAthlete is TRIMP from heart rate, with session RPE
        beside it: formulas, not a black box. AI is optional and handles the
        text work described above: a structured session from a sentence, three
        or four questions after an activity that become an effort score and a
        pain log for the coach, and a short read of each activity. There is no
        injury prediction. The <Link href="/features/ai-coach">AI page</Link>{' '}
        lists what it does and which providers you can use.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
