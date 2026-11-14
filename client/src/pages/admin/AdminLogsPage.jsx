import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { formatOrderDate } from '../../lib/orderStatus';
import { PageHeader } from '../../components/admin/AdminUI';

const LEVELS = ['', 'info', 'warn', 'danger'];

function Rows({ items, empty }) {
  if (!items.length) {
    return <p className="admin-muted">{empty}</p>;
  }
  return items.map((row, index) => (
    <div key={row.id || `${row.at}-${index}`} className="admin-log">
      <span className="when admin-muted">{formatOrderDate(row.at)}</span>
      <span className={`lvl ${row.level || 'info'}`}>{row.level || 'info'}</span>
      <span>
        {row.method ? `${row.method} ${row.path}` : row.message}
        <span className="who" title={row.ua || undefined}>
          {row.actor?.email ? [row.actor.name, row.actor.email, row.actor.role].filter(Boolean).join(' · ') : row.who || (row.method ? 'Guest' : '')}
          {row.ip ? ` · ${row.ip}` : ''}
        </span>
      </span>
      <span className="admin-muted">{row.status ? `${row.status} · ${row.ms}ms` : ''}</span>
    </div>
  ));
}

export function AdminLogsPage() {
  const [source, setSource] = useState('api');
  const [level, setLevel] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-logs', source],
    queryFn: () => adminApi.logs(source),
    refetchInterval: 4000,
  });
  const live = (data?.live || []).filter((row) => !level || row.level === level);
  const changes = (data?.changes || []).filter((row) => !level || row.level === level);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Logs' }]}
        title="Logs"
        description="API lines show the signed-in name, email and role, plus the IP. They clear when the server restarts. Saved changes stay."
      />
      <div className="admin-tabs" role="tablist" style={{ marginBottom: '1rem' }}>
        <button type="button" role="tab" aria-selected={source === 'api'} onClick={() => setSource('api')}>
          API
        </button>
        <button type="button" role="tab" aria-selected={source === 'system'} onClick={() => setSource('system')}>
          System
        </button>
      </div>
      <div className="admin-toolbar">
        {LEVELS.map((value) => (
          <button
            key={value || 'all'}
            type="button"
            className={`admin-btn admin-btn-sm ${level === value ? (value ? `admin-btn-${value}` : 'admin-btn-primary') : ''}`}
            aria-pressed={level === value}
            onClick={() => setLevel(value)}
          >
            {value === 'danger' ? 'Problem' : value === 'warn' ? 'Warn' : value === 'info' ? 'Info' : 'All'}
          </button>
        ))}
      </div>
      <div className="admin-card">
        {isLoading ? <p className="admin-muted">Loading…</p> : null}
        {error ? <p className="admin-error">{error.message}</p> : null}
        {!isLoading && !error ? (
          <Rows
            items={live}
            empty={source === 'api' ? 'No API requests yet.' : 'No system events yet.'}
          />
        ) : null}
      </div>
      {source === 'system' ? (
        <div className="admin-card" style={{ marginTop: '1rem' }}>
          <p className="admin-metric-label">Saved changes</p>
          <div style={{ marginTop: '0.75rem' }}>
            <Rows items={changes} empty="No saved admin changes yet." />
          </div>
        </div>
      ) : null}
    </>
  );
}
