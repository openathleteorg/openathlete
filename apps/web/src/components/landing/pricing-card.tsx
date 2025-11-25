import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

interface PricingCardProps {
  name: string;
  price: string;
  perks: string[];
  highlighted?: boolean;
  badge?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function PricingCard({
  name,
  price,
  perks,
  highlighted = false,
  badge,
  onCtaClick,
  className,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        'h-full flex flex-col relative',
        highlighted && 'border-primary shadow-lg',
        className,
      )}
    >
      {badge && (
        <div className="absolute top-0 right-0 m-4 z-10">
          <Badge variant="secondary">{badge}</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{price}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {perks.map((perk, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary -mt-0.5">✓</span>
              <span className="text-sm text-muted-foreground">{perk}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          variant={highlighted ? 'default' : 'outline'}
          className="w-full"
          onClick={onCtaClick}
        >
          {price === 'Contact us' || price === 'Sur devis'
            ? m.landing_pricing_contact_us()
            : m.landing_pricing_get_started()}
        </Button>
      </CardFooter>
    </Card>
  );
}
