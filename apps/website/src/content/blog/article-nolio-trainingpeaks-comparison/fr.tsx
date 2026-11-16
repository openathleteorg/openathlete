import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('fr');

export function ContentFr() {
  return (
    <div>
      <p>
        Si vous entraînez des athlètes d'endurance en France, le choix se résume
        souvent à TrainingPeaks ou Nolio. Cet article y ajoute OpenAthlete, que
        nous développons, et compare les trois du point de vue de
        l'entraîneur&nbsp;: ce que vous payez quand l'effectif grandit, ce dont
        vos athlètes ont besoin, et ce que chacun fait mieux que les autres. Les
        prix viennent de la page tarifs de chaque éditeur, relevés le 3 novembre
        2026. Les prix en dollars sont hors taxes, comme les affiche
        TrainingPeaks.
      </p>

      <h2>Trois logiques de prix</h2>
      <p>
        <strong>TrainingPeaks</strong> facture à l'athlète. L'offre entraîneur
        démarre à {q('tpCoach')} par mois avec quatre athlètes Basic et un en
        Premium&nbsp;; chaque athlète Premium supplémentaire coûte{' '}
        {q('tpPerMax')} par mois, puis jusqu'à {q('tpPerMin')} avec le volume.
        Des frais de mise en service de {q('tpSetup')} s'appliquent, offerts
        avec un code promo. Les athlètes peuvent rester en Basic (
        {q('tpCoachUnlimited')} par mois en couvrent un nombre illimité), mais
        leurs séances planifiées n'arrivent alors pas sur la montre&nbsp;: la
        plupart des entraîneurs paient donc le Premium, ou demandent aux
        athlètes de payer eux-mêmes {q('tpYear')} par an.
      </p>
      <p>
        <strong>Nolio</strong> facture par palier. Starter coûte {q('nStarter')}{' '}
        par mois pour 3 athlètes, Classic {q('nClassic')} pour 25 et Pro{' '}
        {q('nPro')} pour 30 athlètes et deux entraîneurs&nbsp;; un entraîneur
        supplémentaire coûte {q('nExtraCoach')} par mois. Les athlètes n'ont
        rien à payer pour la synchronisation montre&nbsp;: l'offre athlète
        gratuite l'inclut. Les clubs ont leurs propres offres, Club Starter à{' '}
        {q('nClubStarter')} et Club Classic à {q('nClubClassic')} par mois.
      </p>
      <p>
        <strong>OpenAthlete</strong> est gratuit jusqu'à cinq athlètes. Au-delà,
        l'offre Supporter à {q('oaYear')} par an lève la limite, quel que soit
        l'effectif, et ajoute l'IA sur nos clés. La synchronisation montre est
        gratuite pour les athlètes. L'auto-hébergement est gratuit, sans limite.
        Les clubs ont un espace club gratuit, et les athlètes qu'un entraîneur
        suit via un club ne comptent pas dans les cinq.
      </p>

      <table>
        <thead>
          <tr>
            <th>Athlètes</th>
            <th>TrainingPeaks (athlètes en Premium)</th>
            <th>Nolio</th>
            <th>OpenAthlete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>3</td>
            <td>{coachYear('trainingpeaks', 3)}</td>
            <td>{coachYear('nolio', 3)} (Starter)</td>
            <td>Gratuit</td>
          </tr>
          <tr>
            <td>10</td>
            <td>{coachYear('trainingpeaks', 10)}</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>25</td>
            <td>{coachYear('trainingpeaks', 25)}</td>
            <td>{coachYear('nolio', 25)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>30</td>
            <td>{coachYear('trainingpeaks', 30)}</td>
            <td>{coachYear('nolio', 30)} (Pro)</td>
            <td>{q('oaYear')}</td>
          </tr>
        </tbody>
      </table>
      <p>
        Coût annuel pour un entraîneur, facturation mensuelle, prix publics
        relevés le 3 novembre 2026. La colonne TrainingPeaks suppose que
        l'entraîneur paie le Premium de chaque athlète&nbsp;; si vos athlètes le
        paient déjà, votre facture est bien plus basse.
      </p>

      <h2>Ce que chacun fait le mieux</h2>
      <p>
        <strong>TrainingPeaks</strong>, c'est la langue commune. Beaucoup
        d'athlètes arrivent avec un compte et un historique, beaucoup
        d'entraîneurs raisonnent en TSS et en Performance Management Chart, et
        si vous vendez des plans, sa boutique les met sous les yeux des
        acheteurs. Les applications mobiles sont abouties, et TrainingPeaks
        Virtual couvre le home trainer. Depuis le 22 juillet 2026, la plateforme
        appartient à Garmin&nbsp;; ce que cela peut changer est abordé dans
        <Link href="/fr/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          les alternatives à TrainingPeaks après le rachat par Garmin
        </Link>
        .
      </p>
      <p>
        <strong>Nolio</strong> est pensé pour les clubs français. C'est une
        entreprise grenobloise, partenaire de la FFA, avec des tarifs
        associatifs, plusieurs entraîneurs sur un même compte, des applications
        iOS et Android natives et plus de 200 vidéos d'exercices pour le
        renforcement. Si votre club veut un seul compte pour trois entraîneurs
        et soixante licenciés, avec des applications natives sur chaque
        téléphone, Nolio a une offre faite pour ça.
      </p>
      <p>
        <strong>OpenAthlete</strong> garde un prix fixe et ajoute quelques
        fonctions que les deux autres n'annoncent pas. L'IA tourne avec votre
        propre clé (ou le quota Supporter)&nbsp;: vous écrivez «&nbsp;10 km
        footing puis 6 × 400 m allure 5 km&nbsp;» et obtenez une séance
        structurée avec les zones de l'athlète&nbsp;; après chaque activité,
        l'athlète reçoit une courte lecture et quelques questions, et l'effort
        ainsi que les douleurs signalées arrivent dans un journal des blessures
        et sur votre tableau de bord. Via le serveur MCP, Claude ou ChatGPT
        peuvent lire l'entraînement d'un athlète et planifier jusqu'à 60 séances
        dans son calendrier. Les clubs ont un espace club gratuit sans limite
        d'athlètes&nbsp;: des groupes avec leurs entraîneurs, une bibliothèque
        partagée, des séances de club hebdomadaires auxquelles les athlètes
        répondent, et une séance, une journée ou une semaine copiée à tout un
        groupe, adaptée aux zones de chacun. Le code est sous AGPL-3.0&nbsp;: un
        club peut aussi héberger sa propre instance, avec authentification
        unique et inscriptions sur invitation.
      </p>

      <h2>Ce qui manque à chacun</h2>
      <p>
        TrainingPeaks n'affiche pas d'IA intégrée sur ses pages tarifs, et les
        frais par athlète montent vite si vous payez le Premium. Les offres
        entraîneur de Nolio sont payantes dès le premier athlète, et Nolio
        n'annonce pas d'IA. Aucun des deux n'est open source.
      </p>
      <p>
        Les manques d'OpenAthlete sont réels aussi. Les applications iOS et
        Android sont en test&nbsp;: les athlètes utilisent pour l'instant
        l'application web installable. L'espace club n'a pas de facturation au
        club&nbsp;: les cotisations se gèrent en dehors d'OpenAthlete. Pas de
        boutique, pas de vidéothèque d'exercices, pas de partenariat fédéral.
        Les séances partent vers les montres Garmin, Suunto et COROS, pas Polar.
        La charge est le TRIMP de Banister calculé à partir de la fréquence
        cardiaque, avec le RPE de séance à côté&nbsp;: les chiffres ne
        correspondront pas au TSS si vos athlètes viennent de TrainingPeaks.
      </p>

      <h2>Trois entraîneurs, trois réponses</h2>
      <p>
        Un entraîneur indépendant avec douze coureurs sur un mélange de
        Forerunner, une COROS Pace et une Suunto&nbsp;: TrainingPeaks est ici le
        plus cher, sauf si les athlètes paient leur propre Premium. Nolio
        Classic et OpenAthlete font tous deux le travail&nbsp;; la différence se
        joue entre {coachYear('nolio', 12)} et {q('oaYear')} par an, l'IA d'un
        côté et les applications natives de l'autre.
      </p>
      <p>
        Un club avec trois entraîneurs et soixante licenciés&nbsp;: s'ils
        veulent une application native sur leur téléphone dès aujourd'hui, les
        offres club de Nolio sont les plus adaptées. Si l'application web
        installable leur suffit, l'espace club d'OpenAthlete fait le travail
        gratuitement, avec les groupes, une bibliothèque partagée et la piste du
        mardi déjà dans le calendrier de chaque licencié. Une instance
        auto-hébergée reste une option si quelqu'un au club veut bien gérer un
        serveur.
      </p>
      <p>
        Un entraîneur qui vend des plans à des athlètes qu'il ne rencontre
        jamais&nbsp;: restez sur TrainingPeaks. Ni Nolio ni OpenAthlete n'ont de
        boutique.
      </p>
      <p>
        Plus de détails, avec une source pour chaque affirmation, sur les pages{' '}
        <Link href="/fr/compare/nolio">OpenAthlete vs Nolio</Link> et{' '}
        <Link href="/fr/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , et ce qu'OpenAthlete propose aux entraîneurs sur la{' '}
        <Link href="/fr/coaches">page entraîneurs</Link>.
      </p>
    </div>
  );
}
