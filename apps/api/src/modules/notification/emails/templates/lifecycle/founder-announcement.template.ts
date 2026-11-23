import type { EmailLanguage } from '@openathlete/shared';

import { button, paragraph, signature } from '../../core/blocks';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

const translations = {
  FR: {
    subject: 'rien ne change pour vous',
    preview: 'Vous gardez votre prix, et vous avez un peu plus.',
    news: "Le Supporter a désormais trois montants au choix : chacun donne ce qui lui convient, pour les mêmes avantages. L'IA incluse fonctionne maintenant à la semaine, avec un usage raisonnable qui se recharge chaque lundi.",
    founder:
      'Vous souteniez OpenAthlete avant ce changement : vous êtes fondateur. Vous gardez votre prix et vos droits, athlètes illimités compris, tant que votre abonnement continue. Et vous recevez tous les nouveaux avantages Supporter, comme les autres.',
    thanks:
      "Vous n'avez rien à faire. Merci d'avoir cru au projet aussi tôt, c'est grâce à vous qu'il avance.",
    cta: 'Voir mon abonnement',
  },
  EN: {
    subject: 'nothing changes for you',
    preview: 'You keep your price, and you get a bit more.',
    news: 'Supporter now comes in three amounts: everyone gives what suits them, for the same perks. The included AI now works by the week, for reasonable use that refills every Monday.',
    founder:
      'You supported OpenAthlete before this change, which makes you a founder. You keep your price and your rights, unlimited athletes included, for as long as your subscription runs. And you get every new Supporter perk, like everyone else.',
    thanks:
      'There is nothing for you to do. Thank you for believing in the project this early: it moves forward thanks to you.',
    cta: 'See my subscription',
  },
  IT: {
    subject: 'per te non cambia nulla',
    preview: 'Mantieni il tuo prezzo, e hai qualcosa in più.',
    news: 'Il Supporter ora ha tre importi a scelta: ognuno dà quello che vuole, per gli stessi vantaggi. L’IA inclusa ora funziona a settimana, per un uso ragionevole che si ricarica ogni lunedì.',
    founder:
      'Sostenevi OpenAthlete prima di questo cambiamento: sei un fondatore. Mantieni il tuo prezzo e i tuoi diritti, atleti illimitati compresi, finché il tuo abbonamento continua. E ricevi tutti i nuovi vantaggi Supporter, come gli altri.',
    thanks:
      'Non devi fare nulla. Grazie per aver creduto nel progetto così presto: va avanti grazie a te.',
    cta: 'Vedi il mio abbonamento',
  },
  ES: {
    subject: 'para ti no cambia nada',
    preview: 'Mantienes tu precio, y tienes un poco más.',
    news: 'Supporter ahora tiene tres importes a elegir: cada uno aporta lo que le va bien, con las mismas ventajas. La IA incluida ahora funciona por semanas, con un uso razonable que se recarga cada lunes.',
    founder:
      'Apoyabas OpenAthlete antes de este cambio: eres fundador. Mantienes tu precio y tus derechos, atletas ilimitados incluidos, mientras tu suscripción siga activa. Y recibes todas las nuevas ventajas Supporter, como los demás.',
    thanks:
      'No tienes que hacer nada. Gracias por creer en el proyecto tan pronto: avanza gracias a ti.',
    cta: 'Ver mi suscripción',
  },
  PT_BR: {
    subject: 'nada muda para você',
    preview: 'Você mantém seu preço, e ganha um pouco mais.',
    news: 'O Supporter agora tem três valores à escolha: cada um contribui com o que for melhor, pelas mesmas vantagens. A IA incluída agora funciona por semana, para um uso razoável que recarrega toda segunda-feira.',
    founder:
      'Você apoiava o OpenAthlete antes desta mudança: você é fundador. Você mantém seu preço e seus direitos, atletas ilimitados incluídos, enquanto sua assinatura continuar. E recebe todas as novas vantagens Supporter, como os demais.',
    thanks:
      'Você não precisa fazer nada. Obrigado por acreditar no projeto tão cedo: ele avança graças a você.',
    cta: 'Ver minha assinatura',
  },
  DE: {
    subject: 'für dich ändert sich nichts',
    preview: 'Du behältst deinen Preis und bekommst etwas mehr.',
    news: 'Supporter gibt es jetzt in drei Beträgen: Jede und jeder gibt, was passt, für dieselben Vorteile. Die inklusive KI funktioniert jetzt wochenweise, für eine angemessene Nutzung, die jeden Montag wieder aufgefüllt wird.',
    founder:
      'Du hast OpenAthlete schon vor dieser Änderung unterstützt und bist damit Gründungsmitglied. Du behältst deinen Preis und deine Rechte, unbegrenzt viele Athleten inklusive, solange dein Abo läuft. Und du bekommst alle neuen Supporter-Vorteile, wie alle anderen.',
    thanks:
      'Du musst nichts tun. Danke, dass du so früh an das Projekt geglaubt hast: Es kommt dank dir voran.',
    cta: 'Mein Abo ansehen',
  },
  PL: {
    subject: 'dla Ciebie nic się nie zmienia',
    preview: 'Zachowujesz swoją cenę i dostajesz trochę więcej.',
    news: 'Supporter ma teraz trzy kwoty do wyboru: każdy wpłaca tyle, ile mu pasuje, za te same korzyści. Wbudowana AI działa teraz w rytmie tygodniowym, w rozsądnym limicie, który odnawia się w każdy poniedziałek.',
    founder:
      'Twoje wsparcie dla OpenAthlete zaczęło się przed tą zmianą, więc należysz do grona założycieli. Zachowujesz swoją cenę i swoje uprawnienia, w tym nieograniczoną liczbę zawodników, dopóki trwa Twoja subskrypcja. Dostajesz też wszystkie nowe korzyści Supportera, tak jak wszyscy.',
    thanks:
      'Nie musisz nic robić. Dziękuję za tak wczesne zaufanie do projektu: to dzięki Tobie idzie naprzód.',
    cta: 'Zobacz moją subskrypcję',
  },
  NL: {
    subject: 'voor jou verandert er niets',
    preview: 'Je houdt je prijs, en je krijgt er wat bij.',
    news: 'Supporter is er nu in drie bedragen: iedereen geeft wat bij hem of haar past, voor dezelfde voordelen. De inbegrepen AI werkt nu per week, voor redelijk gebruik dat elke maandag weer wordt aangevuld.',
    founder:
      'Je steunde OpenAthlete al vóór deze wijziging, en daarmee ben je een van de oprichters. Je houdt je prijs en je rechten, onbeperkt aantal atleten inbegrepen, zolang je abonnement loopt. En je krijgt alle nieuwe Supporter-voordelen, net als iedereen.',
    thanks:
      'Je hoeft niets te doen. Bedankt dat je zo vroeg in het project geloofde: dankzij jou komt het vooruit.',
    cta: 'Mijn abonnement bekijken',
  },
} satisfies Record<EmailLanguage, unknown>;

/** Once, to each founder of the Supporter tiers: what changed, what stays */
export function buildFounderAnnouncementEmail(
  props: LifecycleEmailProps & { subscriptionUrl: string },
): LifecycleEmail {
  const t = translations[props.language];
  return {
    subject: t.subject,
    ...renderEmail({
      language: props.language,
      title: t.subject,
      preview: t.preview,
      footer: props.footer,
      variant: 'letter',
      blocks: [
        paragraph(greeting(props.language, props.name)),
        paragraph(t.news),
        paragraph(t.founder),
        paragraph(t.thanks),
        button({ href: props.subscriptionUrl, label: t.cta }),
        signature(props.signature),
      ],
    }),
  };
}
