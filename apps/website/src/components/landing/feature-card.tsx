import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/utils/shadcn';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  icon,
  className,
}: FeatureCardProps) {
  return (
    <Card className={cn('h-full transition-shadow hover:shadow-md', className)}>
      <CardHeader>
        {icon && <div className="mb-2">{icon}</div>}
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
