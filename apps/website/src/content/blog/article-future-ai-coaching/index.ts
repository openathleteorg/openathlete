import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleFutureAiCoaching: BlogPost = {
  metadata: {
    slug: 'the-future-of-ai-in-sports-coaching',
    title: {
      en: 'The future of AI in coaching: agents, MCP and the coach',
      fr: "L'avenir de l'IA dans le coaching : agents, MCP et coach",
      es: 'El futuro de la IA en el entrenamiento: agentes, MCP y entrenador',
      it: "Il futuro dell'IA nel coaching: agenti, MCP e allenatore",
      'pt-br': 'O futuro da IA no treinamento: agentes, MCP e o treinador',
      de: 'Die Zukunft der KI im Coaching: Agenten, MCP und der Coach',
    },
    description: {
      en: 'AI agents can now read a calendar and plan sessions through MCP. What that changes for coaches, what it does not, and where to keep the human.',
      fr: "Via le MCP, des agents d'IA lisent le calendrier et planifient des séances. Ce que cela change pour les coachs, ce que cela ne change pas.",
      es: 'Con MCP, los agentes de IA ya leen el calendario y planifican sesiones. Qué cambia para los entrenadores, qué no y dónde mantener a la persona.',
      it: 'Con MCP gli agenti di IA leggono il calendario e pianificano sedute. Cosa cambia per gli allenatori, cosa no e dove tenere la persona.',
      'pt-br':
        'Com o MCP, agentes de IA já leem o calendário e planejam treinos. O que muda para os treinadores, o que não muda e onde manter a pessoa.',
      de: 'Mit MCP lesen KI-Agenten schon Kalender und planen Einheiten. Was sich für Coaches ändert, was nicht und wo der Mensch bleiben sollte.',
    },
    excerpt: {
      en: 'Agents make the admin half of coaching much cheaper and leave the judgment half where it was. A measured look at MCP, its limits and the coach in the loop.',
      fr: 'Les agents rendent la moitié administrative du coaching bien moins coûteuse et laissent le jugement là où il était. Un regard mesuré sur le MCP, ses limites et le coach dans la boucle.',
      es: 'Los agentes abaratan mucho la mitad administrativa del entrenamiento y dejan el criterio donde estaba. Una mirada mesurada al MCP, sus límites y el entrenador.',
      it: "Gli agenti rendono molto più economica la metà amministrativa del coaching e lasciano il giudizio dov'era. Uno sguardo misurato su MCP, limiti e ruolo dell'allenatore.",
      'pt-br':
        'Os agentes deixam a metade administrativa do treinamento muito mais barata e o julgamento onde estava. Um olhar ponderado sobre o MCP, seus limites e o treinador.',
      de: 'Agenten machen die administrative Hälfte des Coachings viel günstiger und lassen das Urteilsvermögen, wo es war. Ein nüchterner Blick auf MCP, seine Grenzen und den Coach.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-25',
    updatedAt: '2026-11-03',
    tags: ['AI', 'MCP', 'Coaching'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1696272440000-0808a203c852?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwZnV0dXJlJTIwdGVjaG5vbG9neSUyMGlubm92YXRpb24lMjBjb2FjaGluZ3xlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};
