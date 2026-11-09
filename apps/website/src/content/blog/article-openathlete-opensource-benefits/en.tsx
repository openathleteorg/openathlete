import Link from 'next/link';

export function ContentEn() {
  return (
    <div>
      <p>
        A few years of training history is a lot of material: every interval
        session, every heart rate trace, every note that says "slept five hours,
        legs dead". For a coach it is more than that: years of structured
        workouts, templates and seasons built for each athlete. Where that
        material lives, and who decides what happens to it, seems like an
        abstract question right up to the day a platform closes or changes
        hands.
      </p>

      <h2>Platforms close, and change owners</h2>
      <p>
        Today's Plan, a training and coaching platform, shut down in March 2024.
        Its users had to export what they could and rebuild elsewhere. In July
        2026 Garmin{' '}
        <a href="https://www.garmin.com/en-US/newsroom/press-release/corporate/garmin-acquires-trainingpeaks-and-trainheroic-leading-endurance-and-strength-training-platforms-for-athletes-and-coaches/">
          acquired TrainingPeaks and TrainHeroic
        </a>
        . TrainingPeaks carries on, and nothing says it will treat other brands
        differently. But the plans, workout libraries and coaching relationships
        of many endurance coaches now belong to a watch maker, and the decisions
        about that platform will be made with Garmin's interests in mind.
      </p>
      <p>
        None of this is a scandal. Companies get bought and sometimes fail. The
        point is that, with a closed platform, your training history is only as
        durable as the business behind it.
      </p>

      <h2>What "export your data" really gets you</h2>
      <p>
        If you live in the EU, Article 20 of the GDPR gives you a right to data
        portability: the data you provided, in a structured, machine-readable
        format. In practice, what you can take away varies a lot. Activity files
        (FIT, GPX) usually come out fine, because every tool reads them. Planned
        workouts, coach comments, templates and the way a season was built are
        another matter: they tend to be stored in a platform's own format, and
        even when you can export them, nothing else may be able to import them.
      </p>
      <p>
        Two habits help whatever tool you use. Keep your activities flowing to
        more than one place, for instance from your watch account to both your
        training platform and a second service, so no single company holds the
        only copy. And request a full export once a year, before you need it, to
        see what you would actually get.
      </p>

      <h2>What open source changes, and what it doesn't</h2>
      <p>
        OpenAthlete's code is{' '}
        <a href="https://github.com/openathleteorg/openathlete">public</a>. That
        has a few concrete consequences. You can read how training load is
        computed instead of trusting a black box. You can see which data leaves
        the server and where it goes. And if the project stopped tomorrow, the
        code, the database schema and the migration files would still be there,
        and anyone could keep running it. The data itself sits in an ordinary
        PostgreSQL database, not in a format only one company understands.
      </p>
      <p>
        Open source does not make software secure by itself. Code that nobody
        reads is no safer for being public, and a small project has fewer
        reviewers than a popular one. It does not guarantee that someone will
        keep maintaining it either. What it guarantees is that you are allowed
        to look, and that the option to carry on without the original author
        exists.
      </p>

      <h2>Why the AGPL</h2>
      <p>
        OpenAthlete is licensed under the{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html">
          GNU Affero General Public License v3
        </a>
        . Anyone can use it, modify it, run it and redistribute it. The
        condition is that if you modify it and let people use your version over
        a network, you must offer those users the source code of your version.
        Ordinary GPL does not require that for software run as a web service,
        which is why the Affero variant exists.
      </p>
      <p>
        In practice it means nobody can take OpenAthlete, add features, and sell
        it as a closed hosted service. Improvements made by anyone who runs it
        for others come back to everyone. The hosted version at openathlete.org
        runs the same public code; features that only make sense there, such as
        billing, are switched off unless they are configured.
      </p>

      <h2>Self-hosting, honestly</h2>
      <p>
        You can run OpenAthlete on your own server with the{' '}
        <code>docker-compose.yml</code> from the repository or the published
        images on GHCR. It needs PostgreSQL and Redis, both included in the
        compose file. It is free, with no limit on athletes and no paywall. A
        self-hosted instance sends nothing to OpenAthlete, and an automated test
        checks that on every release. You can connect single sign-on through
        OIDC, choose open, invite-only or closed signups, and run the AI
        features on a local model through Ollama, so that nothing at all leaves
        your machine.
      </p>
      <p>
        The costs are real, though. You are responsible for backups, updates and
        security. Watch connections use your own developer credentials from each
        provider: some, like Strava, are quick to obtain, while others, like
        Garmin, review applications before granting API access. Uploading FIT,
        GPX or TCX files works without any of that. Self-hosting makes most
        sense for a coach or a group with someone comfortable running a server,
        or an organisation that needs its athletes' data on its own
        infrastructure. The <Link href="/self-hosting">self-hosting page</Link>{' '}
        covers the setup.
      </p>

      <h2>If you would rather not run a server</h2>
      <p>
        The hosted version is free with every feature. Its API and database run
        at OVH in France, and the web app is served by Vercel. The Supporter
        plan (€5 a month or €50 a year) adds AI on OpenAthlete's keys and
        coaching for more than five athletes, and it helps pay for the servers.
        More on the reasoning behind the project on the{' '}
        <Link href="/open-source">open source page</Link>.
      </p>
    </div>
  );
}
