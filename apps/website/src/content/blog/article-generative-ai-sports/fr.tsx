import Link from 'next/link';

import { Sources } from './sources';

export function ContentFr() {
  return (
    <div>
      <p>
        Pour un sportif d'endurance, l'IA générative n'est ni un gadget ni une
        révolution. C'est un outil de texte. Elle excelle à transformer un
        langage approximatif en structure, et une structure en texte lisible.
        Elle devient peu fiable dès qu'il s'agit d'avoir raison sur votre corps
        ou sur des chiffres que personne ne lui a donnés. Vue sous cet angle, on
        comprend vite où elle fait gagner du temps et où elle peut faire du
        tort.
      </p>

      <h2>Ce qu'elle fait bien&nbsp;: écrire une séance</h2>
      <p>
        Saisir une séance structurée dans l'application de sa montre est
        fastidieux. La décrire ne l'est pas. «&nbsp;20 minutes d'échauffement,
        puis 6 × 3 minutes vite avec 2 minutes de trot, 10 minutes de retour au
        calme&nbsp;» est exactement le genre de phrase qu'un modèle de langage
        traite bien&nbsp;: il la découpe en blocs, gère les répétitions et, s'il
        connaît vos zones, donne une cible à chaque bloc. Le «&nbsp;vite&nbsp;»
        sur 3 minutes devient votre plage d'allure à VMA, le «&nbsp;trot&nbsp;»
        votre allure de récupération.
      </p>
      <p>
        Deux points méritent une vérification avant d'envoyer la séance sur la
        montre&nbsp;: la durée totale (il arrive qu'un modèle oublie ou double
        un bloc) et l'intensité retenue pour les mots vagues. «&nbsp;Vite&nbsp;»
        peut signifier seuil pour l'un et allure 5 km pour l'autre. Si le modèle
        s'est trompé, dites-le-lui, ou écrivez «&nbsp;au seuil&nbsp;» la fois
        suivante.
      </p>

      <h2>Ce qu'elle fait bien&nbsp;: transformer un ressenti en données</h2>
      <p>
        Après une sortie longue, presque personne ne remplit un formulaire à
        cinq curseurs. On dit plutôt&nbsp;: «&nbsp;première heure tranquille,
        puis la chaleur m'a cueilli, les 5 derniers km ont été durs et le mollet
        droit s'est contracté&nbsp;». Un modèle de langage peut en tirer une
        note d'effort autour de 8 et une remarque&nbsp;: mollet droit,
        contracture, en fin de sortie. Au fil des semaines, ces remarques
        deviennent quelque chose qu'un coach peut réellement filtrer.
      </p>
      <p>
        C'est plus important qu'il n'y paraît. Une revue systématique de Saw et
        ses collègues (2016) a montré que les mesures subjectives, déclarées par
        l'athlète, suivent la charge d'entraînement mieux que la plupart des
        marqueurs objectifs. Le goulot d'étranglement a toujours été d'obtenir
        que les athlètes les notent. Réduire l'effort à une phrase ou à un
        message vocal aide.
      </p>

      <h2>Ce qu'elle fait bien&nbsp;: résumer et réécrire</h2>
      <p>
        Collez quatre semaines de notes de séances et demandez un résumé avant
        de faire le point avec votre coach&nbsp;: elle fera ressortir les thèmes
        récurrents (l'Achille qui se plaint après les côtes, les séances du
        jeudi qui sautent sans arrêt) plus vite que vous. Elle peut réécrire une
        semaine autour d'une contrainte, par exemple un déplacement
        professionnel du mardi au jeudi avec pour seul équipement le tapis de
        l'hôtel, et vous proposer un brouillon raisonnable. Elle peut traduire
        un plan rédigé par votre coach dans une autre langue. À chaque fois,
        vous obtenez un brouillon à vérifier, pas une consigne à suivre.
      </p>

      <h2>Utilisable avec prudence&nbsp;: expliquer</h2>
      <p>
        Demandez ce qui distingue le travail au seuil du fractionné à VMA, ou
        pourquoi la sortie longue doit rester facile, et vous obtiendrez
        généralement une explication correcte. Le risque, c'est qu'elle ajoute
        avec assurance un détail faux, ou cite une étude qui n'existe pas. Les
        modèles de langage produisent du texte fluide, pas des faits vérifiés,
        un problème que les chercheurs appellent hallucination (Ji et ses
        collègues, 2023). Si une réponse cite une source, vérifiez-la avant de
        la répéter.
      </p>

      <h2>Ce qu'elle fait mal&nbsp;: poser un diagnostic</h2>
      <p>
        Tapez «&nbsp;douleur à l'extérieur du genou après 20 km&nbsp;» et vous
        recevrez une réponse bien rangée sur la bandelette ilio-tibiale, avec
        des étirements et un plan de reprise. Elle a peut-être raison. Il peut
        aussi s'agir de tout autre chose, et le modèle n'a aucun moyen de le
        savoir&nbsp;: il ne peut ni vous examiner, ni vous regarder courir, ni
        appuyer sur la zone douloureuse. Une réponse plausible à une question
        médicale est pire que pas de réponse, parce qu'elle retarde la
        consultation qui aurait réglé la question. Une douleur qui persiste, qui
        vous fait boiter, qui s'aggrave en courant ou qui est présente au repos
        relève d'un kinésithérapeute ou d'un médecin.
      </p>

      <h2>Ce qu'elle fait mal&nbsp;: un plan complet à partir de rien</h2>
      <p>
        Düking et ses collègues (2024) ont demandé à ChatGPT des plans de course
        à pied sur six semaines et les ont fait évaluer par des entraîneurs
        experts selon 22 critères. Avec peu d'informations, le plan obtenait une
        note sous la moyenne sur 19 d'entre eux. Avec des informations
        détaillées, il faisait bien mieux, mais les auteurs déconseillent
        toujours de suivre ces plans sans l'avis d'un entraîneur. L'échec
        typique est facile à imaginer&nbsp;: vous courez 30 km par semaine, vous
        demandez un plan marathon, et la première semaine en compte 50 parce que
        le modèle a comblé votre historique avec celui d'un coureur moyen.
      </p>

      <h2>Ce qu'elle fait mal&nbsp;: les chiffres qu'on ne lui a pas donnés</h2>
      <p>
        Demandez «&nbsp;combien ai-je couru en septembre&nbsp;?&nbsp;» sans lui
        fournir vos données, et un modèle conversationnel peut tout simplement
        inventer un chiffre plausible. Même avec les données collées,
        additionner trente lignes n'est pas son fort. Les totaux, les moyennes
        et les calculs de charge doivent venir d'un logiciel qui les calcule, et
        le modèle de langage ne doit que commenter le résultat.
      </p>

      <h2>Obtenir des réponses plus utiles</h2>
      <p>
        Donnez-lui du contexte&nbsp;: vos zones ou vos chronos récents, votre
        volume hebdomadaire des quatre à six dernières semaines, la course visée
        et sa date, les jours où vous pouvez vous entraîner, et toute petite
        gêne en cours. Demandez-lui d'énoncer ses hypothèses avant d'écrire quoi
        que ce soit. Puis confrontez le résultat à quelques règles
        simples&nbsp;: pas de grand saut de volume hebdomadaire, pas plus de
        séances dures que d'habitude (deux par semaine suffisent largement à la
        plupart des coureurs amateurs), et des jours faciles vraiment faciles.
      </p>

      <h2>Dans OpenAthlete</h2>
      <p>
        Les fonctions d'IA d'OpenAthlete restent du côté texte de cette
        frontière. L'IA écrit une séance structurée à partir d'une phrase en
        utilisant vos zones, modifie une séance sur simple consigne, pose trois
        ou quatre questions après une activité et transforme les réponses en
        note d'effort et en relevé de douleur pour votre coach, et livre une
        courte lecture de chaque activité. Vous voyez chaque séance avant
        qu'elle parte sur votre montre. Elle ne pose aucun diagnostic et ne
        fonctionne qu'avec votre accord, sur votre propre clé d'API ou sur le
        quota de l'offre Supporter. La{' '}
        <Link href="/fr/features/ai-coach">page consacrée à l'IA</Link> donne
        les détails.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
