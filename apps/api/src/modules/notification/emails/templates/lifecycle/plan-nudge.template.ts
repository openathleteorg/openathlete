import type { EmailLanguage } from '@openathlete/shared';

import { button, heading, paragraph, signature } from '../../core/blocks';
import { renderEmail } from '../../core/layout';
import { LifecycleEmail, LifecycleEmailProps, greeting } from './common';

const translations = {
  FR: {
    subject: 'Ajoutez votre prochaine course',
    preview: 'Ou partez d’un plan gratuit, à vos allures.',
    body: "Vos séances arrivent bien depuis une semaine. Pour l'instant, rien n'est prévu dans votre calendrier.",
    race: "Si vous avez une course en vue, ajoutez-la : OpenAthlete compte les semaines qui restent, et vous pouvez construire votre plan jusqu'au jour J.",
    button: 'Ajouter ma course',
    plans: [
      "Pas encore d'objectif ? ",
      'Nos plans gratuits',
      ', du 5 km au marathon et au trail, s’ajoutent à votre calendrier en un clic, à vos allures.',
    ],
  },
  EN: {
    subject: 'Add your next race',
    preview: 'Or start from a free plan, at your own paces.',
    body: 'Your sessions have been coming in for a week. So far, nothing is planned in your calendar.',
    race: 'If you have a race in mind, add it: OpenAthlete counts the weeks left, and you can build your plan up to race day.',
    button: 'Add my race',
    plans: [
      'No goal yet? ',
      'Our free plans',
      ', from 5K to marathon and trail, go into your calendar in one click, at your own paces.',
    ],
  },
  IT: {
    subject: 'Aggiungi la tua prossima gara',
    preview: 'Oppure parti da un piano gratuito, con i tuoi ritmi.',
    body: 'Le tue sessioni arrivano da una settimana. Per ora nel calendario non c’è niente in programma.',
    race: 'Se hai una gara in vista, aggiungila: OpenAthlete conta le settimane che mancano e puoi costruire il tuo piano fino al giorno della gara.',
    button: 'Aggiungi la mia gara',
    plans: [
      'Ancora nessun obiettivo? ',
      'I nostri piani gratuiti',
      ', dai 5 km alla maratona e al trail, si aggiungono al calendario con un clic, con i tuoi ritmi.',
    ],
  },
  ES: {
    subject: 'Añade tu próxima carrera',
    preview: 'O empieza con un plan gratuito, a tus ritmos.',
    body: 'Tus sesiones llegan desde hace una semana. Por ahora no hay nada previsto en tu calendario.',
    race: 'Si tienes una carrera en mente, añádela: OpenAthlete cuenta las semanas que faltan y puedes preparar tu plan hasta el día de la carrera.',
    button: 'Añadir mi carrera',
    plans: [
      '¿Aún sin objetivo? ',
      'Nuestros planes gratuitos',
      ', del 5K al maratón y el trail, se añaden a tu calendario con un clic, a tus ritmos.',
    ],
  },
  PT_BR: {
    subject: 'Adicione sua próxima prova',
    preview: 'Ou comece com um plano gratuito, nos seus ritmos.',
    body: 'Seus treinos estão chegando há uma semana. Por enquanto, não há nada planejado no seu calendário.',
    race: 'Se você tem uma prova em vista, adicione-a: o OpenAthlete conta as semanas que faltam e você pode montar seu plano até o dia da prova.',
    button: 'Adicionar minha prova',
    plans: [
      'Ainda sem objetivo? ',
      'Nossos planos gratuitos',
      ', dos 5 km à maratona e ao trail, entram no seu calendário com um clique, nos seus ritmos.',
    ],
  },
  DE: {
    subject: 'Trag deinen nächsten Wettkampf ein',
    preview: 'Oder starte mit einem kostenlosen Plan, in deinem Tempo.',
    body: 'Deine Aktivitäten kommen seit einer Woche an. Bisher ist in deinem Kalender aber nichts geplant.',
    race: 'Wenn du einen Wettkampf im Blick hast, trag ihn ein: OpenAthlete zählt die verbleibenden Wochen, und du kannst deinen Plan bis zum Wettkampftag aufbauen.',
    button: 'Wettkampf hinzufügen',
    plans: [
      'Noch kein Ziel? ',
      'Unsere kostenlosen Pläne',
      ', von 5 km bis Marathon und Trail, landen mit einem Klick in deinem Kalender, abgestimmt auf deine Paces.',
    ],
  },
} satisfies Record<EmailLanguage, unknown>;

export function buildPlanNudgeEmail(
  props: LifecycleEmailProps & { calendarUrl: string; plansUrl: string },
): LifecycleEmail {
  const t = translations[props.language];
  return {
    subject: t.subject,
    ...renderEmail({
      language: props.language,
      title: t.subject,
      preview: t.preview,
      footer: props.footer,
      blocks: [
        heading(t.subject),
        paragraph(greeting(props.language, props.name)),
        paragraph(t.body),
        paragraph(t.race),
        button({ href: props.calendarUrl, label: t.button }),
        paragraph(
          t.plans[0],
          { href: props.plansUrl, label: t.plans[1] },
          t.plans[2],
        ),
        signature(props.signature),
      ],
    }),
  };
}
