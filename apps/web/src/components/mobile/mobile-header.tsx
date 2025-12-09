import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePageActions } from '@/hooks/use-page-actions';
import { getPath } from '@/routes/paths';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

/**
 * Check if current route is a profile sub-page (statistics, records, metrics)
 */
function isProfileSubPage(pathname: string): boolean {
  const profileSubPages = [
    getPath(['dashboard', 'statistics']),
    getPath(['dashboard', 'records']),
    getPath(['dashboard', 'metrics']),
  ];
  return profileSubPages.some((route) => pathname === route);
}

export function MobileHeader({ title, showBack, onBack }: MobileHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const actions = usePageActions();

  // Auto-detect if we should show back button
  const shouldShowBack = showBack ?? isProfileSubPage(location.pathname);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(getPath(['dashboard', 'profile']));
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background px-4">
      {shouldShowBack ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Button>
      ) : (
        <SidebarTrigger className="h-9 w-9" />
      )}

      {/* Title */}
      <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>

      {/* Actions Menu */}
      {actions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">Page actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action, index) => (
              <DropdownMenuItem
                key={index}
                onClick={action.onClick}
                className={
                  action.variant === 'destructive' ? 'text-destructive' : ''
                }
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
