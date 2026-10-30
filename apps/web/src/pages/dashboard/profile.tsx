import { useInstallApp } from '@/components/pwa/use-install-app';
import { SupportReminder } from '@/components/sidebar/support-reminder';
import { SectionLabel } from '@/components/ui/section-label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext, useUserRoles } from '@/contexts/auth';
import { useSpaceContext } from '@/contexts/space';
import { useLanguageSync } from '@/hooks/use-language-sync';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePushPermission } from '@/hooks/use-push-permission';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getPath } from '@/routes/paths';
import { SUPPORTED_LOCALES, getLocaleName } from '@/utils/locales';
import { useSettingsTabs } from '@/views/dashboard/settings-view/use-settings-tabs';
import {
  Bell,
  Bike,
  Bot,
  ChevronRight,
  CreditCard,
  Download,
  Globe,
  Heart,
  LogOut,
  type LucideIcon,
  Mail,
  Moon,
  Plug,
  ShieldUser,
  Sparkles,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { UserRole } from '@openathlete/shared';

const TAB_ICONS: Record<string, LucideIcon> = {
  connectors: Plug,
  profile: UserRound,
  equipment: Bike,
  training_zones: Zap,
  ai: Sparkles,
  agents: Bot,
  athletes: Users,
  coaches: ShieldUser,
  invitations: Mail,
  subscription: CreditCard,
  contribute: Heart,
};

const TRAINING_TABS = [
  'connectors',
  'training_zones',
  'equipment',
  'coaches',
  'athletes',
  'invitations',
];

const Group = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <SectionLabel className="px-1">{title}</SectionLabel>
    <div className="divide-y overflow-hidden rounded-2xl border bg-card">
      {children}
    </div>
  </section>
);

const rowClass =
  'flex min-h-13 w-full items-center gap-3 px-4 py-2.5 text-left text-[0.9375rem] active:bg-accent';

function SettingRow({ tab, label }: { tab: string; label: string }) {
  const Icon = TAB_ICONS[tab];
  return (
    <Link
      to={`${getPath(['dashboard', 'settings'])}?tab=${tab}`}
      data-settings-link={tab}
      className={rowClass}
    >
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
    </Link>
  );
}

/** A setting with a native picker, the best list a phone has for this. */
function PickerRow({
  icon: Icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className={rowClass}>
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <select
        aria-label={label}
        className="max-w-[50%] appearance-none truncate bg-transparent text-right text-muted-foreground outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Whether this device gets notifications; only the apps can. */
function NotificationsRow() {
  const { permission, enable } = usePushPermission();
  if (permission === 'unsupported') return null;
  const status = {
    granted: m.push_status_on(),
    denied: m.push_status_off(),
    prompt: m.push_enable(),
  }[permission];

  return (
    <button
      type="button"
      data-notifications-row
      className={rowClass}
      onClick={() => {
        if (permission === 'prompt') void enable();
        if (permission === 'denied') toast.info(m.push_denied_hint());
      }}
    >
      <Bell className="size-5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{m.notifications()}</span>
      <span className="text-muted-foreground">{status}</span>
    </button>
  );
}

/** The Me tab: who is signed in, and everything that is set up once. */
function MeScreen() {
  const { user, logout } = useAuthContext();
  const roles = useUserRoles();
  const { space, setSpace } = useSpaceContext();
  const { allowedTabs, tabLabels } = useSettingsTabs();
  const { syncLanguage } = useLanguageSync();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const installApp = useInstallApp();
  if (!user) return null;
  const initials = [user.firstName, user.lastName]
    .map((name) => name?.[0] ?? '')
    .join('');
  const trainingTabs = allowedTabs.filter((tab) => TRAINING_TABS.includes(tab));
  const appTabs = allowedTabs.filter(
    (tab) => !TRAINING_TABS.includes(tab) && tab !== 'profile',
  );

  return (
    <div className="space-y-6 px-4 pt-2 pb-6">
      <Link
        to={`${getPath(['dashboard', 'settings'])}?tab=profile`}
        className="flex items-center gap-3 rounded-2xl border bg-card p-4 active:bg-accent"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground uppercase">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold tracking-tight">
            {user.firstName} {user.lastName}
          </span>
          <span className="block text-sm text-muted-foreground">
            {m.me_edit_profile()}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
      </Link>

      {(roles?.length ?? 0) > 1 && (
        <Tabs value={space} onValueChange={(v) => setSpace(v as UserRole)}>
          <TabsList className="h-11 w-full">
            {roles?.map((role) => (
              <TabsTrigger key={role} value={role} className="h-9">
                {role === 'COACH' ? m.coach() : m.athlete()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <Group title={m.me_section_training()}>
        {trainingTabs.map((tab) => (
          <SettingRow key={tab} tab={tab} label={tabLabels[tab]} />
        ))}
      </Group>

      <Group title={m.me_section_app()}>
        {appTabs.map((tab) => (
          <SettingRow key={tab} tab={tab} label={tabLabels[tab]} />
        ))}
        <NotificationsRow />
        <PickerRow
          icon={Globe}
          label={m.language()}
          value={getLocale()}
          onChange={(value) => {
            const locale = SUPPORTED_LOCALES.find((item) => item === value);
            if (locale) void syncLanguage(locale);
          }}
          options={SUPPORTED_LOCALES.map((locale) => ({
            value: locale,
            label: getLocaleName(locale),
          }))}
        />
        <PickerRow
          icon={Moon}
          label={m.theme()}
          value={theme ?? 'system'}
          onChange={setTheme}
          options={[
            { value: 'light', label: m.theme_light() },
            { value: 'dark', label: m.theme_dark() },
            { value: 'system', label: m.theme_system() },
          ]}
        />
        {installApp.available && (
          <button
            type="button"
            className={rowClass}
            onClick={installApp.install}
          >
            <Download className="size-5 shrink-0 text-muted-foreground" />
            {m.pwa_install()}
          </button>
        )}
      </Group>
      {installApp.dialog}

      <SupportReminder />

      <button
        type="button"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border bg-card text-[0.9375rem] font-medium text-destructive-foreground active:bg-accent"
        onClick={() => logout((path) => navigate(path, { replace: true }))}
      >
        <LogOut className="size-5" />
        {m.log_out()}
      </button>
    </div>
  );
}

export function ProfilePage() {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MeScreen />
  ) : (
    <Navigate to={getPath(['dashboard', 'settings'])} replace />
  );
}
