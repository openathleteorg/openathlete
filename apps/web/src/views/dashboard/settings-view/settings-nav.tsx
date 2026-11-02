import { SectionLabel } from '@/components/ui/section-label';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { SETTINGS_TAB_ICONS, useSettingsTabs } from './use-settings-tabs';

const tabUrl = (tab: string) =>
  `${getPath(['dashboard', 'settings'])}?tab=${tab}`;

function NavItem({ tab, activeTab }: { tab: string; activeTab: string }) {
  const { tabLabels } = useSettingsTabs();
  const Icon = SETTINGS_TAB_ICONS[tab];
  const active = tab === activeTab;
  return (
    <Link
      to={tabUrl(tab)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{tabLabels[tab]}</span>
    </Link>
  );
}

/** Too narrow for a sidebar next to the page, with the app's own beside it. */
function SettingsStrip({ activeTab }: { activeTab: string }) {
  const { allowedTabs, tabLabels } = useSettingsTabs();
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [activeTab]);

  return (
    <nav
      aria-label={m.settings()}
      className="scrollbar-hide hidden gap-1.5 overflow-x-auto md:flex xl:hidden"
    >
      {allowedTabs.map((tab) => (
        <Link
          key={tab}
          ref={tab === activeTab ? activeRef : undefined}
          to={tabUrl(tab)}
          aria-current={tab === activeTab ? 'page' : undefined}
          className={cn(
            'flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors',
            tab === activeTab
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground',
          )}
        >
          {tabLabels[tab]}
        </Link>
      ))}
    </nav>
  );
}

/** The list of settings on desktop; phones have it in the Me tab. */
export function SettingsNav({ activeTab }: { activeTab: string }) {
  const { user } = useAuthContext();
  const { trainingTabs, appTabs } = useSettingsTabs();
  const initials = [user?.firstName, user?.lastName]
    .map((name) => name?.[0] ?? '')
    .join('');
  const profileActive = activeTab === 'profile';

  return (
    <>
      <SettingsStrip activeTab={activeTab} />
      <nav
        aria-label={m.settings()}
        className="sticky top-8 hidden w-56 shrink-0 space-y-5 xl:block"
      >
        <p className="px-2.5 text-2xl font-semibold tracking-tight">
          {m.settings()}
        </p>
        <Link
          to={tabUrl('profile')}
          aria-current={profileActive ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-lg p-2.5 transition-colors',
            profileActive ? 'bg-accent' : 'hover:bg-accent/60',
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground uppercase">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {m.me_edit_profile()}
            </span>
          </span>
        </Link>
        {[
          { title: m.me_section_training(), tabs: trainingTabs },
          { title: m.me_section_app(), tabs: appTabs },
        ].map((group) => (
          <div key={group.title} className="space-y-1">
            <SectionLabel className="px-2.5 pb-0.5">{group.title}</SectionLabel>
            {group.tabs.map((tab) => (
              <NavItem key={tab} tab={tab} activeTab={activeTab} />
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
