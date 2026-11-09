import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Runners who trust their GPS to the metre are often suspicious of a
        number they make up themselves. "My 6 is not your 6," they say, and they
        are right. But that objection matters less than it sounds. What you need
        from a fatigue measure is not that it compares you with other people,
        but that it tracks you, over time, reliably. On that test, perceived
        exertion does surprisingly well.
      </p>

      <h2>Where the scales come from</h2>
      <p>
        Gunnar Borg, a Swedish psychologist, built the first rating of perceived
        exertion in the 1960s and 1970s: the 6–20 scale, whose numbers roughly
        follow heart rate divided by ten in young adults. He later designed the
        category-ratio CR-10 scale, from 0 (nothing at all) to 10 (maximal),
        with verbal anchors spaced so that the numbers behave more like a ratio
        (
        <a href="https://pubmed.ncbi.nlm.nih.gov/7154893/">
          Borg, Med Sci Sports Exerc, 1982
        </a>
        ). The 0–10 scale is the one most coaches use today.
      </p>
      <p>
        Carl Foster's contribution was to rate the whole session instead of a
        single moment, and to multiply it by the duration (
        <a href="https://pubmed.ncbi.nlm.nih.gov/11708692/">
          Foster et al., J Strength Cond Res, 2001
        </a>
        ). Sixty minutes at 4 is a load of 240 arbitrary units. That one number,
        tallied over a week, gave coaches a load measure for any kind of
        session, including strength work and team practice where heart rate says
        little.
      </p>

      <h2>The evidence that it works</h2>
      <p>
        A review of the session-RPE literature found 36 studies on its validity
        and reliability, across sports, sexes, ages and levels, and concluded
        that the method holds up (Haddad et al.,{' '}
        <a href="https://doi.org/10.3389/fnins.2017.00612">
          Front Neurosci, 2017
        </a>
        ). Against heart-rate-based load, agreement is good but not perfect,
        which is what you would expect from two different views of the same
        thing.
      </p>
      <p>
        The more surprising result comes from Saw, Main and Gastin, who reviewed
        56 studies that measured athletes' wellbeing both with questionnaires
        and with objective markers such as blood tests, resting heart rate and
        oxygen uptake (
        <a href="https://pubmed.ncbi.nlm.nih.gov/26423706/">
          Br J Sports Med, 2016
        </a>
        ). The subjective measures responded to changes in training load more
        sensitively and more consistently than the objective ones. Mood,
        perceived stress, perceived recovery: simple self-reports moved first.
      </p>
      <p>
        Questionnaires of this kind go back at least to Hooper and Mackinnon (
        <a href="https://doi.org/10.2165/00007256-199520050-00003">
          Sports Med, 1995
        </a>
        ), whose short daily ratings of sleep, fatigue, stress and muscle
        soreness are still used as the Hooper index.
      </p>

      <h2>Why subjective is the point</h2>
      <p>
        Perceived exertion integrates things no sensor measures directly: how
        much the session asked of your attention, how you slept, the heat, the
        state of your legs. That is why it is the measure most affected by
        mental fatigue. In Marcora's 2009 experiment, prolonged mental effort
        shortened time to exhaustion with heart rate and lactate unchanged; the
        only thing that moved was perceived effort (
        <a href="https://doi.org/10.1152/japplphysiol.91324.2008">
          J Appl Physiol, 2009
        </a>
        ). A watch records the same run either way. Your RPE does not. We cover
        this in more detail in our article on{' '}
        <Link href="/blog/understanding-cognitive-load-in-endurance-sports">
          cognitive load in endurance sports
        </Link>
        .
      </p>
      <p>
        The weaknesses are real too. RPE can be inflated by a bad mood or
        deflated by pride. Athletes who want to look tough under-report, and the
        ones who fear their coach will cut their volume do too. Hooper and
        Mackinnon already noted that highly motivated athletes may hide the
        early signs of overtraining. The number is only as good as your honesty
        and your consistency.
      </p>

      <h2>How to rate so the number means something</h2>
      <p>
        Rate about 30 minutes after the session, as Foster did. Right at the
        end, the last rep dominates; the next morning, the memory has faded.
        Rate the whole session, warm-up and cool-down included, by asking the
        same question every time: "how hard was that session overall?"
      </p>
      <p>
        Use the anchors. On Foster's version of the 0–10 scale, 2 is easy, 3
        moderate, 5 hard, 7 very hard, 10 the hardest you can imagine. A typical
        easy run sits around 2 to 3, a long run 4 to 5, 5 × 4' at threshold
        around 6 to 7, a hard 10 km race 9. If your easy runs keep coming out at
        5, either they are not easy or something else is going on.
      </p>
      <p>
        Don't adjust the number to match what you expected. If the plan said
        "easy" and it felt like a 5, write 5. That gap is the information.
      </p>

      <h2>What to do with the numbers</h2>
      <p>
        Multiply by minutes and add up the week. Watch the trend rather than any
        single session. Foster also proposed two derived measures: monotony, the
        week's average daily load divided by its standard deviation, and strain,
        weekly load multiplied by monotony (
        <a href="https://doi.org/10.1097/00005768-199807000-00023">
          Med Sci Sports Exerc, 1998
        </a>
        ). In his athletes, illnesses clustered after periods of high strain.
        The practical message is older than the formula: weeks where every day
        is moderately hard are riskier than weeks with clearly easy and clearly
        hard days.
      </p>
      <p>
        Most useful of all, compare RPE with what the session should have cost.
        The same easy loop at the same pace rated 3 for months, then 5 three
        times in a week, tells you something before your performances drop.
      </p>

      <h2>This week</h2>
      <p>
        Rate every session on the 0–10 scale half an hour after finishing,
        multiply by the duration, and total it on Sunday. Note which sessions
        came out higher than you expected and what else happened that day. That
        is the whole method.
      </p>

      <p>
        In OpenAthlete, each activity has an RPE field, and the session-RPE load
        is shown next to heart-rate TRIMP. If you turn on the AI features, three
        or four questions after each activity, answered by text, a tap or voice,
        fill in the RPE and log any pain. It is free; the{' '}
        <Link href="/features/training-load">training load page</Link> explains
        how the numbers fit together.
      </p>
    </div>
  );
}
