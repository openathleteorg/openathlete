import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/utils/shadcn';
import { ReactNode } from 'react';

type SettingsSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function SettingsSection({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: SettingsSectionProps) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="gap-4 border-b border-border/40 pb-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action ? (
          <div className="flex flex-shrink-0 items-center sm:pt-1">
            {action}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
