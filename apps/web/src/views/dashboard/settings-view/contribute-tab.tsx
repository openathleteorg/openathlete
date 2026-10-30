import { useCurrentSubscription } from '@/api/subscription';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { purchaseChannel } from '@/utils/capacitor';
import { BUY_ME_A_COFFEE_URL } from '@/utils/support-reminder';
import { Coffee, ExternalLink, Github } from 'lucide-react';

import { SettingsPanel, SettingsRow } from './settings-section';

const GITHUB_REPO_URL = 'https://github.com/openathleteorg/openathlete';

export function ContributeTab() {
  // Store rules: donations outside the app's own in-app purchase are refused
  // in the iOS app, and the Android app points to no payment
  const hideFinancialSupport = purchaseChannel() !== 'stripe';
  // The hosted instance asks for support through Supporter: the coffee is
  // only a footnote there, and the main ask on self-hosted instances
  const { data: subscription } = useCurrentSubscription();
  const coffeeAsCard =
    !hideFinancialSupport && subscription?.billingEnabled === false;
  const coffeeAsLink =
    !hideFinancialSupport && subscription?.billingEnabled === true;

  return (
    <div className="space-y-4">
      <p className="px-1 text-sm text-muted-foreground">
        {!coffeeAsCard
          ? m.contribute_tab_description_ios()
          : m.contribute_tab_description()}
      </p>
      <SettingsPanel>
        {coffeeAsCard && (
          <SettingsRow
            stacked
            leading={<Coffee className="size-5" />}
            title={m.support_the_project()}
            description={m.support_the_project_description()}
          >
            <Button asChild>
              <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noreferrer">
                {m.buy_me_a_coffee()} <ExternalLink className="size-4" />
              </a>
            </Button>
          </SettingsRow>
        )}
        <SettingsRow
          stacked
          leading={<Github className="size-5" />}
          title={m.contribute_on_github()}
          description={m.contribute_on_github_description()}
        >
          <Button variant="outline" asChild>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
              {m.open_github()} <ExternalLink className="size-4" />
            </a>
          </Button>
        </SettingsRow>
      </SettingsPanel>

      {coffeeAsLink && (
        <p className="px-1 text-sm text-muted-foreground">
          {m.contribute_coffee_prompt()}{' '}
          <a
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline hover:text-foreground"
          >
            {m.buy_me_a_coffee()} <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      )}
    </div>
  );
}
