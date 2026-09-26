import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meApi } from '../../api/client';
import { Button, Input, Skeleton } from '../../components/ui';
import { useToastStore } from '../../store/toastStore';

const empty = {
  label: 'Home',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  isDefault: true,
};

export function AddressesPage() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);
  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: meApi.addresses });
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);

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
              {addr.label} {addr.isDefault ? '· Default' : ''}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {addr.fullName}
              <br />
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ''}
              <br />
              {addr.city}, {addr.state} {addr.postalCode}
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
        <Button className="mt-6" variant="secondary" onClick={() => setOpen(true)}>
          Add address
        </Button>
      ) : (
        <form
          className="mt-8 max-w-lg space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(form);
          }}
        >
          {Object.keys(empty)
            .filter((k) => k !== 'isDefault' && k !== 'country')
            .map((key) => (
              <Input
                key={key}
                label={key}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={['fullName', 'phone', 'line1', 'city', 'state', 'postalCode'].includes(key)}
              />
            ))}
          <div className="flex gap-3">
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
