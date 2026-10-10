import './LeafField.css';

const LEAVES = [
  { id: 'a', className: 'leaf-a', fill: '#c45c26', vein: '#8a3414' },
  { id: 'b', className: 'leaf-b', fill: '#e0a04a', vein: '#a86a22' },
  { id: 'c', className: 'leaf-c', fill: '#a33b24', vein: '#6e2416' },
];

function MapleLeaf({ fill, vein }) {
  return (
    <svg viewBox="0 0 64 76" aria-hidden="true">
      <path
        fill={fill}
        d="M32 2l3.2 13.2 14.2-6.4-6.6 13.4 16.6 1.6-15.2 6.6 8.6 14.6-15.2-5.4-2.2 16.4L32 42.2 28.6 56l-2.2-16.4-15.2 5.4 8.6-14.6L4.6 23.8l16.6-1.6-6.6-13.4 14.2 6.4z"
      />
      <path d="M32 54.5v16" stroke={vein} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** At most three maple leaves, drifting down the homepage. */
export function LeafField() {
  return (
    <div className="leaf-field" aria-hidden="true">
      {LEAVES.map((leaf) => (
        <div key={leaf.id} className={`leaf ${leaf.className}`}>
          <MapleLeaf fill={leaf.fill} vein={leaf.vein} />
        </div>
      ))}
    </div>
  );
}
