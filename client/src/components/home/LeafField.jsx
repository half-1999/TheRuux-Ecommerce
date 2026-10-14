import './LeafField.css';

/** Two leaf silhouettes: a lanceolate (willow-like) and an ovate (beech-like) blade. */
const SHAPES = {
  lance: {
    blade: 'M20 2C27 14 31 30 29 46C27.5 58 23.5 68 20 76C16.5 68 12.5 58 11 46C9 30 13 14 20 2Z',
    veins: ['M20 20L26 14', 'M20 20L14 14', 'M20 32L27.5 25', 'M20 32L12.5 25', 'M20 44L28 38', 'M20 44L12 38', 'M20 56L26 51', 'M20 56L14 51'],
  },
  ovate: {
    blade: 'M20 4C31 12 37 26 36 42C35 56 28 66 20 74C12 66 5 56 4 42C3 26 9 12 20 4Z',
    veins: ['M20 22L29 15', 'M20 22L11 15', 'M20 34L32 27', 'M20 34L8 27', 'M20 46L32 41', 'M20 46L8 41', 'M20 58L28 54', 'M20 58L12 54'],
  },
};

const LEAVES = [
  { shape: 'lance', fill: '#4f6b3f', vein: '#2f4426' },
  { shape: 'ovate', fill: '#b98a3e', vein: '#7a5622' },
  { shape: 'lance', fill: '#6f7f45', vein: '#43502a' },
  { shape: 'ovate', fill: '#3f5a3a', vein: '#263a24' },
  { shape: 'lance', fill: '#a8743a', vein: '#6c4620' },
  { shape: 'ovate', fill: '#5d7448', vein: '#38482b' },
];

function Leaf({ shape, fill, vein }) {
  const { blade, veins } = SHAPES[shape];
  return (
    <svg viewBox="0 0 40 92" aria-hidden="true">
      <path d={blade} fill={fill} />
      {/* Midrib runs into the petiole (stem) below the blade. */}
      <path d="M20 6V90" stroke={vein} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d={veins.join('')} stroke={vein} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.75" />
    </svg>
  );
}

/** A few botanical leaves drifting down the homepage. Decorative only. */
export function LeafField() {
  return (
    <div className="leaf-field" aria-hidden="true">
      {LEAVES.map((leaf, i) => (
        <div key={i} className={`leaf leaf-${i + 1}`}>
          <div className="leaf-sway">
            <Leaf {...leaf} />
          </div>
        </div>
      ))}
    </div>
  );
}
