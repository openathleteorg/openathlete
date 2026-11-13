# Training glossary (`/learn`)

One folder per term. The hub is `/learn` (`src/app/[locale]/learn/page.tsx`), each term is `/learn/<slug>` (`src/app/[locale]/learn/[term]/page.tsx`), prerendered for the five locales (`dynamicParams = false`). The sitemap, the social cards and the hub pick up every term in the registry: there is nothing else to wire.

## Files of a term

```
src/content/learn/<slug>/
  index.ts    metadata (a LearnTerm, see types.ts)
  en.tsx      export function ContentEn() { … }
  fr.tsx      export function ContentFr() { … }
  es.tsx      export function ContentEs() { … }
  it.tsx      export function ContentIt() { … }
  pt-br.tsx   export function ContentPtBr() { … }
  de.tsx      export function ContentDe() { … }
```

Copy `trimp/` as the model. `index.ts` exports one const named after the slug in camelCase (`zone-2` → `zone2`, `km-effort` → `kmEffort`).

### Metadata (`index.ts`)

All `Localized` fields need the six locales (`en`, `fr`, `es`, `it`, `'pt-br'`, `de`): there is no English fallback on glossary pages.

| Field | Rules |
| --- | --- |
| `slug` | URL segment, lowercase, hyphens. Never change it once published. |
| `theme` | `'load'` (Load and form), `'intensity'` (Intensity and capacities) or `'racing'` (Racing and terrain). |
| `name` | The term as listed and sorted on the hub: `'Zone 2'`, `'VMA (maximal aerobic speed)'`. Localized (`'Zona 2'`, `'VAM'`…). |
| `title` | H1 and `<title>`, ≤ 65 characters. EN `'<Term>: definition, formula, example'` (or `…, examples`, `…, how to calculate it` when there is no formula). FR `'Qu’est-ce que le/la <terme>\u00a0? Définition, formule, exemple'`, ES `'¿Qué es el/la <término>? Definición, fórmula y ejemplo'`, IT `'Cos’è il/la <termine>? Definizione, formula, esempio'`, PT `'O que é <termo>? Definição, fórmula e exemplo'`. |
| `description` | Meta description, ≤ 155 characters, a real sentence with the query words. |
| `definition` | ONE sentence answering “what is X”, starting with the term (“Zone 2 is …”). Shown in the box under the H1, on the hub, and in the DefinedTerm JSON-LD. |
| `aliases` | Optional, other names people search (`'Training impulse'`, `'Endurance fondamentale'`). |
| `faq` | 2–3 questions per locale, plain-text answers (they go into FAQPage JSON-LD). Don’t repeat the definition. |
| `related` | Slugs of other terms. A slug that doesn’t exist (yet) is skipped, so you may point to a term that is being written. |
| `links` | Site paths without locale: `'/tools/vma'`, `'/pace-charts'`, `'/features/training-load'`, `'/blog/<slug>'`. The label is the page’s own title (the one on its social card). Use `{ href, label: { en, fr, es, it, 'pt-br', de } }` only when that title reads badly as a link. Only link pages that exist (`ls src/app/[locale]`, `src/content/blog/*/index.ts` for slugs). |
| `sources` | `{ citation, url? }`. Citation: `Authors (year). Title. Journal volume(issue): pages.` Only real sources; `url` only for a DOI/PubMed link you have checked resolves (`curl -sI https://doi.org/<doi>` → 302; `https://api.crossref.org/works/<doi>` gives the exact title and authors). Books have no url. |
| `updatedAt` | ISO date of the last real change to the text. |
| `content` | `{ en: ContentEn, fr: ContentFr, es: ContentEs, it: ContentIt, 'pt-br': ContentPtBr, de: ContentDe }`. |

French strings in `index.ts` need a non-breaking space before `: ; ? !` and inside `« »`: `\u00a0` (or the literal character) in JS strings, `&nbsp;` in JSX text (see below).

### Body (`<locale>.tsx`)

Plain JSX like the blog: `<p>`, `<h2>`, `<ul>`, `<em>`, `<Link>`. No classes; the template applies the prose styles. The template already renders the H1, the definition box, related terms, the links box, sources and the FAQ: don’t repeat them in the body.

Structure (H2s, adapted to the term):

1. An opening paragraph or two: what it is, where it comes from, why people use it (no H2).
2. How it is calculated, with the formula written out in `<Formula>`:
   ```tsx
   import { Formula } from '@/components/learn/formula';
   <Formula where={['HRr = (HR − HRrest) / (HRmax − HRrest)', 'k = 1.92 for men']}>
     TRIMP = minutes × HRr × 0.64 × e^(1.92 × HRr)
   </Formula>
   ```
3. A worked example with real numbers (compute them: `python3 -c …`), in a `<ul>` of steps when there are steps.
4. How to use it in training (concrete sessions: “5 × 4' at threshold”, paces, durations).
5. Limits: what it misses, when it misleads.

500–900 words of substance in English; the other locales are written natively, not translated word for word (FR “vous”, ES “tú”, IT “tu”, PT-BR “você”, DE “du”; km and metric units; local running vocabulary: VMA, fractionné, sortie longue, D+; series, rodaje, tirada larga; ripetute, lungo, medio; tiros, longão, rodagem, planilha; lockerer Dauerlauf, langer Lauf, Intervalle, Hm).

**French typography in JSX text**: write `&nbsp;` before `: ; ? !` and `%`, and inside `« »` (`déjà&nbsp;:`, `12&nbsp;%`), as the blog's French files do. Not the raw U+00A0 character (eslint `no-irregular-whitespace` rejects it), and not `\u00a0`, which is not an escape inside JSX text and would print literally. In JS strings (`index.ts`, `Formula` `where` arrays) use `\u00a0` or the literal U+00A0 character: both pass eslint inside strings.

Internal links: `<Link href="/learn/zone-2">` in `en.tsx`, `<Link href="/fr/learn/zone-2">` in `fr.tsx`, `/es/…`, `/it/…`, `/pt-br/…`, `/de/…` for the others. Link related glossary terms where they come up naturally, and the matching tool or feature.

### Copy rules (short version of the site brief)

- Write like a coach or sports scientist talking to a runner: specific numbers, a named workout, varied sentences, an opinion when it’s earned, uncertainty where the science is uncertain.
- Banned: unlock, empower, seamless, revolutionize, game-changer, elevate, supercharge, harness, leverage, cutting-edge, holistic, “in today’s world”, “whether you’re X or Y”, “let’s dive in”, “it’s important to note”, “in conclusion”, rhetorical questions as openers, triplets everywhere, exclamation marks, em-dash chains, bold all over.
- Never invent a study, figure or quote. Product mentions: at most one short factual paragraph, linking the feature page. Never present Strava as a data source for AI features. Facts about OpenAthlete must match `SCRATCH/research/features.md` and the brief.
- Formulas used by the product must match its code: TRIMP and CTL/ATL in `apps/api/src/modules/core/helpers/training-load.ts` and `apps/api/src/common/constants/training-formulas.constants.ts`; VDOT in `src/lib/pace-charts/vdot.ts`; VMA from the 6-minute test in `src/components/tools/vma-calculator.tsx`.

## Register a term

Add one import line and one array line in `src/content/learn/index.ts` (imports sorted by path, the array in any order):

```ts
import { zone2 } from './zone-2';
…
export const learnTerms: LearnTerm[] = [
  …
  zone2,
];
```

Re-read the file right before editing: another agent may be adding lines at the same time.

## Check

From `apps/website`:

```bash
npx tsc --noEmit 2>&1 | grep -E "content/learn|app/\[locale\]/learn"   # nothing
npx eslint --max-warnings 0 src/content/learn/<slug>
npx prettier --write src/content/learn/<slug>   # only your folder, not index.ts
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003/learn/<slug>      # 200
curl -s http://localhost:3003/fr/learn/<slug> | grep -o "<title>[^<]*</title>"
```

Also check on the page: the hub lists the term in the right group and alphabetical position in each locale, no literal `\u00a0` shows in French, and every link in the “Put it to use” box has a sensible label.
