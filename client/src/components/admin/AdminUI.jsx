import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretLeft, CaretRight, ImageSquare, UploadSimple, X } from '@phosphor-icons/react';
import { adminApi } from '../../api/client';

export function PageHeader({ crumbs = [], title, description, actions }) {
  return (
    <header className="admin-page-head">
      <div>
        {crumbs.length ? (
          <nav className="admin-crumbs" aria-label="Breadcrumb">
            <Link to="/admin">Admin</Link>
            {crumbs.map((c) => (
              <span key={c.label}>
                <span aria-hidden> / </span>
                {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              </span>
            ))}
          </nav>
        ) : null}
        <h1>{title}</h1>
        {description ? <p className="admin-page-desc">{description}</p> : null}
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </header>
  );
}

export function Notice({ tone = 'muted', children, onClose }) {
  if (!children) return null;
  return (
    <div className={`admin-notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onClose ? (
        <button type="button" className="admin-icon-btn" aria-label="Dismiss" onClick={onClose}>
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

/** Loading / error / empty row for any admin table. */
export function TableState({ colSpan, loading, error, empty, emptyText, action }) {
  if (loading) {
    return Array.from({ length: 4 }, (_, i) => (
      <tr key={i} aria-hidden>
        <td colSpan={colSpan}>
          <div className="admin-skeleton" />
        </td>
      </tr>
    ));
  }
  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="admin-error">
          {error.status === 403 ? 'You do not have permission to view this.' : error.message}
        </td>
      </tr>
    );
  }
  if (empty) {
    return (
      <tr>
        <td colSpan={colSpan}>
          <div className="admin-empty">
            <p>{emptyText}</p>
            {action}
          </div>
        </td>
      </tr>
    );
  }
  return null;
}

export function Pagination({ page = 1, pageSize = 25, total = 0, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return total ? <p className="admin-pager admin-muted">{total} total</p> : null;
  return (
    <nav className="admin-pager" aria-label="Pagination">
      <span className="admin-muted">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <button type="button" className="admin-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <CaretLeft size={14} />
      </button>
      <span>
        {page} / {pages}
      </span>
      <button type="button" className="admin-btn" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
        <CaretRight size={14} />
      </button>
    </nav>
  );
}

export function Field({ label, error, hint, children, id }) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <div className={`admin-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={fieldId}>{label}</label>
      {typeof children === 'function' ? children(fieldId) : children}
      {error ? (
        <span className="admin-field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="admin-field-hint">{hint}</span>
      ) : null}
    </div>
  );
}

/** Native <dialog>: gives us Esc-to-close, focus trapping and a backdrop for free. */
export function Dialog({ open, title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`admin-dialog ${wide ? 'wide' : ''}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby={title ? `${title}-title` : undefined}
    >
      {open ? (
        <div className="admin-dialog-inner">
          <div className="admin-dialog-head">
            <h2 id={`${title}-title`}>{title}</h2>
            <button type="button" className="admin-icon-btn" aria-label="Close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          <div className="admin-dialog-body">{children}</div>
          {footer ? <div className="admin-dialog-foot">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}

const MAX_UPLOAD = 8 * 1024 * 1024;

/** Upload to the configured media store (Cloudinary or local) or paste a URL. */
export function ImageField({ label = 'Image', value, onChange, aspect = '3 / 4', error }) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [broken, setBroken] = useState(false);
  const inputId = useId();

  const onFile = async (file) => {
    if (!file) return;
    setUploadError('');
    if (!file.type.startsWith('image/')) return setUploadError('Choose an image file (JPG, PNG, WebP).');
    if (file.size > MAX_UPLOAD) return setUploadError('Images must be under 8 MB.');
    setBusy(true);
    try {
      const res = await adminApi.upload(file);
      setBroken(false);
      onChange(res.urlPackshot || res.url);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`admin-field ${error || uploadError ? 'has-error' : ''}`}>
      <label htmlFor={inputId}>{label}</label>
      <div className="admin-image-field">
        <div className="admin-image-preview" style={{ aspectRatio: aspect }}>
          {value && !broken ? (
            <img src={value} alt="" onError={() => setBroken(true)} onLoad={() => setBroken(false)} />
          ) : (
            <span className="admin-muted">
              <ImageSquare size={22} />
              {broken ? 'Image not found' : 'No image'}
            </span>
          )}
        </div>
        <div className="admin-image-actions">
          <label className="admin-btn">
            <UploadSimple size={14} /> {busy ? 'Uploading…' : 'Upload'}
            <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <input
            id={inputId}
            placeholder="or paste an image URL"
            value={value || ''}
            onChange={(e) => {
              setBroken(false);
              onChange(e.target.value);
            }}
          />
          {value ? (
            <button type="button" className="admin-btn" onClick={() => onChange('')}>
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {error || uploadError ? <span className="admin-field-error">{error || uploadError}</span> : null}
    </div>
  );
}

export function Thumb({ src, alt = '', size = 'md' }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <span className={`admin-thumb ${size} empty`} aria-hidden />;
  return <img src={src} alt={alt} className={`admin-thumb ${size}`} loading="lazy" onError={() => setBroken(true)} />;
}