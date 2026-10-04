// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginView } from './login-view';

const api = vi.hoisted(() => ({
  login: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/api/auth/auth.api', () => ({
  AuthAPI: { login: api.login },
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

describe('LoginView', () => {
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
            <LoginView />
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const logIn = async () => {
    await act(async () => {
      for (const [name, value] of Object.entries({
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
    // Validation and the request resolve asynchronously.
    for (
      let tries = 0;
      tries < 100 && !api.toastError.mock.calls.length;
      tries++
    )
      await act(() => new Promise((resolve) => setTimeout(resolve, 5)));
  };

  it('says when the email or password is wrong', async () => {
    api.login.mockRejectedValue(httpError(401));
    await logIn();
    expect(api.login.mock.calls[0][0]).toEqual({
      email: 'ana@example.test',
      password: 'long enough password',
    });
    expect(api.toastError).toHaveBeenCalledWith('login_invalid_credentials');
  });

  it('asks to wait after too many attempts', async () => {
    api.login.mockRejectedValue(httpError(429));
    await logIn();
    expect(api.toastError).toHaveBeenCalledWith('login_too_many_attempts');
  });

  it.each([
    ['a server error', httpError(500)],
    ['no connection', new Error('Network Error')],
  ])('reports other failures (%s)', async (_case, error) => {
    api.login.mockRejectedValue(error);
    await logIn();
    expect(api.toastError).toHaveBeenCalledWith('login_failed');
  });
});
