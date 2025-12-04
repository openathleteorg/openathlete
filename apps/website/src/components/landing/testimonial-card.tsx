import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/shadcn';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  role,
  className,
}: TestimonialCardProps) {
  const initials = author
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className={cn('h-full', className)}>
      <CardContent>
        <blockquote className="text-muted-foreground italic text-sm leading-relaxed mb-6">
          "{quote}"
        </blockquote>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">{author}</div>
            <div className="text-muted-foreground text-xs">{role}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
