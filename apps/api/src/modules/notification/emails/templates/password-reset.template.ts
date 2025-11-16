import { button, h1, note, p } from '../core/blocks';
import { layout } from '../core/layout';

export function buildPasswordResetEmail({ url }: { url: string }) {
  const title = 'Réinitialiser votre mot de passe';
  const preview = 'Réinitialisez votre mot de passe OpenAthlete';

  const content = [
    h1(title),
    p(
      'Nous avons reçu une demande pour réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.',
    ),
    button({ href: url, label: 'Choisir un nouveau mot de passe' }),
    note(
      `Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur: ${url}`,
    ),
    note(
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.",
    ),
  ].join('');

  return layout({ title, preview, contentHtml: content });
}
