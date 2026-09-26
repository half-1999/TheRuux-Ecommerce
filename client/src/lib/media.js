// Mood imagery from /assets — REPLACE with official TheRuux packshots before launch
import mood1 from '../assets/mood/mood-1.jpg';
import mood2 from '../assets/mood/mood-2.jpg';
import mood3 from '../assets/mood/mood-3.jpg';
import mood4 from '../assets/mood/mood-4.jpg';
import mood5 from '../assets/mood/mood-5.jpg';
import mood6 from '../assets/mood/mood-6.jpg';
import mood7 from '../assets/mood/mood-7.jpg';
import mood8 from '../assets/mood/mood-8.jpg';
import mood9 from '../assets/mood/mood-9.jpg';
import mood10 from '../assets/mood/mood-10.jpg';
import mood11 from '../assets/mood/mood-11.jpg';
import mood12 from '../assets/mood/mood-12.jpg';

export const mood = {
  hero: mood1, // REPLACE: campaign hero poster / video poster
  udbhav: mood2, // REPLACE: Udbhav editorial
  bestsellers: mood3, // REPLACE: bestsellers visual
  categoryShirts: mood4,
  categoryTees: mood5,
  categoryBottoms: mood6,
  categorySets: mood7,
  about: mood8,
  grid: [mood9, mood10, mood11, mood12, mood1, mood2],
};

export const formatInr = (value) => {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
};
