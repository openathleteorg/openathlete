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
  priceLabel?: string;
  perks: string[];
  highlighted?: boolean;
  badge?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function PricingCard({
  name,
  price,
  priceLabel,
  perks,
  highlighted = false,
  badge,
  onCtaClick,
  className,
}: PricingCardProps) {
  const isFree =
    price.toLowerCase() === 'free' || price.toLowerCase() === 'gratuit';
  const isContact = price === 'Contact us' || price === 'Sur devis';

  return (
    <Card
      className={cn(
        'h-full flex flex-col relative transition-all',
        highlighted && 'border-primary shadow-lg scale-105',
        !highlighted && 'hover:shadow-md',
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
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{price}</span>
            {isFree && (
              <span className="text-sm text-muted-foreground">
                {m.landing_pricing_forever()}
              </span>
            )}
            {priceLabel && !isFree && (
              <span className="text-sm text-muted-foreground">
                {priceLabel}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {perks.map((perk, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary -mt-0.5 font-bold">✓</span>
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
          disabled={isContact}
        >
          {isContact
            ? m.landing_pricing_contact_us()
            : isFree
              ? m.landing_pricing_get_started()
              : m.landing_pricing_get_started()}
        </Button>
      </CardFooter>
    </Card>
  );
}
