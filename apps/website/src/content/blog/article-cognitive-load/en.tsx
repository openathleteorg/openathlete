import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        Most runners have had this evening: a day of meetings and screens, then
        a threshold session that should have been routine. The splits come out
        slower, or they come out on target but every rep feels a notch harder
        than last week. Nothing in the heart-rate trace explains it. Sports
        scientists have spent the last fifteen years asking whether the tired
        brain is the reason, and the answer is a qualified yes.
      </p>

      <h2>What the experiments found</h2>
      <p>
        The study that started the field is Marcora, Staiano and Manning (
        <a href="https://doi.org/10.1152/japplphysiol.91324.2008">
          J Appl Physiol, 2009
        </a>
        ). Sixteen people cycled to exhaustion at 80% of their peak power, once
        after 90 minutes of a demanding computer task and once after 90 minutes
        of watching documentaries. After the mental task they stopped about 15%
        earlier: 640 seconds on average against 754. Heart rate, blood lactate
        and oxygen uptake were no different. What changed was perceived effort,
        which was higher from the start.
      </p>
      <p>
        Running followed. Pageaux and colleagues had participants do 30 minutes
        of a Stroop task, which asks you to keep overriding an automatic
        response, then run a 5 km time trial (
        <a href="https://doi.org/10.1007/s00421-014-2838-5">
          Eur J Appl Physiol, 2014
        </a>
        ). They ran it in 24.4 minutes on average against 23.1 after an easy
        control task, by choosing a slower speed throughout, even though they
        did not report feeling mentally fatigued.
      </p>
      <p>
        A systematic review of eleven studies by Van Cutsem and colleagues
        reached the same picture: endurance performance drops after prolonged
        mental effort, perceived exertion is higher, and the usual physiological
        markers do not move (
        <a href="https://pubmed.ncbi.nlm.nih.gov/28044281/">Sports Med, 2017</a>
        ). Maximal strength and short anaerobic efforts were not affected.
      </p>

      <h2>How big is the effect, really?</h2>
      <p>
        Less certain than the early headlines suggested. Holgado and colleagues
        re-analysed the literature with methods that correct for publication
        bias, the tendency for positive results to get published and null
        results to stay in drawers (
        <a href="https://doi.org/10.5334/joc.126">J Cogn, 2020</a>). The raw
        effect on performance was moderate; after correction it shrank to
        something small and not statistically significant. Their conclusion was
        that the evidence is not yet conclusive.
      </p>
      <p>
        So the honest reading is this: the lab protocols are artificial (90
        minutes of a task designed to be draining), the samples are small, and
        the true average effect may be modest. But the direction is consistent,
        and it matches what many athletes and coaches see. And even if your 5 km
        time barely changes, the higher perceived effort is real, which matters
        for how a session goes and whether you finish it.
      </p>

      <h2>Why it happens</h2>
      <p>
        The leading explanation is Marcora's psychobiological model: you slow
        down or stop when the effort you perceive reaches the most you are
        willing to give, or when you believe you've given everything you can.
        Mental fatigue does not empty your muscles; it raises the perceived cost
        of each kilometre, so you reach that limit sooner. This is why the
        cognitive load shows up in RPE and not in heart rate. The precise brain
        mechanisms are still debated.
      </p>

      <h2>Where cognitive load comes from in endurance sport</h2>
      <p>
        For most amateurs, the main source is outside training: work, study,
        young children, a long commute. But races add their own. A night section
        of a mountain ultra means hours of picking foot placements on technical
        ground, navigating, managing food and pace, often on little or no sleep.
        Triathletes manage transitions, drafting rules and nutrition plans. A
        city marathon asks less of your attention, but holding a precise pace
        for three hours is still effortful concentration.
      </p>

      <h2>What to do with this</h2>
      <p>
        Plan your key sessions around your heavy days. If Wednesday is always
        your worst day at work, don't put 5 × 4' at threshold on Wednesday
        evening. Move it to the morning, or swap it with Thursday's easy run.
        This one change does more than any amount of monitoring.
      </p>
      <p>
        When you can't move it, keep the targets and accept a higher RPE, or
        trim the volume (four reps instead of five) rather than chasing faster
        splits. And don't judge your fitness from a session done in that state:
        a slow interval session after a draining day says little about where you
        are.
      </p>
      <p>
        Log what your watch can't see. Rate each session from 0 to 10 about half
        an hour afterwards and add one line of context ("long day, slept 6 h").
        After a few weeks you will see whether your RPE rises on demanding days
        for the same pace and heart rate. If it does, you have your own
        evidence, which is worth more than the average of a lab study.
      </p>
      <p>
        For long races, practise the mental side too. Some long runs on
        technical terrain or at night, with your race nutrition, teach you how
        your pacing and decisions change when you're tired in the head as well
        as in the legs.
      </p>

      <h2>This week</h2>
      <p>
        Look at your week ahead and mark the two days that will drain you most.
        Make sure neither has a hard session in the evening. After each run,
        write down a 0–10 rating and a few words about your day.
      </p>

      <p>
        In OpenAthlete you can drag a session to another day in the calendar,
        and RPE is logged on each activity next to pace and heart rate. With the
        AI features on, a few questions after each activity ask about effort,
        fatigue and sleep, and the RPE is filled in from your answers. It is
        free; the <Link href="/features/training-load">training load page</Link>{' '}
        explains how RPE and heart rate are combined.
      </p>
    </div>
  );
}
