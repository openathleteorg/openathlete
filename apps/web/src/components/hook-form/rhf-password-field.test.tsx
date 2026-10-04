// @vitest-environment jsdom
import { type ComponentProps, act, useEffect } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FormProvider } from './form-provider';
import { RHFPasswordField } from './rhf-password-field';

vi.mock('@/paraglide/messages', () => ({
  m: {
    show_password: () => 'Show password',
    hide_password: () => 'Hide password',
  },
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type Values = { password: string };

function Form({
  onSubmit,
  error,
  ...field
}: {
  onSubmit: (values: Values) => void;
  error?: string;
} & Partial<ComponentProps<typeof RHFPasswordField>>) {
  const methods = useForm<Values>({ defaultValues: { password: '' } });
  useEffect(() => {
    if (error) methods.setError('password', { message: error });
  }, [error, methods]);
  return (
    <FormProvider
      methods={methods}
      onSubmit={methods.handleSubmit((values) => onSubmit(values))}
    >
      <RHFPasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        required
        {...field}
      />
      <button type="submit">Send</button>
    </FormProvider>
  );
}

describe('RHFPasswordField', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const mount = (props: ComponentProps<typeof Form>) =>
    act(async () => root.render(<Form {...props} />));
  const input = () => container.querySelector('input')!;
  const toggle = () =>
    container.querySelector<HTMLButtonElement>('button[aria-controls]')!;
  const click = (element: HTMLElement) => act(async () => element.click());
  const type = (value: string) =>
    act(async () => {
      // React tracks the value through the native setter.
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input(), value);
      input().dispatchEvent(new Event('input', { bubbles: true }));
    });

  it('hides the password by default and labels the field', async () => {
    await mount({ onSubmit: vi.fn() });
    expect(input().type).toBe('password');
    expect(input().autocomplete).toBe('new-password');
    expect(container.querySelector('label')!.htmlFor).toBe(input().id);
    expect(toggle().type).toBe('button');
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
    expect(toggle().getAttribute('aria-label')).toBe('Show password');
    expect(toggle().getAttribute('aria-controls')).toBe(input().id);
  });

  it('shows and hides what was typed without submitting the form', async () => {
    const onSubmit = vi.fn();
    await mount({ onSubmit });
    await type('secret-123');

    await click(toggle());
    expect(input().type).toBe('text');
    expect(input().value).toBe('secret-123');
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
    expect(toggle().getAttribute('aria-label')).toBe('Hide password');

    await click(toggle());
    expect(input().type).toBe('password');
    expect(input().value).toBe('secret-123');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the focus in the field when the button is pressed', async () => {
    await mount({ onSubmit: vi.fn() });
    const press = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    await act(async () => {
      toggle().dispatchEvent(press);
    });
    expect(press.defaultPrevented).toBe(true);
  });

  it('submits the typed password, visible or not', async () => {
    const onSubmit = vi.fn();
    await mount({ onSubmit });
    await type('secret-123');
    await click(toggle());
    await click(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!,
    );
    expect(onSubmit).toHaveBeenCalledWith({ password: 'secret-123' });
  });

  it('shows the validation message under the field', async () => {
    await mount({ onSubmit: vi.fn(), error: 'Too short' });
    expect(container.querySelector('[role="alert"]')!.textContent).toBe(
      'Too short',
    );
    expect(input().getAttribute('aria-invalid')).toBe('true');
    // The button still belongs to the input, not to the message below it.
    expect(toggle().parentElement).toBe(input().parentElement);
  });

  it('uses a custom id for the label and the button', async () => {
    await mount({ onSubmit: vi.fn(), id: 'login-password' });
    expect(input().id).toBe('login-password');
    expect(container.querySelector('label')!.htmlFor).toBe('login-password');
    expect(toggle().getAttribute('aria-controls')).toBe('login-password');
  });
});
