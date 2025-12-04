import { Container } from '@/components/landing/container';
import { m } from '@/paraglide/messages';

export function TopBar() {
  return (
    <div className="bg-primary/5 border-b py-2">
      <Container>
        <p className="text-center text-sm text-muted-foreground">
          {m.landing_topbar()}
        </p>
      </Container>
    </div>
  );
}
