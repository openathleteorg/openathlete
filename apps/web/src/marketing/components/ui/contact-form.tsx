import { m } from '@/paraglide/messages';
import { FormEvent, useState } from 'react';

interface FieldState {
  value: string;
  error?: string;
}

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState<Record<string, FieldState>>({
    name: { value: '' },
    email: { value: '' },
    goal: { value: '' },
    message: { value: '' },
  });
  const [sent, setSent] = useState(false);

  const update = (key: string, value: string) =>
    setFields((prev) => ({
      ...prev,
      [key]: { value, error: prev[key]?.error },
    }));

  function validate() {
    let ok = true;
    const next = { ...fields };
    if (!fields.name.value) {
      next.name.error = m.mkt_required?.() || 'Required';
      ok = false;
    }
    if (
      !fields.email.value ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email.value)
    ) {
      next.email.error = m.mkt_invalid_email?.() || 'Invalid email';
      ok = false;
    }
    if (!fields.message.value) {
      next.message.error = m.mkt_required?.() || 'Required';
      ok = false;
    }
    setFields(next);
    return ok;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Placeholder: integration endpoint to be implemented
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <p role="status" className="text-sm text-[var(--oa-accent)] font-medium">
        {m.mkt_contact_sent?.() || 'Message sent'}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 max-w-lg">
      <Field
        label={m.mkt_form_name?.() || 'Name'}
        id="name"
        value={fields.name.value}
        error={fields.name.error}
        onChange={(v) => update('name', v)}
      />
      <Field
        label={m.mkt_form_email?.() || 'Email'}
        id="email"
        type="email"
        value={fields.email.value}
        error={fields.email.error}
        onChange={(v) => update('email', v)}
      />
      <Field
        label={m.mkt_form_goal?.() || 'Goal'}
        id="goal"
        value={fields.goal.value}
        onChange={(v) => update('goal', v)}
      />
      <Field
        label={m.mkt_form_message?.() || 'Message'}
        id="message"
        as="textarea"
        rows={5}
        value={fields.message.value}
        error={fields.message.error}
        onChange={(v) => update('message', v)}
      />
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center rounded-md bg-[var(--oa-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--oa-bg)] shadow disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--oa-accent)] ring-offset-[var(--oa-bg)]"
      >
        {submitting
          ? m.mkt_form_sending?.() || 'Sending'
          : m.mkt_form_send?.() || 'Send'}
      </button>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  as?: 'input' | 'textarea';
  rows?: number;
  error?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  as = 'input',
  rows,
  error,
}: FieldProps) {
  const InputTag = as === 'textarea' ? 'textarea' : 'input';
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-wide uppercase text-[var(--oa-muted)]"
      >
        {label}
      </label>
      <InputTag
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        rows={rows}
        type={as === 'input' ? type : undefined}
        className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--oa-fg)] placeholder:text-[var(--oa-muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oa-accent)]"
      />
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          className="text-xs text-[var(--oa-warning)]"
        >
          {error}
        </span>
      )}
    </div>
  );
}
