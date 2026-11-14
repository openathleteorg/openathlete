import Link from 'next/link';

import { articlePrices } from './prices';
import { SOURCES } from './sources';

export function ContentEn() {
  const p = articlePrices('en');
  return (
    <div>
      <p>
        On 22 July 2026, Garmin announced that it had bought TrainingPeaks and
        TrainHeroic, the strength-training app from the same parent company,
        Peaksware. The terms were not disclosed. Since then the same question
        keeps coming up on coaching forums and in our inbox: should I move, and
        if so, where to?
      </p>
      <p>
        The short answer is that nothing forces you to move today. The longer
        answer follows, with the alternatives worth a look and how to take your
        history with you. We build one of them, OpenAthlete, so read that part
        with the scepticism it deserves. We have tried to describe the others
        the way their own users would.
      </p>

      <h2>What actually changed</h2>
      <p>
        The owner. So far, that is all. The{' '}
        <a href={SOURCES.garminPress}>Garmin press release</a> says about 120
        people from TrainingPeaks and TrainHeroic join Garmin and that the
        platforms stay in Louisville, Colorado. It says nothing about accounts,
        prices or device support. No price change has been announced for Premium
        or Coach Edition, and coach accounts work as they did in June. Some
        outlets, <a href={SOURCES.cyclelytic}>CycleLytic</a> among them,
        reported that Garmin said compatibility with other watch brands would
        not change. We could not find that commitment in writing from Garmin,
        and we have seen nothing pointing the other way either. Your COROS,
        Suunto, Polar and Wahoo athletes still sync.
      </p>
      <p>
        So why are coaches asking? Mostly because of who now sets the roadmap.
        TrainingPeaks was valuable as the neutral layer between every watch
        brand and every coach. A watch maker now decides where its engineers
        spend their time. Garmin may well keep it neutral, since that neutrality
        is what it paid for. Still, when Garmin bought Firstbeat in 2020 it said
        third-party licensing would continue, and{' '}
        <a href={SOURCES.the5krunner}>the5krunner</a>, citing DC Rainmaker,
        notes that new third-party deals have since dried up. That proves
        nothing about TrainingPeaks. It does explain why coaches with mixed
        rosters are paying attention.
      </p>
      <p>
        Then there is precedent. Today&apos;s Plan was owned by Specialized, had
        a loyal base of cycling coaches, and{' '}
        <a href={SOURCES.todaysPlan}>shut down in March 2024</a>. Coaches with
        years of athlete history on it had a few months to get it out. Nobody
        expects the same from TrainingPeaks, which is far bigger, but people who
        went through it now keep an exit plan. And money was already a topic
        before July: Premium went from $124.99 to $134.99 a year in April 2025.
      </p>

      <h2>Should you switch?</h2>
      <p>
        For many people, the honest answer is no, or not yet. Go through the
        following before you spend a weekend migrating.
      </p>

      <h3>Your athletes&apos; watches</h3>
      <p>
        If every athlete you coach wears a Garmin, the acquisition is neutral
        for you, possibly good. If a third of your roster runs on COROS, Suunto
        or Polar, you are the one with something to watch. Make a list today:
        which brand each athlete uses, and whether planned workouts reach that
        watch. Workout delivery is what you would lose first if an integration
        ever got worse.
      </p>

      <h3>What you pay</h3>
      <p>
        List prices on {p.checkedOn}: TrainingPeaks Premium costs $19.95 a month
        or {p.tpPremiumYear} a year. Coach Edition starts at $21.99 a month with
        one Premium athlete included, then $9 down to $4.50 a month for each
        extra Premium athlete depending on roster size, plus a $99 set-up fee
        that a promo code waives (
        <a href={SOURCES.tpCoachPricing}>TrainingPeaks coach pricing</a>).
        Planned workouts only sync to devices for Premium athletes, so a coach
        who pays Premium for 10 athletes spends about {p.tpCoach10} a year
        before tax. If that is money you would rather keep, it is a reason to
        look around whoever owns the company.
      </p>

      <h3>What you depend on</h3>
      <p>
        Some things have no real equivalent elsewhere. If you sell plans on the
        TrainingPeaks marketplace, that audience does not follow you. If your
        athletes ride TrainingPeaks Virtual in winter, or love the native apps,
        count that in. And if your athletes are happy and you are the only one
        worried, moving 25 people for a hypothetical risk can cost more goodwill
        than it saves. Coaches who tried report that clients often simply say
        no.
      </p>

      <h3>Your data</h3>
      <p>
        Whatever you decide, export your history now. It takes an evening and
        removes most of the risk. How to do it is at the end of this post.
      </p>

      <h2>The independent alternatives</h2>
      <p>
        None of these belongs to a watch maker. Prices are the vendors&apos;
        list prices on {p.checkedOn}; check the linked page before you pay.
      </p>

      <h3>intervals.icu</h3>
      <p>
        Free, with a $4 a month Supporter tier (
        <a href={SOURCES.intervals}>intervals.icu</a>). For a self-coached
        athlete who likes data it is the obvious first stop: fitness, fatigue
        and form, power and pace curves, a workout builder, a calendar, and one
        of the longest integration lists around (Garmin, COROS, Suunto, Polar,
        Wahoo, Zwift and many more). Coaches can follow and plan for athletes;
        teams and coaching organisations need Supporter. There is no official
        mobile app (third-party apps fill the gap), and many users find the
        interface dense at first. If you live in the performance management
        chart, start here.
      </p>

      <h3>Nolio</h3>
      <p>
        From Grenoble, partner of the French athletics federation and the
        default in French clubs. Athletes are free (Premium €6.90 a month);
        coach plans start at €19.90 a month for 3 athletes and €29.90 for up to
        25, with cheaper plans for clubs that are registered associations (
        <a href={SOURCES.nolio}>Nolio pricing</a>). Native iOS and Android apps,
        a library of strength exercise videos, comments on each session. For a
        coach or club in France it is the closest like-for-like replacement.
        Less known elsewhere, and the price climbs by tier as the roster grows:{' '}
        {p.nolioCoach10} a year for a coach with 10 athletes.
      </p>

      <h3>Final Surge</h3>
      <p>
        American, popular with running coaches, high schools and colleges.
        Athletes get every athlete feature free; coaches pay a flat $19 a month
        for 1 to 5 athletes or $39 a month for up to 100 (
        <a href={SOURCES.finalSurge}>Final Surge pricing</a>). Native apps and
        structured workouts sent to Garmin and COROS. The flat price is the
        draw: 40 athletes cost the same as 10. Little presence in Europe, and no
        AI features that we could find, which some coaches will count as a plus.
      </p>

      <h3>Tredict</h3>
      <p>
        German, run by its owner, privacy-minded, and the most outspoken about
        the Garmin deal (<a href={SOURCES.tredictBlog}>their analysis</a>). It
        sends workouts to Garmin, COROS, Suunto, Wahoo, Hammerhead and Zwift,
        and has coaching features and an API. The pricing is unusual: $49 once
        for twelve months of full access, free read-only access after that, and
        a two-month trial (<a href={SOURCES.tredictPrice}>Tredict price</a>
        ). A small team and a small community, but close in spirit to what
        TrainingPeaks used to be for a lot of people.
      </p>

      <h3>Runalyze</h3>
      <p>
        Made in Kaiserslautern and Kiel, and a favourite of runners who want
        analysis: effective VO2max, race predictions, a marathon shape score,
        training load. It syncs from Garmin, COROS, Suunto, Polar, Wahoo, Strava
        and others. Free, with Premium at €60 a year (
        <a href={SOURCES.runalyze}>Runalyze pricing</a>). It is a training log
        and analysis tool rather than a planning or coaching platform, so it
        suits the self-coached runner who mostly used TrainingPeaks to look
        back, not the coach who plans for others.
      </p>

      <h3>Golden Cheetah</h3>
      <p>
        Free, open-source desktop software for Windows, macOS and Linux, cycling
        first, with deep power analysis (
        <a href={SOURCES.goldenCheetah}>goldencheetah.org</a>). No cloud, no
        coach collaboration, no workouts sent to watches. It earns its place
        here because nobody can ever switch it off.
      </p>

      <h3>OpenAthlete</h3>
      <p>
        Ours, so judge accordingly. It is open source (AGPL), free to self-host,
        or hosted by us in France. Every feature is free on the hosted version,
        coaching up to 5 athletes included; Supporter, at €5 a month or €50 a
        year, adds unlimited coached athletes and AI on our keys (
        <Link href="/pricing">pricing</Link>). Clubs get a free club space with
        no athlete limit: groups with their coaches, a shared library, weekly
        club sessions and plans copied to a whole group. Planned sessions go to
        Garmin, Suunto and COROS watches; activities come in from those three
        plus Polar and Strava. Training load is TRIMP from heart rate with
        session RPE alongside, and fitness, fatigue and form are projected over
        the sessions you have planned. AI is optional and runs on your own key
        or the Supporter allowance.
      </p>
      <p>
        The limits are real. There are no native apps in the stores yet: the iOS
        and Android apps are in testing, and athletes use the installable web
        app in the meantime. There is no marketplace for selling plans, no club
        billing (the club space is free, but membership fees are handled outside
        OpenAthlete), no indoor training app and no workouts sent to Polar
        watches. The analysis is shallower than intervals.icu, and the project
        is young and built by one developer. Our answer to &quot;what if you
        disappear&quot; is the licence: the code and your data stay usable
        without us. The line-by-line comparison is on{' '}
        <Link href="/compare/trainingpeaks">OpenAthlete vs TrainingPeaks</Link>,
        how coaching works is on <Link href="/coaches">the coaches page</Link>,
        and the other comparisons are <Link href="/compare">here</Link>.
      </p>

      <h2>How to move without losing your history</h2>

      <h3>Export from TrainingPeaks first</h3>
      <p>
        TrainingPeaks&apos; help center describes an Export Data function in the
        web app: you pick a period of up to 12 months and get a folder with all
        the workout files from it, and the same tool can produce a CSV summary
        of your workouts. Single files can also be downloaded from each workout,
        in the format they were uploaded in (
        <a href={SOURCES.tpExportHelp}>Data Export</a>). A{' '}
        <a href={SOURCES.tpExportBlog}>TrainingPeaks blog post</a> says bulk
        export is for Athlete Edition subscribers, and some forum users say it
        needs Premium, so check what your account shows. Six years of history
        means six exports. Do it before you cancel, not after. We found no
        documented way to export your workout library or future plan in bulk, so
        expect to rebuild the templates you reuse.
      </p>

      <h3>Reconnect your watch accounts</h3>
      <p>
        Most platforms pull past activities from the watch brand when you
        connect it, which is easier than files. How far back you get depends on
        the brand&apos;s API more than on the platform. On OpenAthlete, Strava
        and COROS give the full history (COROS sends 50 files a day, so a long
        history takes several days to arrive), Garmin and Suunto the last 30
        days, and Polar nothing from before the connection. Other platforms run
        into similar limits for the same reasons; ask before you count on a full
        import.
      </p>

      <h3>Fill the gaps with FIT files</h3>
      <p>
        What the API does not return, your export folder does. Upload the FIT
        files to the new platform; on OpenAthlete you can drop several at once
        onto the calendar (20 MB per file). Multisport FIT files from a
        triathlon are not supported yet.
      </p>

      <h3>Run both for one block</h3>
      <p>
        If you coach, keep TrainingPeaks for one more block while your athletes
        connect to the new platform, plan the next four weeks there, and see
        what breaks. Moving after a goal race or at the start of the off-season
        is much easier than in the middle of a marathon build.
      </p>
      <p>And if you only do one thing this month, make it the export.</p>
    </div>
  );
}
