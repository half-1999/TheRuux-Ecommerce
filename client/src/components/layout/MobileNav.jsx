import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Drawer } from '../ui/Drawer';

const NAV_GROUPS = [
  {
    title: 'Shop',
    links: [
      { to: '/shop', label: 'Shop All' },
      { to: '/new-arrivals', label: 'New Arrivals' },
      { to: '/bestsellers', label: 'Bestsellers' },
      { to: '/shop/shirts', label: 'Shirts' },
      { to: '/shop/t-shirts', label: 'T-Shirts' },
      { to: '/shop/bottoms', label: 'Bottoms' },
      { to: '/shop/sets', label: 'Sets' },
    ],
  },
  {
    title: 'Collections',
    // Spelling: PDF/docs conflict Udbhav vs Uddhav — using Udbhav pending confirmation
    links: [{ to: '/collections/udbhav', label: 'Udbhav' }],
  },
  {
    title: 'The Ruux',
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
      { to: '/contact', label: 'Contact Us' },
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

export function MobileNav({ open, onClose }) {
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu">
      <nav className="px-5 py-6" aria-label="Primary">
        {NAV_GROUPS.map((group, gi) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.05 + gi * 0.04,
              duration: 0.28,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="mb-8"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={onClose}
                    className="block min-h-11 py-2 text-base font-medium text-[var(--color-text)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
        <a
          href={import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com'}
          target="_blank"
          rel="noreferrer"
          className="text-sm uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-muted)]"
        >
          Follow — Instagram
        </a>
      </nav>
    </Drawer>
  );
}
