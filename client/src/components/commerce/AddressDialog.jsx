import { useEffect, useState } from 'react';
import { MapPin, X } from '@phosphor-icons/react';
import { Button, Input } from '../ui';
import { requestGeolocation, reverseGeocode } from '../../lib/geolocation';
import { useToastStore } from '../../store/toastStore';

const empty = {
  label: 'Home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  isDefault: false,
};

const FIELDS = [
  { key: 'line1', label: 'Address line 1', required: true },
  { key: 'line2', label: 'Address line 2', required: false },
  { key: 'city', label: 'City', required: true },
  { key: 'state', label: 'State', required: true },
  { key: 'postalCode', label: 'Zip code', required: true },
  { key: 'country', label: 'Country', required: true },
];

export function AddressDialog({ open, onClose, onSave, saving, locateRef }) {
  const push = useToastStore((s) => s.push);
  const [form, setForm] = useState(empty);
  const [locating, setLocating] = useState(false);

  const fillFromLocation = async () => {
    setLocating(true);
    try {
      const { lat, lon } = await requestGeolocation();
      const addr = await reverseGeocode(lat, lon);
      setForm((current) => ({
        ...current,
        line1: addr.line1 || current.line1,
        line2: addr.line2 || current.line2,
        city: addr.city || current.city,
        state: addr.state || current.state,
        postalCode: addr.postalCode || current.postalCode,
        country: addr.country || current.country,
      }));
    } catch {
      push({
        title: 'Location unavailable',
        message: 'Allow location access, or type the address.',
      });
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    if (locateRef) locateRef.current = fillFromLocation;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (locateRef) locateRef.current = null;
    };
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-dialog-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-[var(--color-bg)] p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="address-dialog-title" className="text-xl font-semibold">
            Add address
          </h2>
          <button type="button" aria-label="Close" className="inline-flex h-11 w-11 items-center justify-center" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(form);
          }}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              {locating ? 'Finding your location…' : 'Filled from your current location. Edit anything that looks off.'}
            </p>
            <Button type="button" variant="secondary" loading={locating} onClick={fillFromLocation} trailingIcon={<MapPin size={14} weight="bold" />}>
              Use my location
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                name={field.key}
                value={form[field.key]}
                onChange={(e) => setForm((current) => ({ ...current, [field.key]: e.target.value }))}
                required={field.required}
                maxLength={field.key === 'country' ? 2 : undefined}
                autoComplete={field.key === 'postalCode' ? 'postal-code' : 'on'}
              />
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button type="submit" loading={saving}>
              Save address
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
