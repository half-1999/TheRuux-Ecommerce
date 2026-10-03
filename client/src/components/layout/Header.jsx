import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BagSimple,
  Heart,
  List,
  MagnifyingGlass,
  User,
  X,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { IconButton } from '../ui/IconButton';
import { useUiStore } from '../../store/uiStore';
import { useCartStore } from '../../store/cartStore';
import { MobileNav } from './MobileNav';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';

export function Header() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  const menuOpen = useUiStore((s) => s.menuOpen);
  const toggleMenu = useUiStore((s) => s.toggleMenu);
  const closeMenu = useUiStore((s) => s.closeMenu);
  const openCart = useUiStore((s) => s.openCart);
  const openSearch = useUiStore((s) => s.openSearch);
  const itemCount = useCartStore((s) => s.itemCount);
  const { data: wishlist } = useWishlist();
  const wishlistCount = wishlist?.items?.length || 0;

  useCart();

  useEffect(() => {
    const onScroll = () => {
      const threshold = isHome ? window.innerHeight * 0.85 : 24;
      setScrolled(window.scrollY > threshold);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  const overHero = isHome && !scrolled;
  const inverted = overHero;

  return (
    <>
      <header
        className={[
          'fixed inset-x-0 top-0 z-[var(--z-header)]',
          'transition-[background-color,color,backdrop-filter,border-color,height]',
          'duration-[var(--dur-mid)] ease-[var(--ease-editorial)]',

          scrolled || !isHome
            ? 'border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] text-[var(--color-text)] backdrop-blur-md'
            : 'border-b border-transparent bg-transparent text-[var(--color-text-inverse)]',

          // Header height
          'h-[7rem] md:h-[9rem]',
        ].join(' ')}
      >
        <div
          className="
            mx-auto grid
            h-full
            max-w-[var(--container)]
            grid-cols-[1fr_auto_1fr]
            items-center
            px-[var(--space-header-x)]
          "
        >
          {/* LEFT */}
          <div className="justify-self-start">
            <IconButton
              label={menuOpen ? 'Close menu' : 'Open menu'}
              inverted={inverted}
              onClick={toggleMenu}
              aria-expanded={menuOpen}
            >
              <motion.span
                initial={false}
                animate={{ rotate: menuOpen ? 90 : 0 }}
                transition={{
                  duration: 0.28,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="inline-flex"
              >
                {menuOpen ? (
                  <X size={22} weight="light" />
                ) : (
                  <List size={22} weight="light" />
                )}
              </motion.span>
            </IconButton>
          </div>

          {/* LOGO */}
          <Link
            to="/"
            className="justify-self-center"
            aria-label="TheRuux home"
          >
            <img
              src="/brand/logo.png"
              alt="TheRuux"
              className={[
                'h-24 md:h-32 w-auto object-contain',
                'transition-[filter] duration-[var(--dur-mid)]',
                inverted ? 'brightness-0 invert' : '',
              ].join(' ')}
            />
          </Link>

          {/* RIGHT ICONS */}
          <div
            className={[
              'flex items-center justify-self-end gap-0.5',
              // Hide right icons on mobile when menu is open
              menuOpen
                ? 'hidden md:flex'
                : 'flex',
            ].join(' ')}
          >
            <IconButton
              label="Search"
              inverted={inverted}
              onClick={openSearch}
            >
              <MagnifyingGlass size={22} weight="light" />
            </IconButton>

            <Link to="/account/wishlist">
              <IconButton label="Wishlist" inverted={inverted} badge={wishlistCount}>
                <Heart size={22} weight="light" />
              </IconButton>
            </Link>

            <Link to="/account">
              <IconButton label="Account" inverted={inverted}>
                <User size={22} weight="light" />
              </IconButton>
            </Link>

            <IconButton
              label="Bag"
              inverted={inverted}
              badge={itemCount}
              onClick={openCart}
            >
              <BagSimple size={22} weight="light" />
            </IconButton>
          </div>
        </div>
      </header>

      <MobileNav open={menuOpen} onClose={closeMenu} />
    </>
  );
}
