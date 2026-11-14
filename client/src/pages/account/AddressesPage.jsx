import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meApi } from '../../api/client';
import { Button, Input, Skeleton } from '../../components/ui';
import { useToastStore } from '../../store/toastStore';
import { requestGeolocation, reverseGeocode } from '../../lib/geolocation';

const empty = {
  label: 'Home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  isDefault: true,
};

const FIELDS = [
  { key: 'line1', label: 'Address line 1', required: true },
  { key: 'line2', label: 'Address line 2', required: false },
  { key: 'city', label: 'City', required: true },
  { key: 'state', label: 'State', required: true },
  { key: 'postalCode', label: 'PIN code', required: true },
  { key: 'country', label: 'Country', required: true },
];

export function AddressesPage() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);
  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: meApi.addresses });
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
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

  const create = useMutation({
    mutationFn: meApi.createAddress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      setForm(empty);
      setOpen(false);
      push({ title: 'Address saved.' });
    },
    onError: (err) => push({ title: 'Could not save', message: err.message }),
  });

  const remove = useMutation({
    mutationFn: meApi.deleteAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div>
      <ul className="space-y-4">
        {data?.items?.map((addr) => (
          <li key={addr.id} className="border border-[var(--color-border)] p-4">
            <p className="font-medium">
              {addr.label || 'Address'} {addr.isDefault ? '· Default' : ''}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ''}
              <br />
              {addr.city}, {addr.state} {addr.postalCode}
              <br />
              {addr.country}
            </p>
            <button
              type="button"
              className="mt-3 text-xs underline"
              onClick={() => remove.mutate(addr.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {!open ? (
        <Button
          className="mt-6"
          variant="secondary"
          onClick={() => {
            setOpen(true);
            fillFromLocation();
          }}
        >
          Add address
        </Button>
      ) : (
        <form
          className="mt-8 max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(form);
          }}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              {locating ? 'Finding your location…' : 'Filled from your current location. Edit anything that looks off.'}
            </p>
            <Button type="button" variant="secondary" loading={locating} onClick={fillFromLocation}>
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
                maxLength={field.key === 'country' ? 2 : field.key === 'postalCode' ? 6 : undefined}
                inputMode={field.key === 'postalCode' ? 'numeric' : undefined}
                autoComplete={field.key === 'postalCode' ? 'postal-code' : 'on'}
              />
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button type="submit" loading={create.isPending}>
              Save address
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
