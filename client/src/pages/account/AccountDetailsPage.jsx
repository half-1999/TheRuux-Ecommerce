import { useState } from 'react';
import { meApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';
import { useToastStore } from '../../store/toastStore';

export function AccountDetailsPage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const push = useToastStore((s) => s.push);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await meApi.update({ name, phone });
      setSession({ user: data.user, accessToken });
      push({ title: 'Details updated.' });
    } catch (err) {
      push({ title: 'Update failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-5">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Input label="Email" value={user?.email || ''} disabled />
      <Button type="submit" loading={loading}>
        Save
      </Button>
    </form>
  );
}
