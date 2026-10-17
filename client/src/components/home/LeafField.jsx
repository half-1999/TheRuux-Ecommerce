import './LeafField.css';
import amber from '../../assets/leaves/leaf-amber.png';
import red from '../../assets/leaves/leaf-red.png';
import gold from '../../assets/leaves/leaf-gold.png';

/** The three supplied maple leaves, repeated so a few are always in the air. */
const LEAVES = [amber, red, gold, amber, gold, red];

/** Photographic maple leaves drifting down the homepage. Decorative only. */
export function LeafField() {
  return (
    <div className="leaf-field" aria-hidden="true">
      {LEAVES.map((src, i) => (
        <div key={i} className={`leaf leaf-${i + 1}`}>
          <div className="leaf-sway">
            <img src={src} alt="" />
          </div>
        </div>
      ))}
    </div>
  );
}
