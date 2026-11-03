import { PROVIDERS } from '@/components/site/providers';
import { MCP_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import {
  ArrowUp,
  AtSign,
  Check,
  ChevronDown,
  Eye,
  PenLine,
  Plus,
  ToggleRight,
} from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import type { GuideBrand } from './brands';

/*
 * Small drawings of the screens each setup step goes through. They are
 * built in code, not screenshots: Claude's and ChatGPT's own screens change
 * too often, so these only show the fields that matter. Labels of the
 * third-party screens stay in English, as in the guide's text.
 */

function Frame({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_48px_-28px_rgb(5_12_52/0.35)]',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-paper/70 px-3.5 py-2.5">
        <span className="size-2 rounded-full bg-ink/15" />
        <span className="size-2 rounded-full bg-ink/15" />
        <span className="size-2 rounded-full bg-ink/15" />
        <span className="ml-2 truncate font-mono text-[0.68rem] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  focus,
}: {
  label?: string;
  value: string;
  mono?: boolean;
  focus?: boolean;
}) {
  return (
    <div>
      {label && (
        <p className="text-[0.7rem] font-medium text-muted-foreground">
          {label}
        </p>
      )}
      <p
        className={cn(
          'mt-1 truncate rounded-lg border bg-white px-3 py-2 text-[0.8rem]',
          mono && 'font-mono text-[0.74rem]',
          focus ? 'border-sky ring-2 ring-sky/25' : 'border-border',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function SignupMock() {
  return (
    <Frame label="app.openathlete.org/auth/create-account">
      <div className="mx-auto grid max-w-[18rem] gap-3">
        <p className="text-center text-[0.95rem] font-semibold">OpenAthlete</p>
        <Field value="lea.martin@example.com" />
        <Field value="••••••••••••" />
        <p className="mt-1 rounded-full bg-ink py-2 text-center text-[0.8rem] font-medium text-white">
          {m.aig_step1_cta()}
        </p>
      </div>
    </Frame>
  );
}

const HISTORY: Record<string, () => string> = {
  garmin: m.aig_step2_history_30,
  coros: m.aig_step2_history_all,
  suunto: m.aig_step2_history_30,
  polar: m.aig_step2_history_none,
  strava: m.aig_step2_history_all,
};

export function ConnectorsMock() {
  return (
    <Frame label={m.aig_step2_mock_title()}>
      <ul className="divide-y divide-border">
        {PROVIDERS.map((provider, index) => (
          <li
            key={provider.slug}
            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="grid h-8 w-20 shrink-0 place-items-start">
              <Image
                src={provider.logo}
                alt=""
                width={provider.width}
                height={120}
                className="h-4 w-auto max-w-20 object-contain"
              />
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-[0.68rem] text-muted-foreground">
              {HISTORY[provider.slug]()}
            </span>
            {index === 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-mint/20 px-2.5 py-1 text-[0.7rem] font-medium text-mint-strong">
                <Check className="size-3" />
                {m.aig_step2_connected()}
              </span>
            ) : (
              <span className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] font-medium">
                {m.aig_step2_connect()}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function ClaudeConnectorMock() {
  return (
    <Frame label="claude.ai · Customize › Connectors">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[0.9rem] font-semibold">Add custom connector</p>
          <span className="flex items-center gap-1 rounded-full bg-[#d97757]/15 px-2 py-0.5 text-[0.65rem] font-medium text-[#b4532f]">
            <Plus className="size-3" /> Add
          </span>
        </div>
        <Field label="Name" value="OpenAthlete" />
        <Field label="Remote MCP server URL" value={MCP_URL} mono focus />
        <div className="mt-1 flex justify-end gap-2 text-[0.75rem]">
          <span className="rounded-full border border-border px-3 py-1.5">
            Cancel
          </span>
          <span className="rounded-full bg-[#d97757] px-3 py-1.5 font-medium text-white">
            Continue
          </span>
        </div>
      </div>
    </Frame>
  );
}

export function ChatGptServerMock() {
  return (
    <Frame label="chatgpt.com · Plugins">
      <div className="grid gap-3">
        <p className="text-[0.9rem] font-semibold">Add custom MCP server</p>
        <Field label="Name" value="OpenAthlete" />
        <Field label="Connection · URL" value={MCP_URL} mono focus />
        <div>
          <p className="text-[0.7rem] font-medium text-muted-foreground">
            Authentication
          </p>
          <p className="mt-1 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[0.8rem]">
            OAuth <ChevronDown className="size-3.5 text-muted-foreground" />
          </p>
        </div>
        <p className="flex items-center gap-2 text-[0.72rem]">
          <span className="grid size-4 place-items-center rounded bg-ink text-white">
            <Check className="size-3" />
          </span>
          I understand and want to continue
        </p>
        <p className="justify-self-end rounded-full bg-ink px-3 py-1.5 text-[0.75rem] font-medium text-white">
          Create as a plugin
        </p>
      </div>
    </Frame>
  );
}

export function ConsentMock({ brand }: { brand: GuideBrand }) {
  return (
    <Frame label="app.openathlete.org/oauth/authorize">
      <div className="mx-auto grid max-w-[22rem] gap-3">
        <p className="text-[0.92rem] leading-snug font-semibold">
          {m.aig_consent_title({ ai: brand.name })}
        </p>
        <p className="text-[0.72rem] text-muted-foreground">
          {m.aig_consent_can()}
        </p>
        <ul className="grid gap-2 text-[0.76rem] leading-snug">
          <li className="flex gap-2">
            <Eye className="mt-0.5 size-3.5 shrink-0 text-sky-strong" />
            {m.aig_consent_read()}
          </li>
          <li className="flex gap-2">
            <PenLine className="mt-0.5 size-3.5 shrink-0 text-coral-strong" />
            {m.aig_consent_write()}
          </li>
        </ul>
        <div className="mt-1 grid grid-cols-2 gap-2 text-center text-[0.78rem]">
          <span className="rounded-full border border-border py-1.5">
            {m.aig_consent_deny()}
          </span>
          <span className="rounded-full bg-ink py-1.5 font-medium text-white">
            {m.aig_consent_allow()}
          </span>
        </div>
      </div>
    </Frame>
  );
}

export function FirstPromptMock({ brand }: { brand: GuideBrand }) {
  const claude = brand.id === 'claude';
  return (
    <Frame label={claude ? 'claude.ai' : 'chatgpt.com'}>
      <div className="grid gap-3">
        <div className="rounded-xl border border-border p-3">
          <p className="text-[0.8rem] leading-relaxed">
            {!claude && (
              <span className="mr-1 rounded bg-sky/15 px-1 font-medium text-sky-strong">
                @OpenAthlete
              </span>
            )}
            {m.aig_first_prompt()}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {claude ? (
                <Plus className="size-4" />
              ) : (
                <AtSign className="size-4" />
              )}
            </span>
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full text-white',
                claude ? 'bg-[#d97757]' : 'bg-ink',
              )}
            >
              <ArrowUp className="size-3.5" />
            </span>
          </div>
        </div>
        {claude && (
          <div className="ml-1 w-52 rounded-xl border border-border bg-white p-2 text-[0.74rem] shadow-sm">
            <p className="px-1.5 pb-1 text-[0.65rem] text-muted-foreground">
              Connectors
            </p>
            <p className="flex items-center justify-between rounded-lg bg-paper px-1.5 py-1">
              OpenAthlete
              <ToggleRight className="size-5 text-[#d97757]" />
            </p>
          </div>
        )}
      </div>
    </Frame>
  );
}
