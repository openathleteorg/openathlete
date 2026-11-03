import type { BlogPost } from './types';

export const articleOpenathleteOpensourceBenefits: BlogPost = {
  metadata: {
    slug: 'why-openathlete-open-source-privacy-innovation-2025',
    title: {
      en: 'Why Open Source Matters: How OpenAthlete Protects Your Privacy and Drives Innovation',
      fr: "Pourquoi l'Open Source Compte : Comment OpenAthlete Protège Votre Confidentialité et Stimule l'Innovation",
      es: 'Por qué importa el código abierto: cómo OpenAthlete protege tu privacidad e impulsa la innovación',
    },
    description: {
      en: 'Why OpenAthlete is open source: what you can check in the code, how self-hosting keeps your training data on your server, and what AGPL means.',
      fr: "Pourquoi OpenAthlete est open source : ce que vous pouvez vérifier dans le code, l'auto-hébergement pour garder vos données chez vous, la licence AGPL.",
      es: 'Por qué OpenAthlete es de código abierto: qué puedes comprobar en el código, cómo el autoalojamiento deja tus datos en tu servidor y qué implica la AGPL.',
    },
    excerpt: {
      en: 'Open source software gives you control, transparency, and security. OpenAthlete is open source, meaning you can verify how your data is processed, self-host on your infrastructure, and contribute to improvements. Discover why this matters for athletes and coaches.',
      fr: 'Les logiciels open source vous donnent contrôle, transparence et sécurité. OpenAthlete est open source, ce qui signifie que vous pouvez vérifier comment vos données sont traitées, auto-héberger sur votre infrastructure et contribuer aux améliorations. Découvrez pourquoi cela compte pour les athlètes et les coachs.',
      es: 'El software de código abierto te da control, transparencia y seguridad. OpenAthlete es de código abierto: puedes comprobar cómo se procesan tus datos, autoalojarlo en tu propia infraestructura y contribuir a mejorarlo. Descubre por qué esto importa a atletas y entrenadores.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-01-21',
    tags: [
      'Open Source',
      'Privacy',
      'Data Security',
      'Self-Hosting',
      'Transparency',
      'Innovation',
      'Community',
      'GDPR',
      'Data Protection',
      'Free Software',
    ],
    readingTime: 10,
    image:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxvcGVuJTIwc291cmNlJTIwc29mdHdhcmUlMjBjb2RlJTIwc2VjdXJpdHklMjBwcml2YWN5JTIwdHJhbnNwYXJlbmN5JTIwdGVjaG5vbG9neXxlbnwwfDB8fHwxNzY1Mjg3MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div>
        <p>
          <strong>
            Your training data is personal. Your health metrics are sensitive.
            Your performance information is private.
          </strong>
        </p>

        <p>
          Yet most training platforms are "black boxes"—you have no idea how
          your data is processed, stored, or used. You're trusting a company
          with your most sensitive information, hoping they'll protect it.
        </p>

        <p>
          <strong>OpenAthlete is different.</strong> As an open-source platform,
          everything is transparent. You can see exactly how your data is
          handled, verify our security practices, and even run the software on
          your own infrastructure if you want complete control.
        </p>

        <h2>What Does "Open Source" Really Mean?</h2>

        <p>
          Open source means the source code of OpenAthlete is publicly available
          and can be viewed, audited, modified, and distributed by anyone. This
          is fundamentally different from proprietary software like
          TrainingPeaks, TrainerRoad, or Strava, where the code is secret and
          controlled by a single company.
        </p>

        <p>For OpenAthlete, this means:</p>
        <ul>
          <li>
            <strong>Full Transparency:</strong> Anyone can review the code to
            see exactly how data is processed
          </li>
          <li>
            <strong>Community Auditing:</strong> Security researchers and
            developers can identify and fix vulnerabilities
          </li>
          <li>
            <strong>No Vendor Lock-in:</strong> You're never trapped—you can
            always self-host or migrate
          </li>
          <li>
            <strong>Continuous Improvement:</strong> The community contributes
            features, fixes, and enhancements
          </li>
          <li>
            <strong>Complete Control:</strong> You can modify the software to
            fit your specific needs
          </li>
        </ul>

        <h2>1. Privacy and Data Protection: Your Data, Your Control</h2>

        <h3>The Problem with Proprietary Platforms</h3>
        <p>
          When you use proprietary training software, you're essentially saying:
          "I trust this company with my sensitive health data, and I hope they
          protect it." You have no way to verify:
        </p>
        <ul>
          <li>How your data is stored and encrypted</li>
          <li>Who has access to your data</li>
          <li>Whether your data is sold to third parties</li>
          <li>If the company follows security best practices</li>
          <li>
            What happens to your data if the company is acquired or shuts down
          </li>
        </ul>

        <h3>How Open Source Protects Your Privacy</h3>
        <p>With OpenAthlete, you can verify everything:</p>
        <ul>
          <li>
            <strong>Transparent Data Processing:</strong> Review the code to see
            exactly how your training data is processed, stored, and analyzed
          </li>
          <li>
            <strong>No Hidden Tracking:</strong> On the Cloud, analytics only
            run if you accept them; a self-hosted instance sends nothing to
            OpenAthlete, and an automated test checks it
          </li>
          <li>
            <strong>GDPR Compliance:</strong> Open source makes it easier to
            verify GDPR compliance and data protection practices
          </li>
          <li>
            <strong>Self-Hosting Option:</strong> For maximum privacy, you can
            run OpenAthlete on your own server with complete data sovereignty
          </li>
          <li>
            <strong>No Data Selling:</strong> Since the code is open, you can
            verify that we don't sell your data to third parties
          </li>
        </ul>

        <blockquote>
          <p>
            "With proprietary software, you're trusting a company. With open
            source, you're trusting the code—and you can verify it yourself."
          </p>
        </blockquote>

        <h3>Real-World Privacy Benefits</h3>
        <p>
          <strong>Example 1: Data Sovereignty</strong>
        </p>
        <p>
          If you're a professional athlete or coach working with sensitive
          training data, you might need to ensure your data stays within
          specific jurisdictions. With OpenAthlete, you can self-host on servers
          in your country or region, ensuring complete data sovereignty.
        </p>

        <p>
          <strong>Example 2: Compliance Requirements</strong>
        </p>
        <p>
          Organizations like sports federations or clubs may have strict data
          protection requirements. Open source allows them to audit the code,
          verify security practices, and ensure compliance with regulations like
          GDPR, HIPAA, or local data protection laws.
        </p>

        <h2>2. Security: Many Eyes Make Bugs Shallow</h2>

        <h3>The "Linus's Law" Advantage</h3>
        <p>
          Linus Torvalds, creator of Linux, famously said: "Given enough
          eyeballs, all bugs are shallow." This means that with open source
          software, more people can review the code, find vulnerabilities, and
          fix them quickly.
        </p>

        <p>
          <strong>How This Works for OpenAthlete:</strong>
        </p>
        <ul>
          <li>
            <strong>Community Security Audits:</strong> Security researchers can
            review the code and report vulnerabilities
          </li>
          <li>
            <strong>Faster Bug Fixes:</strong> When issues are found, the
            community can contribute fixes immediately
          </li>
          <li>
            <strong>No Hidden Vulnerabilities:</strong> Unlike proprietary
            software, security issues can't be hidden—they're visible to
            everyone
          </li>
          <li>
            <strong>Independent Verification:</strong> You don't have to trust
            our word—you can verify security practices yourself
          </li>
        </ul>

        <h3>Security Comparison: Open Source vs. Proprietary</h3>
        <table>
          <thead>
            <tr>
              <th>Aspect</th>
              <th>Proprietary Software</th>
              <th>Open Source (OpenAthlete)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Code Visibility</td>
              <td>❌ Hidden</td>
              <td>✅ Public</td>
            </tr>
            <tr>
              <td>Security Audits</td>
              <td>❌ Internal only</td>
              <td>✅ Community-wide</td>
            </tr>
            <tr>
              <td>Vulnerability Disclosure</td>
              <td>❌ May be hidden</td>
              <td>✅ Transparent</td>
            </tr>
            <tr>
              <td>Independent Verification</td>
              <td>❌ Not possible</td>
              <td>✅ Anyone can verify</td>
            </tr>
            <tr>
              <td>Bug Fix Speed</td>
              <td>❌ Depends on vendor</td>
              <td>✅ Community can fix</td>
            </tr>
          </tbody>
        </table>

        <h2>3. Innovation: Community-Driven Development</h2>

        <h3>Why Open Source Drives Innovation</h3>
        <p>
          Proprietary software companies have limited resources and must
          prioritize features that benefit the most users. This often means:
        </p>
        <ul>
          <li>Slow feature development</li>
          <li>Features that benefit the company, not necessarily users</li>
          <li>Limited customization options</li>
          <li>Innovation limited to internal team ideas</li>
        </ul>

        <p>
          <strong>Open source changes this completely:</strong>
        </p>
        <ul>
          <li>
            <strong>Community Contributions:</strong> Athletes, coaches, and
            developers can contribute features they actually need
          </li>
          <li>
            <strong>Faster Development:</strong> More developers means faster
            feature development and bug fixes
          </li>
          <li>
            <strong>Diverse Perspectives:</strong> Different users bring
            different needs and ideas, leading to more innovative solutions
          </li>
          <li>
            <strong>No Corporate Agenda:</strong> Features are driven by user
            needs, not profit margins
          </li>
          <li>
            <strong>Customization:</strong> Users can modify the software to fit
            their specific workflows
          </li>
        </ul>

        <h3>Real Examples of Open Source Innovation</h3>
        <p>
          <strong>Linux:</strong> Powers most of the internet, Android phones,
          and supercomputers—all because of open source innovation.
        </p>
        <p>
          <strong>WordPress:</strong> Powers 40% of all websites because the
          community continuously improves and extends it.
        </p>
        <p>
          <strong>Git:</strong> The version control system used by virtually
          every software company, created as open source.
        </p>

        <p>
          <strong>OpenAthlete:</strong> Already benefiting from community
          contributions—athletes and coaches are suggesting features, reporting
          bugs, and even contributing code improvements.
        </p>

        <h2>4. No Vendor Lock-in: You're Never Trapped</h2>

        <h3>The Problem with Proprietary Platforms</h3>
        <p>When you use proprietary software, you're locked in:</p>
        <ul>
          <li>
            <strong>Data Export Limitations:</strong> You can't easily export
            your data in a usable format
          </li>
          <li>
            <strong>Price Increases:</strong> Companies can raise prices knowing
            you're dependent on their platform
          </li>
          <li>
            <strong>Feature Removal:</strong> Features you rely on can be
            removed without your input
          </li>
          <li>
            <strong>Service Shutdowns:</strong> If the company shuts down, you
            lose access to your data and the platform
          </li>
          <li>
            <strong>Acquisition Risks:</strong> If the company is acquired, the
            new owner can change everything
          </li>
        </ul>

        <h3>How Open Source Prevents Lock-in</h3>
        <p>With OpenAthlete, you're never trapped:</p>
        <ul>
          <li>
            <strong>Self-Hosting Option:</strong> You can run OpenAthlete on
            your own infrastructure, independent of our cloud service
          </li>
          <li>
            <strong>Data Portability:</strong> Export all your data as one JSON
            file anytime, and your activities stay on your watch account
          </li>
          <li>
            <strong>Fork Capability:</strong> If you don't like our direction,
            you can fork the project and continue development independently
          </li>
          <li>
            <strong>No Subscription Dependency:</strong> Even if we stop
            offering cloud hosting, you can continue using the software
          </li>
          <li>
            <strong>Community Continuity:</strong> The community can continue
            development even if the original creators move on
          </li>
        </ul>

        <h2>5. Cost Savings: Free Software, Not "Free" Software</h2>

        <p>
          Open source doesn't just mean "free as in free beer"—it means "free as
          in freedom." But the cost savings are real:
        </p>
        <ul>
          <li>
            <strong>No Licensing Fees:</strong> Use OpenAthlete without paying
            licensing fees
          </li>
          <li>
            <strong>No Per-User Costs:</strong> Self-hosted, add as many
            athletes and coaches as you want; on the Cloud, coaching is free up
            to 5 athletes and unlimited with Supporter (€5/month or €50/year)
          </li>
          <li>
            <strong>Self-Hosting Savings:</strong> For organizations,
            self-hosting can save thousands compared to proprietary solutions
          </li>
          <li>
            <strong>No Vendor Markup:</strong> You're not paying for proprietary
            licensing overhead
          </li>
        </ul>

        <h2>6. Transparency and Trust</h2>

        <p>
          <strong>With proprietary software, you have to trust:</strong>
        </p>
        <ul>
          <li>That the company is telling the truth about security</li>
          <li>That they're not selling your data</li>
          <li>That they're following best practices</li>
          <li>That they'll continue supporting the software</li>
        </ul>

        <p>
          <strong>With open source, you can verify:</strong>
        </p>
        <ul>
          <li>Review the code yourself or hire someone to audit it</li>
          <li>See exactly how data is processed</li>
          <li>Verify security practices</li>
          <li>Know that the community can continue development</li>
        </ul>

        <blockquote>
          <p>"Trust, but verify. With open source, you can do both."</p>
        </blockquote>

        <h2>7. Customization and Flexibility</h2>

        <p>
          Every athlete and coach has unique needs. Proprietary software forces
          you to adapt to the software's limitations. Open source lets you adapt
          the software to your needs.
        </p>

        <p>
          <strong>With OpenAthlete, you can:</strong>
        </p>
        <ul>
          <li>
            <strong>Modify Features:</strong> Change how features work to fit
            your workflow
          </li>
          <li>
            <strong>Add Integrations:</strong> Build custom integrations with
            tools you already use
          </li>
          <li>
            <strong>Create Custom Reports:</strong> Generate reports tailored to
            your specific needs
          </li>
          <li>
            <strong>Adapt the UI:</strong> Customize the interface for your team
            or organization
          </li>
          <li>
            <strong>Build Workflows:</strong> Create automated workflows that
            fit your processes
          </li>
        </ul>

        <h2>Real-World Impact: Why This Matters for Athletes and Coaches</h2>

        <h3>For Individual Athletes</h3>
        <ul>
          <li>
            <strong>Privacy:</strong> Know exactly how your sensitive health
            data is handled
          </li>
          <li>
            <strong>Control:</strong> Self-host if you want complete data
            sovereignty
          </li>
          <li>
            <strong>Cost:</strong> Use advanced training software without paying
            expensive subscription fees
          </li>
          <li>
            <strong>Innovation:</strong> Benefit from community-driven
            improvements and features
          </li>
        </ul>

        <h3>For Coaches</h3>
        <ul>
          <li>
            <strong>Client Data Protection:</strong> Ensure your athletes' data
            is handled securely and transparently
          </li>
          <li>
            <strong>Compliance:</strong> Verify GDPR and data protection
            compliance for your clients
          </li>
          <li>
            <strong>Customization:</strong> Adapt the platform to your coaching
            methodology
          </li>
          <li>
            <strong>Cost Efficiency:</strong> Save money on software licensing
            to invest in your athletes
          </li>
        </ul>

        <h3>For Clubs and Organizations</h3>
        <ul>
          <li>
            <strong>Data Sovereignty:</strong> Self-host to keep all data within
            your infrastructure
          </li>
          <li>
            <strong>Scalability:</strong> On your own instance, add unlimited
            members without per-user licensing costs
          </li>
          <li>
            <strong>Compliance:</strong> Meet strict data protection
            requirements with auditable code
          </li>
          <li>
            <strong>Customization:</strong> Adapt the platform to your
            organization's needs
          </li>
        </ul>

        <h2>The Future of Sports Technology is Open</h2>

        <p>
          The future of software is open source. Major companies like Microsoft,
          Google, and Amazon are embracing open source. The benefits are clear:
          better security, faster innovation, more transparency, and user
          control.
        </p>

        <p>
          <strong>OpenAthlete wants to bring this to sports technology.</strong>{' '}
          We believe that athletes and coaches deserve:
        </p>
        <ul>
          <li>Transparency in how their data is processed</li>
          <li>Control over their training information</li>
          <li>Innovation driven by user needs, not profit</li>
          <li>Freedom from vendor lock-in</li>
          <li>Software that improves through community collaboration</li>
        </ul>

        <h2>Get Started with Open Source Training Software</h2>

        <p>
          Ready to experience the benefits of open source? OpenAthlete is free,
          open-source, and ready to use:
        </p>

        <ol>
          <li>
            <strong>Try the Cloud Version:</strong> Sign up for free at{' '}
            <a href="https://app.openathlete.org/auth/create-account">
              app.openathlete.org
            </a>{' '}
            and experience open-source training software
          </li>
          <li>
            <strong>Review the Code:</strong> Check out our GitHub repository to
            see how everything works
          </li>
          <li>
            <strong>Self-Host (Optional):</strong> For maximum control, deploy
            OpenAthlete on your own infrastructure
          </li>
          <li>
            <strong>Contribute:</strong> Help improve OpenAthlete by reporting
            bugs, suggesting features, or contributing code
          </li>
        </ol>

        <p>
          <strong>Your data, your control, and code you can read.</strong>
        </p>

        <p>
          <a href="https://app.openathlete.org/auth/create-account">
            Get Started with OpenAthlete →
          </a>
        </p>

        <h2>Frequently Asked Questions</h2>

        <h3>Is open source software less secure?</h3>
        <p>
          No. In fact, open source software is often more secure because more
          people can review the code and find vulnerabilities. The "many eyes"
          principle means security issues are found and fixed faster than in
          proprietary software.
        </p>

        <h3>Can I really self-host OpenAthlete?</h3>
        <p>
          Yes! OpenAthlete is designed to be self-hostable. You can deploy it on
          your own server, use your own database, and have complete control over
          your data. Documentation is available for self-hosting.
        </p>

        <h3>What if I'm not technical? Do I need to understand code?</h3>
        <p>
          Not at all! You can use OpenAthlete's cloud version just like any
          other training platform. The open source nature means you have the
          option to self-host or review code if you want, but it's not required.
        </p>

        <h3>How does open source help with innovation?</h3>
        <p>
          Open source allows anyone to contribute improvements. Athletes,
          coaches, and developers can suggest features, report bugs, and even
          contribute code. This means the software improves based on real user
          needs, not just what a company thinks will sell.
        </p>

        <h3>What license does OpenAthlete use?</h3>
        <p>
          OpenAthlete uses the AGPLv3 license, which ensures the software
          remains open source and free. This means you can use, modify, and
          distribute OpenAthlete, as long as you follow the license terms.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
        <p>
          <strong>
            Vos données d'entraînement sont personnelles. Vos métriques de santé
            sont sensibles. Vos informations de performance sont privées.
          </strong>
        </p>

        <p>
          Pourtant, la plupart des plateformes d'entraînement sont des "boîtes
          noires"—vous n'avez aucune idée de la façon dont vos données sont
          traitées, stockées ou utilisées. Vous faites confiance à une
          entreprise avec vos informations les plus sensibles, en espérant
          qu'elle les protégera.
        </p>

        <p>
          <strong>OpenAthlete est différent.</strong> En tant que plateforme
          open source, tout est transparent. Vous pouvez voir exactement comment
          vos données sont gérées, vérifier nos pratiques de sécurité et même
          exécuter le logiciel sur votre propre infrastructure si vous voulez un
          contrôle complet.
        </p>

        <h2>Que Signifie Vraiment "Open Source" ?</h2>

        <p>
          Open source signifie que le code source d'OpenAthlete est publiquement
          disponible et peut être consulté, audité, modifié et distribué par
          n'importe qui. C'est fondamentalement différent des logiciels
          propriétaires comme TrainingPeaks, TrainerRoad ou Strava, où le code
          est secret et contrôlé par une seule entreprise.
        </p>

        <p>Pour OpenAthlete, cela signifie :</p>
        <ul>
          <li>
            <strong>Transparence Totale :</strong> N'importe qui peut examiner
            le code pour voir exactement comment les données sont traitées
          </li>
          <li>
            <strong>Audit Communautaire :</strong> Les chercheurs en sécurité et
            les développeurs peuvent identifier et corriger les vulnérabilités
          </li>
          <li>
            <strong>Pas de Verrouillage Fournisseur :</strong> Vous n'êtes
            jamais piégé—vous pouvez toujours auto-héberger ou migrer
          </li>
          <li>
            <strong>Amélioration Continue :</strong> La communauté contribue aux
            fonctionnalités, corrections et améliorations
          </li>
          <li>
            <strong>Contrôle Complet :</strong> Vous pouvez modifier le logiciel
            pour répondre à vos besoins spécifiques
          </li>
        </ul>

        <h2>
          1. Confidentialité et Protection des Données : Vos Données, Votre
          Contrôle
        </h2>

        <h3>Le Problème avec les Plateformes Propriétaires</h3>
        <p>
          Lorsque vous utilisez un logiciel d'entraînement propriétaire, vous
          dites essentiellement : "Je fais confiance à cette entreprise avec mes
          données de santé sensibles, et j'espère qu'elle les protégera." Vous
          n'avez aucun moyen de vérifier :
        </p>
        <ul>
          <li>Comment vos données sont stockées et chiffrées</li>
          <li>Qui a accès à vos données</li>
          <li>Si vos données sont vendues à des tiers</li>
          <li>Si l'entreprise suit les meilleures pratiques de sécurité</li>
          <li>
            Ce qui arrive à vos données si l'entreprise est acquise ou ferme
          </li>
        </ul>

        <h3>Comment l'Open Source Protège Votre Confidentialité</h3>
        <p>Avec OpenAthlete, vous pouvez tout vérifier :</p>
        <ul>
          <li>
            <strong>Traitement Transparent des Données :</strong> Examinez le
            code pour voir exactement comment vos données d'entraînement sont
            traitées, stockées et analysées
          </li>
          <li>
            <strong>Pas de Suivi Caché :</strong> sur le Cloud, la mesure
            d'audience ne fonctionne que si vous l'acceptez ; une instance
            auto-hébergée n'envoie rien à OpenAthlete, et un test automatisé le
            vérifie
          </li>
          <li>
            <strong>Conformité RGPD :</strong> L'open source facilite la
            vérification de la conformité RGPD et des pratiques de protection
            des données
          </li>
          <li>
            <strong>Option d'Auto-Hébergement :</strong> Pour une
            confidentialité maximale, vous pouvez exécuter OpenAthlete sur votre
            propre serveur avec une souveraineté de données complète
          </li>
          <li>
            <strong>Pas de Vente de Données :</strong> Comme le code est ouvert,
            vous pouvez vérifier que nous ne vendons pas vos données à des tiers
          </li>
        </ul>

        <blockquote>
          <p>
            "Avec les logiciels propriétaires, vous faites confiance à une
            entreprise. Avec l'open source, vous faites confiance au code—et
            vous pouvez le vérifier vous-même."
          </p>
        </blockquote>

        <h3>Avantages Réels de Confidentialité</h3>
        <p>
          <strong>Exemple 1 : Souveraineté des Données</strong>
        </p>
        <p>
          Si vous êtes un athlète professionnel ou un coach travaillant avec des
          données d'entraînement sensibles, vous pourriez avoir besoin de vous
          assurer que vos données restent dans des juridictions spécifiques.
          Avec OpenAthlete, vous pouvez auto-héberger sur des serveurs dans
          votre pays ou région, garantissant une souveraineté de données
          complète.
        </p>

        <p>
          <strong>Exemple 2 : Exigences de Conformité</strong>
        </p>
        <p>
          Les organisations comme les fédérations sportives ou les clubs peuvent
          avoir des exigences strictes de protection des données. L'open source
          leur permet d'auditer le code, de vérifier les pratiques de sécurité
          et d'assurer la conformité avec des réglementations comme le RGPD,
          HIPAA ou les lois locales de protection des données.
        </p>

        <h2>2. Sécurité : Plusieurs Yeux Rendent les Bugs Superficiels</h2>

        <h3>L'Avantage de la "Loi de Linus"</h3>
        <p>
          Linus Torvalds, créateur de Linux, a dit : "Avec suffisamment d'yeux,
          tous les bugs sont superficiels." Cela signifie qu'avec les logiciels
          open source, plus de personnes peuvent examiner le code, trouver des
          vulnérabilités et les corriger rapidement.
        </p>

        <p>
          <strong>Comment Cela Fonctionne pour OpenAthlete :</strong>
        </p>
        <ul>
          <li>
            <strong>Audits de Sécurité Communautaires :</strong> Les chercheurs
            en sécurité peuvent examiner le code et signaler les vulnérabilités
          </li>
          <li>
            <strong>Corrections de Bugs Plus Rapides :</strong> Lorsque des
            problèmes sont trouvés, la communauté peut contribuer aux
            corrections immédiatement
          </li>
          <li>
            <strong>Pas de Vulnérabilités Cachées :</strong> Contrairement aux
            logiciels propriétaires, les problèmes de sécurité ne peuvent pas
            être cachés—ils sont visibles pour tous
          </li>
          <li>
            <strong>Vérification Indépendante :</strong> Vous n'avez pas à faire
            confiance à notre parole—vous pouvez vérifier les pratiques de
            sécurité vous-même
          </li>
        </ul>

        <h3>Comparaison de Sécurité : Open Source vs. Propriétaire</h3>
        <table>
          <thead>
            <tr>
              <th>Aspect</th>
              <th>Logiciel Propriétaire</th>
              <th>Open Source (OpenAthlete)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Visibilité du Code</td>
              <td>❌ Caché</td>
              <td>✅ Public</td>
            </tr>
            <tr>
              <td>Audits de Sécurité</td>
              <td>❌ Internes uniquement</td>
              <td>✅ Communautaires</td>
            </tr>
            <tr>
              <td>Divulgation de Vulnérabilités</td>
              <td>❌ Peut être cachée</td>
              <td>✅ Transparente</td>
            </tr>
            <tr>
              <td>Vérification Indépendante</td>
              <td>❌ Impossible</td>
              <td>✅ N'importe qui peut vérifier</td>
            </tr>
            <tr>
              <td>Vitesse de Correction de Bugs</td>
              <td>❌ Dépend du fournisseur</td>
              <td>✅ La communauté peut corriger</td>
            </tr>
          </tbody>
        </table>

        <h2>3. Innovation : Développement Communautaire</h2>

        <h3>Pourquoi l'Open Source Stimule l'Innovation</h3>
        <p>
          Les entreprises de logiciels propriétaires ont des ressources limitées
          et doivent prioriser les fonctionnalités qui profitent au plus grand
          nombre d'utilisateurs. Cela signifie souvent :
        </p>
        <ul>
          <li>Développement de fonctionnalités lent</li>
          <li>
            Fonctionnalités qui profitent à l'entreprise, pas nécessairement aux
            utilisateurs
          </li>
          <li>Options de personnalisation limitées</li>
          <li>Innovation limitée aux idées de l'équipe interne</li>
        </ul>

        <p>
          <strong>L'open source change cela complètement :</strong>
        </p>
        <ul>
          <li>
            <strong>Contributions Communautaires :</strong> Les athlètes, coachs
            et développeurs peuvent contribuer aux fonctionnalités dont ils ont
            réellement besoin
          </li>
          <li>
            <strong>Développement Plus Rapide :</strong> Plus de développeurs
            signifie un développement de fonctionnalités et des corrections de
            bugs plus rapides
          </li>
          <li>
            <strong>Perspectives Diverses :</strong> Différents utilisateurs
            apportent différents besoins et idées, menant à des solutions plus
            innovantes
          </li>
          <li>
            <strong>Pas d'Agenda Corporatif :</strong> Les fonctionnalités sont
            motivées par les besoins des utilisateurs, pas par les marges
            bénéficiaires
          </li>
          <li>
            <strong>Personnalisation :</strong> Les utilisateurs peuvent
            modifier le logiciel pour s'adapter à leurs workflows spécifiques
          </li>
        </ul>

        <h3>Exemples Réels d'Innovation Open Source</h3>
        <p>
          <strong>Linux :</strong> Alimente la plupart d'Internet, les
          téléphones Android et les supercalculateurs—tout grâce à l'innovation
          open source.
        </p>
        <p>
          <strong>WordPress :</strong> Alimente 40% de tous les sites web car la
          communauté l'améliore et l'étend continuellement.
        </p>
        <p>
          <strong>Git :</strong> Le système de contrôle de version utilisé par
          pratiquement toutes les entreprises de logiciels, créé en open source.
        </p>

        <p>
          <strong>OpenAthlete :</strong> Bénéficie déjà des contributions
          communautaires—les athlètes et coachs suggèrent des fonctionnalités,
          signalent des bugs et contribuent même aux améliorations du code.
        </p>

        <h2>4. Pas de Verrouillage Fournisseur : Vous N'Êtes Jamais Piégé</h2>

        <h3>Le Problème avec les Plateformes Propriétaires</h3>
        <p>
          Lorsque vous utilisez un logiciel propriétaire, vous êtes verrouillé :
        </p>
        <ul>
          <li>
            <strong>Limitations d'Export de Données :</strong> Vous ne pouvez
            pas facilement exporter vos données dans un format utilisable
          </li>
          <li>
            <strong>Augmentations de Prix :</strong> Les entreprises peuvent
            augmenter les prix sachant que vous dépendez de leur plateforme
          </li>
          <li>
            <strong>Suppression de Fonctionnalités :</strong> Les
            fonctionnalités dont vous dépendez peuvent être supprimées sans
            votre contribution
          </li>
          <li>
            <strong>Arrêts de Service :</strong> Si l'entreprise ferme, vous
            perdez l'accès à vos données et à la plateforme
          </li>
          <li>
            <strong>Risques d'Acquisition :</strong> Si l'entreprise est
            acquise, le nouveau propriétaire peut tout changer
          </li>
        </ul>

        <h3>Comment l'Open Source Prévi ent le Verrouillage</h3>
        <p>Avec OpenAthlete, vous n'êtes jamais piégé :</p>
        <ul>
          <li>
            <strong>Option d'Auto-Hébergement :</strong> Vous pouvez exécuter
            OpenAthlete sur votre propre infrastructure, indépendamment de notre
            service cloud
          </li>
          <li>
            <strong>Portabilité des Données :</strong> exportez toutes vos
            données dans un fichier JSON à tout moment, et vos activités restent
            sur le compte de votre montre
          </li>
          <li>
            <strong>Capacité de Fork :</strong> Si vous n'aimez pas notre
            direction, vous pouvez forker le projet et continuer le
            développement indépendamment
          </li>
          <li>
            <strong>Pas de Dépendance d'Abonnement :</strong> Même si nous
            arrêtons d'offrir l'hébergement cloud, vous pouvez continuer à
            utiliser le logiciel
          </li>
          <li>
            <strong>Continuité Communautaire :</strong> La communauté peut
            continuer le développement même si les créateurs originaux passent à
            autre chose
          </li>
        </ul>

        <h2>5. Économies de Coûts : Logiciel Libre, Pas "Gratuit"</h2>

        <p>
          L'open source ne signifie pas seulement "gratuit comme une bière
          gratuite"—il signifie "libre comme la liberté." Mais les économies de
          coûts sont réelles :
        </p>
        <ul>
          <li>
            <strong>Pas de Frais de Licence :</strong> Utilisez OpenAthlete sans
            payer de frais de licence
          </li>
          <li>
            <strong>Pas de Coûts par Utilisateur :</strong> en auto-hébergement,
            ajoutez autant d'athlètes et de coachs que vous voulez ; sur le
            Cloud, le coaching est gratuit jusqu'à 5 athlètes et illimité avec
            Supporter (5 €/mois ou 50 €/an)
          </li>
          <li>
            <strong>Économies d'Auto-Hébergement :</strong> Pour les
            organisations, l'auto-hébergement peut économiser des milliers
            comparé aux solutions propriétaires
          </li>
          <li>
            <strong>Pas de Majoration Fournisseur :</strong> Vous ne payez pas
            pour les frais généraux de licence propriétaire
          </li>
        </ul>

        <h2>6. Transparence et Confiance</h2>

        <p>
          <strong>
            Avec les logiciels propriétaires, vous devez faire confiance :
          </strong>
        </p>
        <ul>
          <li>Que l'entreprise dit la vérité sur la sécurité</li>
          <li>Qu'elle ne vend pas vos données</li>
          <li>Qu'elle suit les meilleures pratiques</li>
          <li>Qu'elle continuera à supporter le logiciel</li>
        </ul>

        <p>
          <strong>Avec l'open source, vous pouvez vérifier :</strong>
        </p>
        <ul>
          <li>
            Examiner le code vous-même ou engager quelqu'un pour l'auditer
          </li>
          <li>Voir exactement comment les données sont traitées</li>
          <li>Vérifier les pratiques de sécurité</li>
          <li>Savoir que la communauté peut continuer le développement</li>
        </ul>

        <blockquote>
          <p>
            "Faites confiance, mais vérifiez. Avec l'open source, vous pouvez
            faire les deux."
          </p>
        </blockquote>

        <h2>7. Personnalisation et Flexibilité</h2>

        <p>
          Chaque athlète et coach a des besoins uniques. Les logiciels
          propriétaires vous forcent à vous adapter aux limitations du logiciel.
          L'open source vous permet d'adapter le logiciel à vos besoins.
        </p>

        <p>
          <strong>Avec OpenAthlete, vous pouvez :</strong>
        </p>
        <ul>
          <li>
            <strong>Modifier les Fonctionnalités :</strong> Changez le
            fonctionnement des fonctionnalités pour s'adapter à votre workflow
          </li>
          <li>
            <strong>Ajouter des Intégrations :</strong> Créez des intégrations
            personnalisées avec les outils que vous utilisez déjà
          </li>
          <li>
            <strong>Créer des Rapports Personnalisés :</strong> Générez des
            rapports adaptés à vos besoins spécifiques
          </li>
          <li>
            <strong>Adapter l'Interface :</strong> Personnalisez l'interface
            pour votre équipe ou organisation
          </li>
          <li>
            <strong>Construire des Workflows :</strong> Créez des workflows
            automatisés qui s'adaptent à vos processus
          </li>
        </ul>

        <h2>Impact Réel : Pourquoi Cela Compte pour les Athlètes et Coachs</h2>

        <h3>Pour les Athlètes Individuels</h3>
        <ul>
          <li>
            <strong>Confidentialité :</strong> Sachez exactement comment vos
            données de santé sensibles sont gérées
          </li>
          <li>
            <strong>Contrôle :</strong> Auto-hébergez si vous voulez une
            souveraineté de données complète
          </li>
          <li>
            <strong>Coût :</strong> Utilisez un logiciel d'entraînement avancé
            sans payer de frais d'abonnement élevés
          </li>
          <li>
            <strong>Innovation :</strong> Bénéficiez d'améliorations et de
            fonctionnalités communautaires
          </li>
        </ul>

        <h3>Pour les Coachs</h3>
        <ul>
          <li>
            <strong>Protection des Données Clients :</strong> Assurez-vous que
            les données de vos athlètes sont gérées de manière sécurisée et
            transparente
          </li>
          <li>
            <strong>Conformité :</strong> Vérifiez la conformité RGPD et la
            protection des données pour vos clients
          </li>
          <li>
            <strong>Personnalisation :</strong> Adaptez la plateforme à votre
            méthodologie de coaching
          </li>
          <li>
            <strong>Efficacité des Coûts :</strong> Économisez de l'argent sur
            les licences logicielles pour investir dans vos athlètes
          </li>
        </ul>

        <h3>Pour les Clubs et Organisations</h3>
        <ul>
          <li>
            <strong>Souveraineté des Données :</strong> Auto-hébergez pour
            garder toutes les données dans votre infrastructure
          </li>
          <li>
            <strong>Évolutivité :</strong> sur votre propre instance, ajoutez
            des membres illimités sans coûts de licence par utilisateur
          </li>
          <li>
            <strong>Conformité :</strong> Répondez aux exigences strictes de
            protection des données avec un code auditable
          </li>
          <li>
            <strong>Personnalisation :</strong> Adaptez la plateforme aux
            besoins de votre organisation
          </li>
        </ul>

        <h2>L'Avenir de la Technologie Sportive est Ouvert</h2>

        <p>
          L'avenir du logiciel est open source. Les grandes entreprises comme
          Microsoft, Google et Amazon adoptent l'open source. Les avantages sont
          clairs : meilleure sécurité, innovation plus rapide, plus de
          transparence et contrôle utilisateur.
        </p>

        <p>
          <strong>
            OpenAthlete veut apporter cela à la technologie sportive.
          </strong>{' '}
          Nous croyons que les athlètes et les coachs méritent :
        </p>
        <ul>
          <li>Transparence dans le traitement de leurs données</li>
          <li>Contrôle sur leurs informations d'entraînement</li>
          <li>
            Innovation motivée par les besoins des utilisateurs, pas le profit
          </li>
          <li>Liberté du verrouillage fournisseur</li>
          <li>
            Logiciel qui s'améliore grâce à la collaboration communautaire
          </li>
        </ul>

        <h2>Commencez avec le Logiciel d'Entraînement Open Source</h2>

        <p>
          Prêt à découvrir les avantages de l'open source ? OpenAthlete est
          gratuit, open source et prêt à l'emploi :
        </p>

        <ol>
          <li>
            <strong>Essayez la Version Cloud :</strong> Inscrivez-vous
            gratuitement sur{' '}
            <a href="https://app.openathlete.org/auth/create-account">
              app.openathlete.org
            </a>{' '}
            et découvrez le logiciel d'entraînement open source
          </li>
          <li>
            <strong>Examinez le Code :</strong> Consultez notre dépôt GitHub
            pour voir comment tout fonctionne
          </li>
          <li>
            <strong>Auto-Hébergez (Optionnel) :</strong> Pour un contrôle
            maximal, déployez OpenAthlete sur votre propre infrastructure
          </li>
          <li>
            <strong>Contribuez :</strong> Aidez à améliorer OpenAthlete en
            signalant des bugs, suggérant des fonctionnalités ou contribuant au
            code
          </li>
        </ol>

        <p>
          <strong>
            Vos données, votre contrôle, et un code que vous pouvez lire.
          </strong>
        </p>

        <p>
          <a href="https://app.openathlete.org/auth/create-account">
            Commencez avec OpenAthlete →
          </a>
        </p>

        <h2>Questions Fréquemment Posées</h2>

        <h3>Les logiciels open source sont-ils moins sécurisés ?</h3>
        <p>
          Non. En fait, les logiciels open source sont souvent plus sécurisés
          car plus de personnes peuvent examiner le code et trouver des
          vulnérabilités. Le principe des "nombreux yeux" signifie que les
          problèmes de sécurité sont trouvés et corrigés plus rapidement que
          dans les logiciels propriétaires.
        </p>

        <h3>Puis-je vraiment auto-héberger OpenAthlete ?</h3>
        <p>
          Oui ! OpenAthlete est conçu pour être auto-hébergeable. Vous pouvez le
          déployer sur votre propre serveur, utiliser votre propre base de
          données et avoir un contrôle complet sur vos données. La documentation
          est disponible pour l'auto-hébergement.
        </p>

        <h3>Et si je ne suis pas technique ? Dois-je comprendre le code ?</h3>
        <p>
          Pas du tout ! Vous pouvez utiliser la version cloud d'OpenAthlete
          comme n'importe quelle autre plateforme d'entraînement. La nature open
          source signifie que vous avez l'option d'auto-héberger ou d'examiner
          le code si vous le souhaitez, mais ce n'est pas requis.
        </p>

        <h3>Comment l'open source aide-t-il à l'innovation ?</h3>
        <p>
          L'open source permet à n'importe qui de contribuer aux améliorations.
          Les athlètes, coachs et développeurs peuvent suggérer des
          fonctionnalités, signaler des bugs et même contribuer au code. Cela
          signifie que le logiciel s'améliore en fonction des besoins réels des
          utilisateurs, pas seulement de ce qu'une entreprise pense qui se
          vendra.
        </p>

        <h3>Quelle licence OpenAthlete utilise-t-il ?</h3>
        <p>
          OpenAthlete utilise la licence AGPLv3, qui garantit que le logiciel
          reste open source et libre. Cela signifie que vous pouvez utiliser,
          modifier et distribuer OpenAthlete, tant que vous suivez les termes de
          la licence.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Tus datos de entrenamiento son personales. Tus métricas de salud son
            sensibles. Tu información de rendimiento es privada.
          </strong>
        </p>

        <p>
          Sin embargo, la mayoría de las plataformas de entrenamiento son «cajas
          negras»: no tienes ni idea de cómo se procesan, almacenan o utilizan
          tus datos. Confías tu información más sensible a una empresa con la
          esperanza de que la proteja.
        </p>

        <p>
          <strong>OpenAthlete es diferente.</strong> Al ser una plataforma de
          código abierto, todo es transparente. Puedes ver exactamente cómo se
          tratan tus datos, comprobar nuestras prácticas de seguridad e incluso
          ejecutar el software en tu propia infraestructura si quieres tener el
          control total.
        </p>

        <h2>¿Qué significa realmente «código abierto»?</h2>

        <p>
          Código abierto significa que el código fuente de OpenAthlete es
          público y que cualquiera puede consultarlo, auditarlo, modificarlo y
          distribuirlo. Es algo radicalmente distinto del software propietario
          como TrainingPeaks, TrainerRoad o Strava, donde el código es secreto y
          lo controla una sola empresa.
        </p>

        <p>En el caso de OpenAthlete, esto significa:</p>
        <ul>
          <li>
            <strong>Transparencia total:</strong> cualquiera puede revisar el
            código para ver exactamente cómo se procesan los datos
          </li>
          <li>
            <strong>Auditoría de la comunidad:</strong> investigadores de
            seguridad y desarrolladores pueden detectar y corregir
            vulnerabilidades
          </li>
          <li>
            <strong>Sin dependencia del proveedor:</strong> nunca te quedas
            atrapado; siempre puedes autoalojarlo o migrar
          </li>
          <li>
            <strong>Mejora continua:</strong> la comunidad aporta nuevas
            funciones, correcciones y mejoras
          </li>
          <li>
            <strong>Control total:</strong> puedes modificar el software para
            adaptarlo a tus necesidades concretas
          </li>
        </ul>

        <h2>1. Privacidad y protección de datos: tus datos, bajo tu control</h2>

        <h3>El problema de las plataformas propietarias</h3>
        <p>
          Cuando usas un software de entrenamiento propietario, en el fondo
          estás diciendo: «Confío mis datos de salud sensibles a esta empresa y
          espero que los proteja». No tienes forma de comprobar:
        </p>
        <ul>
          <li>Cómo se almacenan y cifran tus datos</li>
          <li>Quién tiene acceso a tus datos</li>
          <li>Si tus datos se venden a terceros</li>
          <li>Si la empresa sigue las buenas prácticas de seguridad</li>
          <li>Qué pasa con tus datos si la empresa es adquirida o cierra</li>
        </ul>

        <h3>Cómo protege tu privacidad el código abierto</h3>
        <p>Con OpenAthlete, puedes comprobarlo todo:</p>
        <ul>
          <li>
            <strong>Tratamiento de datos transparente:</strong> revisa el código
            para ver exactamente cómo se procesan, almacenan y analizan tus
            datos de entrenamiento
          </li>
          <li>
            <strong>Sin seguimiento oculto:</strong> en la nube, la analítica
            solo funciona si la aceptas; una instancia autoalojada no envía nada
            a OpenAthlete, y una prueba automática lo comprueba
          </li>
          <li>
            <strong>Cumplimiento del RGPD:</strong> el código abierto facilita
            verificar el cumplimiento del RGPD y las prácticas de protección de
            datos
          </li>
          <li>
            <strong>Opción de autoalojamiento:</strong> para una privacidad
            máxima, puedes ejecutar OpenAthlete en tu propio servidor con
            soberanía total sobre tus datos
          </li>
          <li>
            <strong>Sin venta de datos:</strong> como el código es abierto,
            puedes comprobar que no vendemos tus datos a terceros
          </li>
        </ul>

        <blockquote>
          <p>
            «Con el software propietario, confías en una empresa. Con el código
            abierto, confías en el código, y puedes comprobarlo tú mismo».
          </p>
        </blockquote>

        <h3>Ventajas reales para tu privacidad</h3>
        <p>
          <strong>Ejemplo 1: soberanía de los datos</strong>
        </p>
        <p>
          Si eres atleta profesional o entrenador y trabajas con datos de
          entrenamiento sensibles, puede que necesites garantizar que tus datos
          se queden en una jurisdicción concreta. Con OpenAthlete, puedes
          autoalojarlo en servidores de tu país o región y asegurarte la
          soberanía total sobre tus datos.
        </p>

        <p>
          <strong>Ejemplo 2: requisitos de cumplimiento normativo</strong>
        </p>
        <p>
          Organizaciones como federaciones deportivas o clubes pueden tener
          requisitos estrictos de protección de datos. El código abierto les
          permite auditar el código, comprobar las prácticas de seguridad y
          garantizar el cumplimiento de normativas como el RGPD, la HIPAA o las
          leyes locales de protección de datos.
        </p>

        <h2>2. Seguridad: con muchos ojos, los errores salen a la luz</h2>

        <h3>La ventaja de la «ley de Linus»</h3>
        <p>
          Linus Torvalds, creador de Linux, dijo una frase célebre: «Con
          suficientes ojos, todos los errores son superficiales». Es decir, en
          el software de código abierto hay más personas que pueden revisar el
          código, encontrar vulnerabilidades y corregirlas rápidamente.
        </p>

        <p>
          <strong>Cómo funciona esto en OpenAthlete:</strong>
        </p>
        <ul>
          <li>
            <strong>Auditorías de seguridad de la comunidad:</strong> los
            investigadores de seguridad pueden revisar el código y comunicar
            vulnerabilidades
          </li>
          <li>
            <strong>Correcciones más rápidas:</strong> cuando se detecta un
            problema, la comunidad puede aportar la solución de inmediato
          </li>
          <li>
            <strong>Sin vulnerabilidades ocultas:</strong> a diferencia del
            software propietario, los fallos de seguridad no se pueden esconder;
            están a la vista de todos
          </li>
          <li>
            <strong>Verificación independiente:</strong> no tienes que fiarte de
            nuestra palabra; puedes comprobar tú mismo las prácticas de
            seguridad
          </li>
        </ul>

        <h3>Comparativa de seguridad: código abierto frente a propietario</h3>
        <table>
          <thead>
            <tr>
              <th>Aspecto</th>
              <th>Software propietario</th>
              <th>Código abierto (OpenAthlete)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Visibilidad del código</td>
              <td>❌ Oculto</td>
              <td>✅ Público</td>
            </tr>
            <tr>
              <td>Auditorías de seguridad</td>
              <td>❌ Solo internas</td>
              <td>✅ Abiertas a toda la comunidad</td>
            </tr>
            <tr>
              <td>Divulgación de vulnerabilidades</td>
              <td>❌ Pueden ocultarse</td>
              <td>✅ Transparente</td>
            </tr>
            <tr>
              <td>Verificación independiente</td>
              <td>❌ No es posible</td>
              <td>✅ Cualquiera puede verificar</td>
            </tr>
            <tr>
              <td>Rapidez de corrección de errores</td>
              <td>❌ Depende del proveedor</td>
              <td>✅ La comunidad puede corregir</td>
            </tr>
          </tbody>
        </table>

        <h2>3. Innovación: un desarrollo impulsado por la comunidad</h2>

        <h3>Por qué el código abierto impulsa la innovación</h3>
        <p>
          Las empresas de software propietario tienen recursos limitados y deben
          priorizar las funciones que benefician a más usuarios. Esto suele
          implicar:
        </p>
        <ul>
          <li>Un desarrollo lento de nuevas funciones</li>
          <li>
            Funciones que benefician a la empresa, no necesariamente a los
            usuarios
          </li>
          <li>Pocas opciones de personalización</li>
          <li>Una innovación limitada a las ideas del equipo interno</li>
        </ul>

        <p>
          <strong>El código abierto lo cambia todo:</strong>
        </p>
        <ul>
          <li>
            <strong>Contribuciones de la comunidad:</strong> atletas,
            entrenadores y desarrolladores pueden aportar las funciones que de
            verdad necesitan
          </li>
          <li>
            <strong>Desarrollo más rápido:</strong> más desarrolladores
            significa nuevas funciones y correcciones más rápidas
          </li>
          <li>
            <strong>Perspectivas diversas:</strong> cada usuario aporta sus
            propias necesidades e ideas, lo que da lugar a soluciones más
            innovadoras
          </li>
          <li>
            <strong>Sin intereses corporativos:</strong> las funciones responden
            a las necesidades de los usuarios, no a los márgenes de beneficio
          </li>
          <li>
            <strong>Personalización:</strong> los usuarios pueden modificar el
            software para adaptarlo a su forma de trabajar
          </li>
        </ul>

        <h3>Ejemplos reales de innovación en código abierto</h3>
        <p>
          <strong>Linux:</strong> hace funcionar la mayor parte de internet, los
          móviles Android y los superordenadores, todo gracias a la innovación
          del código abierto.
        </p>
        <p>
          <strong>WordPress:</strong> está detrás del 40 % de todos los sitios
          web porque la comunidad no deja de mejorarlo y ampliarlo.
        </p>
        <p>
          <strong>Git:</strong> el sistema de control de versiones que usa
          prácticamente cualquier empresa de software, creado como código
          abierto.
        </p>

        <p>
          <strong>OpenAthlete:</strong> ya se beneficia de las contribuciones de
          la comunidad: atletas y entrenadores proponen funciones, informan de
          errores e incluso aportan mejoras al código.
        </p>

        <h2>4. Sin dependencia del proveedor: nunca te quedas atrapado</h2>

        <h3>El problema de las plataformas propietarias</h3>
        <p>Cuando usas software propietario, quedas atado a él:</p>
        <ul>
          <li>
            <strong>Exportación de datos limitada:</strong> no puedes exportar
            fácilmente tus datos en un formato que te sirva
          </li>
          <li>
            <strong>Subidas de precio:</strong> las empresas pueden subir los
            precios sabiendo que dependes de su plataforma
          </li>
          <li>
            <strong>Funciones eliminadas:</strong> pueden quitar funciones de
            las que dependes sin contar contigo
          </li>
          <li>
            <strong>Cierre del servicio:</strong> si la empresa cierra, pierdes
            el acceso a tus datos y a la plataforma
          </li>
          <li>
            <strong>Riesgos de adquisición:</strong> si la empresa es adquirida,
            el nuevo propietario puede cambiarlo todo
          </li>
        </ul>

        <h3>Cómo evita el código abierto esa dependencia</h3>
        <p>Con OpenAthlete, nunca te quedas atrapado:</p>
        <ul>
          <li>
            <strong>Opción de autoalojamiento:</strong> puedes ejecutar
            OpenAthlete en tu propia infraestructura, sin depender de nuestro
            servicio en la nube
          </li>
          <li>
            <strong>Portabilidad de los datos:</strong> exporta todos tus datos
            en un archivo JSON cuando quieras, y tus actividades siguen en la
            cuenta de tu reloj
          </li>
          <li>
            <strong>Posibilidad de bifurcar:</strong> si no te gusta el rumbo
            que tomamos, puedes hacer un fork del proyecto y seguir
            desarrollándolo por tu cuenta
          </li>
          <li>
            <strong>Sin depender de una suscripción:</strong> aunque dejáramos
            de ofrecer el alojamiento en la nube, podrías seguir usando el
            software
          </li>
          <li>
            <strong>Continuidad gracias a la comunidad:</strong> la comunidad
            puede seguir con el desarrollo aunque sus creadores originales pasen
            a otra cosa
          </li>
        </ul>

        <h2>5. Ahorro: software libre, no software «gratis»</h2>

        <p>
          Código abierto no solo significa «gratis como una cerveza gratis»:
          significa «libre como en libertad». Pero el ahorro es real:
        </p>
        <ul>
          <li>
            <strong>Sin costes de licencia:</strong> usa OpenAthlete sin pagar
            licencias
          </li>
          <li>
            <strong>Sin costes por usuario:</strong> autoalojado, añade tantos
            atletas y entrenadores como quieras; en la nube, el coaching es
            gratis hasta 5 atletas e ilimitado con Supporter (5 €/mes o 50
            €/año)
          </li>
          <li>
            <strong>Ahorro con el autoalojamiento:</strong> para las
            organizaciones, autoalojar puede suponer un ahorro de miles frente a
            las soluciones propietarias
          </li>
          <li>
            <strong>Sin sobrecoste del proveedor:</strong> no pagas los gastos
            añadidos de una licencia propietaria
          </li>
        </ul>

        <h2>6. Transparencia y confianza</h2>

        <p>
          <strong>
            Con el software propietario, tienes que confiar en que:
          </strong>
        </p>
        <ul>
          <li>La empresa dice la verdad sobre la seguridad</li>
          <li>No vende tus datos</li>
          <li>Sigue las buenas prácticas</li>
          <li>Seguirá dando soporte al software</li>
        </ul>

        <p>
          <strong>Con el código abierto, puedes comprobarlo:</strong>
        </p>
        <ul>
          <li>Revisa tú mismo el código o contrata a alguien para auditarlo</li>
          <li>Mira exactamente cómo se procesan los datos</li>
          <li>Comprueba las prácticas de seguridad</li>
          <li>
            Ten la certeza de que la comunidad puede seguir con el desarrollo
          </li>
        </ul>

        <blockquote>
          <p>
            «Confía, pero verifica. Con el código abierto, puedes hacer ambas
            cosas».
          </p>
        </blockquote>

        <h2>7. Personalización y flexibilidad</h2>

        <p>
          Cada atleta y cada entrenador tiene necesidades únicas. El software
          propietario te obliga a adaptarte a sus limitaciones. El código
          abierto te permite adaptar el software a tus necesidades.
        </p>

        <p>
          <strong>Con OpenAthlete, puedes:</strong>
        </p>
        <ul>
          <li>
            <strong>Modificar funciones:</strong> cambia cómo funcionan para
            adaptarlas a tu forma de trabajar
          </li>
          <li>
            <strong>Añadir integraciones:</strong> crea integraciones a medida
            con las herramientas que ya usas
          </li>
          <li>
            <strong>Crear informes personalizados:</strong> genera informes
            adaptados a tus necesidades concretas
          </li>
          <li>
            <strong>Adaptar la interfaz:</strong> personaliza la interfaz para
            tu equipo u organización
          </li>
          <li>
            <strong>Crear flujos de trabajo:</strong> monta flujos automatizados
            que encajen con tus procesos
          </li>
        </ul>

        <h2>Impacto real: por qué es importante para atletas y entrenadores</h2>

        <h3>Para los atletas</h3>
        <ul>
          <li>
            <strong>Privacidad:</strong> sabes exactamente cómo se tratan tus
            datos de salud sensibles
          </li>
          <li>
            <strong>Control:</strong> autoalójalo si quieres soberanía total
            sobre tus datos
          </li>
          <li>
            <strong>Coste:</strong> usa un software de entrenamiento avanzado
            sin pagar suscripciones caras
          </li>
          <li>
            <strong>Innovación:</strong> aprovecha las mejoras y funciones que
            impulsa la comunidad
          </li>
        </ul>

        <h3>Para los entrenadores</h3>
        <ul>
          <li>
            <strong>Protección de los datos de tus clientes:</strong> asegúrate
            de que los datos de tus atletas se tratan de forma segura y
            transparente
          </li>
          <li>
            <strong>Cumplimiento normativo:</strong> comprueba el cumplimiento
            del RGPD y de la protección de datos para tus clientes
          </li>
          <li>
            <strong>Personalización:</strong> adapta la plataforma a tu
            metodología de entrenamiento
          </li>
          <li>
            <strong>Eficiencia de costes:</strong> ahorra en licencias de
            software para invertir en tus atletas
          </li>
        </ul>

        <h3>Para clubes y organizaciones</h3>
        <ul>
          <li>
            <strong>Soberanía de los datos:</strong> autoalójalo para mantener
            todos los datos dentro de tu infraestructura
          </li>
          <li>
            <strong>Escalabilidad:</strong> en tu propia instancia, añade
            miembros sin límite y sin costes de licencia por usuario
          </li>
          <li>
            <strong>Cumplimiento normativo:</strong> cumple requisitos estrictos
            de protección de datos con un código auditable
          </li>
          <li>
            <strong>Personalización:</strong> adapta la plataforma a las
            necesidades de tu organización
          </li>
        </ul>

        <h2>El futuro de la tecnología deportiva es abierto</h2>

        <p>
          El futuro del software es el código abierto. Grandes empresas como
          Microsoft, Google y Amazon lo están adoptando. Las ventajas son
          claras: más seguridad, una innovación más rápida, más transparencia y
          más control para el usuario.
        </p>

        <p>
          <strong>
            OpenAthlete quiere llevar esto a la tecnología deportiva.
          </strong>{' '}
          Creemos que los atletas y los entrenadores merecen:
        </p>
        <ul>
          <li>Transparencia sobre cómo se procesan sus datos</li>
          <li>Control sobre su información de entrenamiento</li>
          <li>
            Una innovación guiada por las necesidades de los usuarios, no por el
            beneficio
          </li>
          <li>Libertad frente a la dependencia de un proveedor</li>
          <li>
            Un software que mejora gracias a la colaboración de la comunidad
          </li>
        </ul>

        <h2>Empieza a usar un software de entrenamiento de código abierto</h2>

        <p>
          ¿Quieres descubrir las ventajas del código abierto? OpenAthlete es
          gratuito, de código abierto y está listo para usar:
        </p>

        <ol>
          <li>
            <strong>Prueba la versión en la nube:</strong> regístrate gratis en{' '}
            <a href="https://app.openathlete.org/auth/create-account">
              app.openathlete.org
            </a>{' '}
            y descubre un software de entrenamiento de código abierto
          </li>
          <li>
            <strong>Revisa el código:</strong> echa un vistazo a nuestro
            repositorio de GitHub para ver cómo funciona todo
          </li>
          <li>
            <strong>Autoalójalo (opcional):</strong> para un control máximo,
            despliega OpenAthlete en tu propia infraestructura
          </li>
          <li>
            <strong>Contribuye:</strong> ayuda a mejorar OpenAthlete informando
            de errores, proponiendo funciones o aportando código
          </li>
        </ol>

        <p>
          <strong>Tus datos, tu control y un código que puedes leer.</strong>
        </p>

        <p>
          <a href="https://app.openathlete.org/auth/create-account">
            Empieza con OpenAthlete →
          </a>
        </p>

        <h2>Preguntas frecuentes</h2>

        <h3>¿El software de código abierto es menos seguro?</h3>
        <p>
          No. De hecho, el software de código abierto suele ser más seguro
          porque más personas pueden revisar el código y encontrar
          vulnerabilidades. El principio de los «muchos ojos» hace que los
          fallos de seguridad se detecten y se corrijan antes que en el software
          propietario.
        </p>

        <h3>¿De verdad puedo autoalojar OpenAthlete?</h3>
        <p>
          ¡Sí! OpenAthlete está pensado para poder autoalojarse. Puedes
          desplegarlo en tu propio servidor, usar tu propia base de datos y
          tener el control total de tus datos. Hay documentación disponible para
          el autoalojamiento.
        </p>

        <h3>
          ¿Y si no tengo conocimientos técnicos? ¿Tengo que entender código?
        </h3>
        <p>
          ¡Para nada! Puedes usar la versión en la nube de OpenAthlete como
          cualquier otra plataforma de entrenamiento. Que sea de código abierto
          te da la opción de autoalojarlo o revisar el código si quieres, pero
          no es obligatorio.
        </p>

        <h3>¿Cómo ayuda el código abierto a innovar?</h3>
        <p>
          El código abierto permite que cualquiera aporte mejoras. Atletas,
          entrenadores y desarrolladores pueden proponer funciones, informar de
          errores e incluso contribuir con código. Así, el software mejora en
          función de las necesidades reales de los usuarios, y no solo de lo que
          una empresa cree que se venderá.
        </p>

        <h3>¿Qué licencia usa OpenAthlete?</h3>
        <p>
          OpenAthlete usa la licencia AGPLv3, que garantiza que el software siga
          siendo libre y de código abierto. Esto significa que puedes usar,
          modificar y distribuir OpenAthlete siempre que respetes los términos
          de la licencia.
        </p>
      </div>
    );
  },
};
