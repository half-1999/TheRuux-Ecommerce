import { useState } from 'react';
import { catalogApi } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Button, Input } from '../ui';

export function NewsletterSection({ copy }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const push = useToastStore((s) => s.push);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await catalogApi.subscribe(email);
      setEmail('');
      push({ title: "You're in.", message: '📬 New drops. New stories.' });
    } catch (err) {
      push({ title: 'Could not subscribe', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="border-y border-[var(--color-border)] bg-[#103020]"
      style={{
        '--color-text': 'var(--color-text-inverse)',
        '--color-text-muted': 'rgba(245, 242, 236, 0.72)',
        '--color-text-subtle': 'rgba(245, 242, 236, 0.58)',
        '--color-border': 'rgba(245, 242, 236, 0.3)',
        '--color-brand': '#d8e0da',
      }}
    >
      <div className="mx-auto flex max-w-[var(--container)] flex-col gap-8 px-[var(--space-header-x)] py-[var(--space-section-y)] md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <h2 className="text-[length:var(--text-2xl)] text-white font-semibold tracking-wide md:text-[length:var(--text-3xl)]">
            {copy?.title || 'STAY IN THE LOOP.'}
          </h2>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            {copy?.body || 'New drops. New stories. No unnecessary emails.'}
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4 sm:flex-row sm:items-end">
          <Input
            label="Email"
            type="email"
            name="newsletter-email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="inverse" loading={loading} className="sm:mb-0.5">
            Join
          </Button>
        </form>
      </div>
    </section>
  );
}
