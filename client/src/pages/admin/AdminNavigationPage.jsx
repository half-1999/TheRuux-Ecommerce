import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Trash } from '@phosphor-icons/react';
import { adminApi } from '../../api/client';
import { DEFAULT_NAV, NAV_ICONS } from '../../components/admin/adminNav';
import { Notice, PageHeader } from '../../components/admin/AdminUI';

export function AdminNavigationPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-navigation'], queryFn: adminApi.navigation });
  if (isLoading) return <p className="admin-muted">Loading navigation…</p>;
  if (error) return <Notice tone="error">{error.message}</Notice>;
  return <NavEditor key={data.items ? 'saved' : 'default'} data={data} />;
}

function NavEditor({ data }) {
  const qc = useQueryClient();
  const [items, setItems] = useState(() => (data.items || DEFAULT_NAV).map((i) => ({ ...i })));
  const [msg, setMsg] = useState(null);
  const routes = data.routes || [];
  const icons = data.icons || Object.keys(NAV_ICONS);

  const update = (index, patch) => setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index, dir) =>
    setItems((list) => {
      const next = [...list];
      [next[index], next[index + dir]] = [next[index + dir], next[index]];
      return next;
    });

  const done = (text) => {
    setMsg({ tone: 'ok', text });
    qc.invalidateQueries({ queryKey: ['admin-navigation'] });
  };
  const fail = (err) => setMsg({ tone: 'error', text: err.message });

  const save = useMutation({ mutationFn: () => adminApi.setNavigation(items), onSuccess: () => done('Navigation saved.'), onError: fail });
  const reset = useMutation({
    mutationFn: () => adminApi.setNavigation(null),
    onSuccess: () => {
      setItems(DEFAULT_NAV.map((i) => ({ ...i })));
      done('Navigation reset to the default.');
    },
    onError: fail,
  });

  const invalid = items.some((i) => !i.label.trim()) || !items.some((i) => i.enabled);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Navigation' }]}
        title="Admin navigation"
        description="Rename, reorder, group or hide sidebar items. Destinations are limited to real admin pages, and hiding an item never changes who can access the page."
        actions={
          <>
            <button type="button" className="admin-btn" disabled={reset.isPending} onClick={() => window.confirm('Reset the sidebar to the default layout?') && reset.mutate()}>
              Reset to default
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={() => setItems((list) => [...list, { id: `item-${Date.now()}`, label: 'New item', to: routes[0] || '/admin', icon: 'star', group: '', enabled: true }])}
            >
              <Plus size={14} /> Create New Item
            </button>
            <button type="button" className="admin-btn admin-btn-primary" disabled={invalid || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : 'Save navigation'}
            </button>
          </>
        }
      />
      <Notice tone={msg?.tone} onClose={() => setMsg(null)}>
        {msg?.text}
      </Notice>
      {invalid ? <Notice tone="warn">Every item needs a label and at least one item must stay visible.</Notice> : null}

      <div className="admin-card admin-nav-editor">
        {items.map((item, i) => {
          const Icon = NAV_ICONS[item.icon] || NAV_ICONS.star;
          return (
            <div key={item.id} className={`admin-nav-row ${item.enabled ? '' : 'is-off'}`}>
              <span className="admin-nav-icon" aria-hidden>
                <Icon size={18} />
              </span>
              <input aria-label="Label" value={item.label} maxLength={40} onChange={(e) => update(i, { label: e.target.value })} />
              <select aria-label="Destination" value={item.to} onChange={(e) => update(i, { to: e.target.value })}>
                {routes.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select aria-label="Icon" value={item.icon} onChange={(e) => update(i, { icon: e.target.value })}>
                {icons.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <input aria-label="Group" placeholder="Group (optional)" value={item.group} maxLength={30} onChange={(e) => update(i, { group: e.target.value })} />
              <label className="admin-check">
                <input type="checkbox" checked={item.enabled} onChange={(e) => update(i, { enabled: e.target.checked })} /> Visible
              </label>
              <div className="admin-actions">
                <button type="button" className="admin-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${item.label} up`}>
                  <ArrowUp size={14} />
                </button>
                <button type="button" className="admin-icon-btn" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${item.label} down`}>
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() => window.confirm(`Remove “${item.label}” from the sidebar?`) && setItems((list) => list.filter((_, x) => x !== i))}
                  aria-label={`Remove ${item.label}`}
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="admin-muted">Hidden pages remain reachable by URL. Items with the same group name next to each other are shown under one heading.</p>
    </>
  );
}
