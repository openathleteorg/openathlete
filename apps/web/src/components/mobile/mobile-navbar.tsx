import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { Calendar, MessageCircle, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  label: string;
  icon: typeof Calendar;
  path: string;
}

const navItems: NavItem[] = [
  {
    label: m.calendar(),
    icon: Calendar,
    path: getPath(['dashboard', 'calendar']),
  },
  {
    label: m.profile(),
    icon: User,
    path: getPath(['dashboard', 'profile']),
  },
  {
    label: m.messages(),
    icon: MessageCircle,
    path: getPath(['dashboard', 'messages']),
  },
];

export function MobileNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                'flex h-16 flex-col items-center justify-center gap-1 rounded-none',
                isActive && 'bg-muted',
              )}
              onClick={() => navigate(item.path)}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span
                className={cn(
                  'text-xs',
                  isActive
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
