import { useState } from 'react';
import dummy from '../../assets/size/black-dummy-female.png';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const ROWS = [
  { id: 'waist', label: 'Waist', values: ['28', '30', '32', '34', '36'] },
  { id: 'hip', label: 'Hip', values: ['42', '44', '46', '48', '50'] },
  { id: 'frontRise', label: 'Front rise', values: ['11.5', '12', '12.5', '13', '13.5'] },
  { id: 'backRise', label: 'Back rise', values: ['15', '15.5', '16', '16.5', '17'] },
  { id: 'thigh', label: 'Thigh (flat)', values: ['12', '12.5', '13', '13.5', '14'] },
  { id: 'knee', label: 'Knee (flat)', values: ['12.5', '13', '13.5', '14', '14.5'] },
  { id: 'bottom', label: 'Bottom (flat)', values: ['11.5', '12', '12.5', '13', '13.5'] },
  { id: 'inseam', label: 'Inseam', values: ['29', '30', '31', '32', '33'] },
  { id: 'outseam', label: 'Outseam', values: ['41', '42', '43', '44', '45'] },
];

function measure(id, sizeIndex) {
  return ROWS.find((row) => row.id === id).values[sizeIndex];
}

/** Black retail dummy. Numbers follow the selected size. */
function FitDummy({ sizeIndex, active }) {
  const hot = (id) => active === id;
  const n = (id) => `${measure(id, sizeIndex)}"`;
  return (
    <div className="relative mx-auto w-full max-w-[460px]" role="img" aria-label={`Female fit dummy for size ${SIZES[sizeIndex]}`}>
      <img src={dummy} alt="" className="block h-auto w-full" />
      <Tick hot={hot('waist')} style={{ top: '47.5%', left: '42%', width: '16%', height: 0 }} />
      <Tick hot={hot('hip')} style={{ top: '50.2%', left: '40%', width: '20%', height: 0 }} />
      <Tick hot={hot('thigh')} style={{ top: '62%', left: '52%', width: '7%', height: 0 }} />
      <Tick hot={hot('knee')} style={{ top: '76%', left: '51.8%', width: '6.5%', height: 0 }} />
      <Tick hot={hot('bottom')} style={{ top: '86%', left: '52%', width: '5.5%', height: 0 }} />
      <Tick hot={hot('frontRise')} style={{ top: '47.5%', left: '46%', width: 0, height: '4.8%' }} />
      <Tick hot={hot('backRise')} dashed style={{ top: '47.5%', left: '44%', width: 0, height: '6%' }} />
      <Tick hot={hot('outseam')} dashed style={{ top: '50%', left: '39.8%', width: 0, height: '36%' }} />
      <Tick hot={hot('inseam')} dashed style={{ top: '52.5%', left: '48.6%', width: 0, height: '33.5%' }} />
      <Tag hot={hot('frontRise')} style={{ top: '44%', left: '2%' }} label="Front rise" value={n('frontRise')} />
      <Tag hot={hot('backRise')} style={{ top: '56%', left: '2%' }} label="Back rise" value={n('backRise')} />
      <Tag hot={hot('outseam')} style={{ top: '78%', left: '2%' }} label="Outseam" value={n('outseam')} />
      <Tag hot={hot('inseam')} style={{ top: '94%', left: '2%' }} label="Inseam" value={n('inseam')} />
      <Tag hot={hot('waist')} style={{ top: '47%', left: '68%' }} label="Waist" value={n('waist')} />
      <Tag hot={hot('hip')} style={{ top: '54%', left: '68%' }} label="Hip" value={n('hip')} />
      <Tag hot={hot('thigh')} style={{ top: '62%', left: '68%' }} label="Thigh" value={n('thigh')} />
      <Tag hot={hot('knee')} style={{ top: '76%', left: '68%' }} label="Knee" value={n('knee')} />
      <Tag hot={hot('bottom')} style={{ top: '86%', left: '68%' }} label="Bottom" value={n('bottom')} />
    </div>
  );
}

function Tick({ style, hot, dashed }) {
  const horizontal = style.height === 0;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute ${dashed ? 'border-dashed' : ''} ${horizontal ? 'border-t' : 'border-l'} ${hot ? 'border-[2.5px] border-[#F5F2EC]' : 'border border-[#F5F2EC]/80'}`}
      style={style}
    />
  );
}

function Tag({ style, label, value, hot }) {
  return (
    <span className="pointer-events-none absolute -translate-y-1/2 whitespace-nowrap text-[11px] leading-tight tracking-wide text-[var(--color-text-muted)]" style={style}>
      {label}
      <span className={`mt-0.5 block text-sm font-semibold ${hot ? 'text-[var(--color-brand)]' : 'text-[var(--color-text)]'}`}>{value}</span>
    </span>
  );
}

export function SizeGuide() {
  const [sizeIndex, setSizeIndex] = useState(2);
  const [active, setActive] = useState('waist');

  return (
    <div className="mt-8">
      <p className="font-semibold tracking-wide">DON&apos;T GUESS YOUR SIZE.</p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
        Garment measurements in inches. Flat measurements are taken with the piece laid flat. Pick a size to read it on the dummy.
      </p>

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Size">
        {SIZES.map((size, index) => (
          <button
            key={size}
            type="button"
            role="tab"
            aria-selected={index === sizeIndex}
            onClick={() => setSizeIndex(index)}
            className={`min-h-11 min-w-14 border px-4 text-sm font-semibold tracking-wide ${
              index === sizeIndex
                ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-[#F5F2EC]'
                : 'border-[var(--color-border)] hover:border-[var(--color-brand)]'
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(280px,460px)_1fr]">
        <FitDummy sizeIndex={sizeIndex} active={active} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <caption className="sr-only">Measurements in inches</caption>
            <thead>
              <tr className="border-b border-[var(--color-border-strong)] text-left">
                <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-[var(--tracking-caps)]">Measurements (inch)</th>
                {SIZES.map((size, index) => (
                  <th key={size} className={`px-2 py-3 text-center ${index === sizeIndex ? 'text-[var(--color-brand)]' : ''}`}>
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.id}
                  onMouseEnter={() => setActive(row.id)}
                  onFocus={() => setActive(row.id)}
                  className={`border-b border-[var(--color-border)] ${active === row.id ? 'bg-[var(--color-bg-muted)]' : ''}`}
                >
                  <th scope="row" className="py-3 pr-4 text-left font-medium">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={SIZES[index]} className={`px-2 py-3 text-center tabular-nums ${index === sizeIndex ? 'font-semibold text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'}`}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
