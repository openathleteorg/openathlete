// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Feature,
  FeatureAccessDto,
  FeatureAccessMap,
} from '@openathlete/shared';

import { FeaturePaywallContext, useLockedSelect } from './feature-paywall';
import { FeatureGate, LockedPanel } from './locks';

const mocks = vi.hoisted(() => ({
  channel: vi.fn<() => 'stripe' | 'app-store' | null>(() => 'stripe'),
  features: undefined as Partial<FeatureAccessMap> | undefined,
  open: vi.fn(),
  capture: vi.fn(),
}));

vi.mock('@/api/subscription', () => ({
  useCurrentSubscription: () => ({
    data: mocks.features ? { features: mocks.features } : undefined,
    isLoading: false,
  }),
}));
vi.mock('@/utils/capacitor', () => ({ purchaseChannel: mocks.channel }));
vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: mocks.capture }),
}));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/dashboard/statistics' }),
}));
vi.mock('../ui/select', () => ({
  SelectItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('@/paraglide/runtime', () => ({ getLocale: () => 'en' }));
vi.mock('@/paraglide/messages', () => {
  const text = (key: string) => () => key;
  return {
    m: new Proxy({}, { get: (_, key: string) => text(key) }),
  };
});

const LOCKED: FeatureAccessDto = {
  available: false,
  reason: 'locked',
  availableToAllOn: null,
};
const OPEN: FeatureAccessDto = {
  available: true,
  reason: 'perk',
  availableToAllOn: null,
};

let container: HTMLDivElement;
let root: Root;

function render(node: React.ReactNode) {
  act(() =>
    root.render(
      <FeaturePaywallContext.Provider value={{ open: mocks.open }}>
        {node}
      </FeaturePaywallContext.Provider>,
    ),
  );
}

beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  mocks.channel.mockReturnValue('stripe');
  mocks.open.mockReset();
  mocks.capture.mockReset();
  window.localStorage.clear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('FeatureGate', () => {
  it('shows the feature to someone who has it', () => {
    mocks.features = { [Feature.LAB]: OPEN };
    render(
      <FeatureGate feature={Feature.LAB} place="test">
        <p>the lab</p>
      </FeatureGate>,
    );
    expect(container.textContent).toBe('the lab');
  });

  it('shows the feature while the rights load: nothing flashes', () => {
    mocks.features = undefined;
    render(
      <FeatureGate feature={Feature.LAB} place="test">
        <p>the lab</p>
      </FeatureGate>,
    );
    expect(container.textContent).toBe('the lab');
  });

  it('shows the panel and opens the paywall only on a click', () => {
    mocks.features = { [Feature.LAB]: LOCKED };
    render(
      <FeatureGate feature={Feature.LAB} place="statistics">
        <p>the lab</p>
      </FeatureGate>,
    );
    expect(container.textContent).not.toContain('the lab');
    expect(container.textContent).toContain('feature_lab_title');
    expect(container.querySelector('[data-supporter-lock]')).not.toBeNull();
    expect(mocks.open).not.toHaveBeenCalled();
    act(() => container.querySelector('button')!.click());
    expect(mocks.open).toHaveBeenCalledWith(Feature.LAB, 'statistics');
    expect(mocks.capture).toHaveBeenCalledWith('supporter_gate_viewed', {
      feature: Feature.LAB,
      place: 'statistics',
    });
  });

  it('hides a locked feature in the Android app, without a word of Supporter', () => {
    mocks.channel.mockReturnValue(null);
    mocks.features = { [Feature.LAB]: LOCKED };
    render(
      <FeatureGate feature={Feature.LAB} place="test">
        <p>the lab</p>
      </FeatureGate>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('gives a Supporter everything in the Android app', () => {
    mocks.channel.mockReturnValue(null);
    mocks.features = { [Feature.LAB]: OPEN };
    render(
      <FeatureGate feature={Feature.LAB} place="test">
        <p>the lab</p>
      </FeatureGate>,
    );
    expect(container.textContent).toBe('the lab');
  });
});

describe('LockedPanel', () => {
  it('stays hidden once dismissed', () => {
    mocks.features = { [Feature.LAB]: LOCKED };
    render(<LockedPanel feature={Feature.LAB} place="overview" dismissible />);
    const close = container.querySelector(
      'button[aria-label="feature_gate_dismiss"]',
    ) as HTMLButtonElement;
    act(() => close.click());
    expect(container.innerHTML).toBe('');
    expect(mocks.capture).toHaveBeenCalledWith('supporter_gate_dismissed', {
      feature: Feature.LAB,
      place: 'overview',
    });
    act(() => root.unmount());
    root = createRoot(container);
    render(<LockedPanel feature={Feature.LAB} place="overview" dismissible />);
    expect(container.innerHTML).toBe('');
  });
});

describe('useLockedSelect', () => {
  function Probe({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) {
    const handle = useLockedSelect('filters', onChange);
    return <button onClick={() => handle(value)}>pick</button>;
  }

  it('passes free values through and opens the paywall for locked ones', () => {
    const onChange = vi.fn();
    render(<Probe value="none" onChange={onChange} />);
    act(() => container.querySelector('button')!.click());
    expect(onChange).toHaveBeenCalledWith('none');

    render(
      <Probe
        value={`locked:${Feature.STATISTICS_COMPARE}:previous`}
        onChange={onChange}
      />,
    );
    act(() => container.querySelector('button')!.click());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(mocks.open).toHaveBeenCalledWith(
      Feature.STATISTICS_COMPARE,
      'filters',
    );
  });
});
