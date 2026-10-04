// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateAccountView } from './create-account-view';

const api = vi.hoisted(() => ({
  createAccount: vi.fn(),
  login: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/api/user/user.api', () => ({
  UserAPI: { createAccount: api.createAccount },
}));
vi.mock('@/api/auth/auth.api', () => ({
  AuthAPI: { login: api.login, verifyInvitation: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { error: api.toastError } }));
vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({ initialize: vi.fn() }),
}));
vi.mock('posthog-js/react', () => ({ usePostHog: () => undefined }));
vi.mock('@/views/auth/oauth-buttons', () => ({ OAuthButtons: () => null }));
// Every message renders as its key.
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const httpError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status, data: {} },
  });

describe('CreateAccountView', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <CreateAccountView />
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const signUp = async () => {
    await act(async () => {
      for (const [name, value] of Object.entries({
        firstName: 'Ana',
        lastName: 'Runner',
        email: 'ana@example.test',
        password: 'long enough password',
      })) {
        const input = container.querySelector<HTMLInputElement>(
          `input[name="${name}"]`,
        )!;
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )!.set!.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await act(async () => {
      container
        .querySelector('form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        );
    });
    // Validation and the requests resolve asynchronously.
    for (
      let tries = 0;
      tries < 100 && !api.toastError.mock.calls.length;
      tries++
    )
      await act(() => new Promise((resolve) => setTimeout(resolve, 5)));
  };

  it('says when the email already has an account', async () => {
    api.createAccount.mockRejectedValue(httpError(409));
    await signUp();
    expect(api.createAccount.mock.calls[0][0]).toMatchObject({
      email: 'ana@example.test',
    });
    expect(api.toastError).toHaveBeenCalledWith('signup_email_exists');
    expect(api.login).not.toHaveBeenCalled();
  });

  it('reports other sign-up failures', async () => {
    api.createAccount.mockRejectedValue(httpError(500));
    await signUp();
    expect(api.toastError).toHaveBeenCalledWith('signup_failed');
  });

  it('reports a failed sign-in after the account is created', async () => {
    api.createAccount.mockResolvedValue({ userId: 1 });
    api.login.mockRejectedValue(httpError(500));
    await signUp();
    expect(api.login).toHaveBeenCalled();
    expect(api.toastError).toHaveBeenCalledWith('signup_login_failed');
  });
});
