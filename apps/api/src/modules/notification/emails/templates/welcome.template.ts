import { layout } from '../core/layout';
import { button, h1, note, p } from '../core/blocks';

export function buildWelcomeEmail({
  name,
  dashboard_url,
}: {
  name?: string;
  dashboard_url?: string;
}) {
  const title = 'Bienvenue sur OpenAthlete';
  const preview = name ? `Bienvenue, ${name} !` : 'Bienvenue sur OpenAthlete';

  const content = [
    h1(title),
    p(
      name
        ? `Ravi de vous compter parmi nous, ${name}.`
        : "Ravi de vous compter parmi nous.",
    ),
    p(
      "Vous pouvez dès maintenant configurer vos objectifs, importer vos séances et explorer votre tableau de bord.",
    ),
    dashboard_url
      ? button({ href: dashboard_url, label: 'Accéder au tableau de bord' })
      : '',
    note(
      "Besoin d'aide ? Répondez simplement à cet email et nous vous aiderons rapidement.",
    ),
  ]
    .filter(Boolean)
    .join('');

  return layout({ title, preview, contentHtml: content });
}


