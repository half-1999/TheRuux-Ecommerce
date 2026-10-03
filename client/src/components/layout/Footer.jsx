import { Link } from 'react-router-dom';

const FOOTER_COLUMNS = [
  {
    title: 'Shop',
    links: [
      { to: '/shop', label: 'Shop All' },
      { to: '/new-arrivals', label: 'New Arrivals' },
      { to: '/bestsellers', label: 'Bestsellers' },
      { to: '/collections/udbhav', label: 'Udbhav' },
    ],
  },
  {
    title: 'TheRuux',
    links: [
      { to: '/about', label: 'About Us' },
      { to: '/our-story', label: 'Our Story' },
    ],
  },
  {
    title: 'Help',
    links: [
      { to: '/help/size-guide', label: 'Size Guide' },
      { to: '/help/shipping', label: 'Shipping & Delivery' },
      { to: '/help/returns', label: 'Returns & Exchanges' },
      { to: '/help/faqs', label: 'FAQs' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/account', label: 'My Account' },
      { to: '/account/orders', label: 'Orders' },
      { to: '/account/wishlist', label: 'Wishlist' },
      { to: '/auth/login', label: 'Sign In' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] py-[var(--space-section-y)]">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <img src="/brand/logo.png" alt="TheRuux" className="h-35 w-auto object-contain" />
            <p
              className="mt-4 font-[family-name:var(--font-script)] text-4xl text-[var(--color-brand)] md:text-5xl"
              aria-label="Beyond Boundaries"
            >
              Beyond Boundaries.
            </p>
          </div>
          <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
            Minimal on the surface. Personality in the details.
          </p>
        </div>

        <div className="hidden gap-10 md:grid md:grid-cols-4 lg:grid-cols-5">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
              Follow
            </p>
            <a
              href={import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com'}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Instagram
            </a>
          </div>
        </div>

        {/* Mobile accordion-style stacked groups */}
        <div className="space-y-6 md:hidden">
          {FOOTER_COLUMNS.map((col) => (
            <details key={col.title} className="group border-b border-[var(--color-border)] pb-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)]">
                {col.title}
                <span className="text-[var(--color-text-subtle)] group-open:hidden">+</span>
                <span className="hidden text-[var(--color-text-subtle)] group-open:inline">−</span>
              </summary>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="block py-1 text-sm text-[var(--color-text-muted)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-text-subtle)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p>© {new Date().getFullYear()} TheRuux. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/legal/privacy">Privacy</Link>
              <Link to="/legal/terms">Terms</Link>
            </div>
          </div>
          <a
            href="https://thestackguy.in"
            target="_blank"
            rel="noreferrer"
            className="self-end text-right transition-colors hover:text-[var(--color-text)] md:self-auto"
          >
            Designed and Developed By{' '}
            <span className="font-bold text-[var(--color-text)]">The Stack Guy</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
