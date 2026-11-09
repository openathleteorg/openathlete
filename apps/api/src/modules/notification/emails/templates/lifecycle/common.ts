import type { EmailLanguage } from '@openathlete/shared';

import { EmailFooter, RenderedEmail } from '../../core/layout';

/** What every email of the sequences receives */
export interface LifecycleEmailProps {
  language: EmailLanguage;
  name?: string;
  /** Who signs */
  signature: string;
  footer: EmailFooter;
}

export interface LifecycleEmail extends RenderedEmail {
  subject: string;
}

export function greeting(language: EmailLanguage, name?: string) {
  switch (language) {
    case 'FR':
      return name ? `Bonjour ${name},` : 'Bonjour,';
    case 'EN':
      return name ? `Hi ${name},` : 'Hi,';
    case 'IT':
      return name ? `Ciao ${name},` : 'Ciao,';
    case 'ES':
      return name ? `Hola, ${name}:` : 'Hola:';
    case 'PT_BR':
      return name ? `Olá, ${name},` : 'Olá,';
  }
}
