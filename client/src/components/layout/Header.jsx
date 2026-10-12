// import { useEffect, useState } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { BagSimple, List, MagnifyingGlass, User, X } from '@phosphor-icons/react';
// import { motion } from 'framer-motion';
// import { IconButton } from '../ui/IconButton';
// import { useUiStore } from '../../store/uiStore';
// import { useCartStore } from '../../store/cartStore';
// import { MobileNav } from './MobileNav';
// import { useCart } from '../../hooks/useCart';

// export function Header() {
//   const { pathname } = useLocation();
//   const navigate = useNavigate();
//   const isHome = pathname === '/';
//   const [scrolled, setScrolled] = useState(false);

//   const menuOpen = useUiStore((s) => s.menuOpen);
//   const toggleMenu = useUiStore((s) => s.toggleMenu);
//   const closeMenu = useUiStore((s) => s.closeMenu);
//   const openCart = useUiStore((s) => s.openCart);
//   const itemCount = useCartStore((s) => s.itemCount);

//   useCart();

//   useEffect(() => {
//     const onScroll = () => {
//       const threshold = isHome ? window.innerHeight * 0.85 : 24;
//       setScrolled(window.scrollY > threshold);
//     };

//     onScroll();
//     window.addEventListener('scroll', onScroll, { passive: true });

//     return () => window.removeEventListener('scroll', onScroll);
//   }, [isHome]);

//   useEffect(() => {
//     closeMenu();
//   }, [pathname, closeMenu]);

//   const overHero = isHome && !scrolled;
//   const inverted = overHero;

//   return (
//     <>
//       <header
//         className={[
//           'fixed inset-x-0 top-0 z-[var(--z-header)]',
//           'transition-[background-color,color,backdrop-filter,border-color]',
//           'duration-[var(--dur-mid)] ease-[var(--ease-editorial)]',
//           'h-[var(--header-height)]',
//           scrolled || !isHome
//             ? 'border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] text-[var(--color-text)] backdrop-blur-md'
//             : 'border-b border-transparent bg-transparent text-[var(--color-text-inverse)]',
//         ].join(' ')}
//       >
//         <div className="mx-auto grid h-full max-w-[var(--container)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-[var(--space-header-x)] md:gap-4">
//           <div className="flex min-w-0 items-center gap-1 md:gap-3">
//             <IconButton
//               label={menuOpen ? 'Close menu' : 'Open menu'}
//               inverted={inverted}
//               onClick={toggleMenu}
//               aria-expanded={menuOpen}
//             >
//               <motion.span
//                 initial={false}
//                 animate={{ rotate: menuOpen ? 90 : 0 }}
//                 transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
//                 className="inline-flex"
//               >
//                 {menuOpen ? <X size={22} weight="light" /> : <List size={22} weight="light" />}
//               </motion.span>
//             </IconButton>

//             <form
//               className="flex min-w-0 flex-1 items-center gap-2 border-b border-current/35"
//               onSubmit={(event) => {
//                 event.preventDefault();
//                 const value = String(new window.FormData(event.currentTarget).get('q') || '').trim();
//                 navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
//               }}
//             >
//               <MagnifyingGlass size={16} weight="light" className="shrink-0 opacity-80" aria-hidden="true" />
//               <label htmlFor="header-search" className="sr-only">
//                 Search
//               </label>
//               <input
//                 id="header-search"
//                 name="q"
//                 type="search"
//                 placeholder="Search"
//                 className="min-w-0 w-full bg-transparent py-1.5 text-sm text-inherit outline-none placeholder:text-current/60"
//               />
//             </form>
//           </div>

//           <Link to="/" className="justify-self-center px-1" aria-label="TheRuux home">
//             <img
//               src="/brand/logo.png"
//               alt="TheRuux"
//               className={[
//                 'h-[calc(var(--header-height)-1.15rem)] w-auto max-w-[42vw] object-contain',
//                 'transition-[filter] duration-[var(--dur-mid)]',
//                 inverted ? 'brightness-0 invert' : '',
//               ].join(' ')}
//             />
//           </Link>

//           <div className={['flex items-center justify-self-end', menuOpen ? 'hidden md:flex' : 'flex'].join(' ')}>
//             <IconButton label="Bag" inverted={inverted} badge={itemCount} onClick={openCart}>
//               <BagSimple size={22} weight="light" />
//             </IconButton>
//             <Link to="/account">
//               <IconButton label="Account" inverted={inverted}>
//                 <User size={22} weight="light" />
//               </IconButton>
//             </Link>
//           </div>
//         </div>
//       </header>

//       <MobileNav open={menuOpen} onClose={closeMenu} />
//     </>
//   );
// }

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BagSimple,
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

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  const menuOpen = useUiStore((s) => s.menuOpen);
  const toggleMenu = useUiStore((s) => s.toggleMenu);
  const closeMenu = useUiStore((s) => s.closeMenu);
  const openCart = useUiStore((s) => s.openCart);
  const itemCount = useCartStore((s) => s.itemCount);

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
          'transition-[background-color,color,backdrop-filter,border-color]',
          'duration-[var(--dur-mid)] ease-[var(--ease-editorial)]',
          'h-25',
          scrolled || !isHome
            ? 'border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] text-[var(--color-text)] backdrop-blur-md'
            : 'border-b border-transparent bg-transparent text-[var(--color-text-inverse)]',
        ].join(' ')}
      >
        <div className="mx-auto grid h-full max-w-[var(--container)] grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 sm:px-3 md:gap-3 lg:px-4">

          {/* Left: menu */}
          <div className="flex min-w-0 items-center justify-self-start">
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

          {/* Center: logo */}
          <Link
            to="/"
            className="justify-self-center px-0"
            aria-label="TheRuux home"
          >
            <img
              src="/brand/logo.png"
              alt="TheRuux"
              className={[
                'h-10',
                'w-auto  object-contain',
                'transition-[filter] duration-[var(--dur-mid)]',
                inverted ? 'brightness-0 invert' : '',
              ].join(' ')}
            />
          </Link>

          {/* Right: search, cart and account */}
          <div
            className={[
              'flex items-center justify-self-end',
              'gap-0 sm:gap-1',
              menuOpen ? 'hidden md:flex' : 'flex',
            ].join(' ')}
          >
            <IconButton
              label="Search"
              inverted={inverted}
              onClick={() => navigate('/search')}
            >
              <MagnifyingGlass size={22} weight="light" />
            </IconButton>

            <IconButton
              label="Bag"
              inverted={inverted}
              badge={itemCount}
              onClick={openCart}
            >
              <BagSimple size={22} weight="light" />
            </IconButton>

            <Link to="/account" aria-label="Account">
              <IconButton label="Account" inverted={inverted}>
                <User size={22} weight="light" />
              </IconButton>
            </Link>
          </div>
        </div>
      </header>

      <MobileNav open={menuOpen} onClose={closeMenu} />
    </>
  );
}