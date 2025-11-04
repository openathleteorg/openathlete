import { cn } from '@/utils/shadcn';

interface StepItemProps {
  step: number;
  title: string;
  description: string;
  className?: string;
}

export function StepItem({ step, title, description, className }: StepItemProps) {
  return (
    <div className={cn('flex gap-4', className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
        {step}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

