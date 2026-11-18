import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { Link } from 'react-router-dom';

import {
  QUESTIONNAIRE_TEMPLATES,
  templateInfo,
} from './questionnaire-templates';

/** The templates a questionnaire starts from, each a link to the editor */
export function TemplateGallery({ className }: { className?: string }) {
  return (
    <ul
      className={cn('grid gap-3 sm:grid-cols-2', className)}
      aria-label={m.questionnaire_templates()}
    >
      {QUESTIONNAIRE_TEMPLATES.map((template) => {
        const info = templateInfo(template);
        return (
          <li key={template}>
            <Link
              to={`${getPath(['dashboard', 'questionnaires', 'create'])}?template=${template}`}
              className="flex h-full flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              data-template={template}
            >
              <span className="font-medium">{info.title}</span>
              <span className="text-sm text-muted-foreground">
                {info.description}
              </span>
              {info.source && (
                <span className="mt-auto pt-2 text-xs text-muted-foreground">
                  {info.source}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
