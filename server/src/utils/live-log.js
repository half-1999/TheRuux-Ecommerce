import jwt from 'jsonwebtoken';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

const LIMIT = 200;
const buckets = { api: [], system: [] };

// shortcut: memory only, move to a store if logs must survive a restart.
const push = (source, entry) => {
  const bucket = buckets[source];
  if (!bucket) return;
  bucket.unshift({ ...entry, at: new Date().toISOString() });
  if (bucket.length > LIMIT) bucket.length = LIMIT;
};

export const recordLog = (source, entry) => push(source, entry);

export const recordApi = (entry) => push('api', entry);

const people = new Map();

/** Name, email and role for a logged-in request. Guests stay anonymous. The token itself is never stored. */
export const describeActor = async (req) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), env.jwtAccessSecret);
    const id = String(payload.sub || '');
    if (!id) return null;
    const hit = people.get(id);
    if (hit && hit.until > Date.now()) return hit.user;
    const user = await User.findById(id).select('name email role').lean();
    if (!user) return null;
    const brief = { name: user.name || '', email: user.email || '', role: user.role || payload.role || '' };
    people.set(id, { until: Date.now() + 5 * 60 * 1000, user: brief });
    return brief;
  } catch {
    return null;
  }
};

export const readLogs = (source) => [...(buckets[source] || [])];

export const adminReadLogs = async (source) => {
  if (source !== 'system') return { source: 'api', live: readLogs('api'), changes: [] };
  const rows = await AuditLog.find().sort({ createdAt: -1 }).limit(60).populate('adminId', 'email name').lean();
  return {
    source: 'system',
    live: readLogs('system'),
    changes: rows.map((row) => ({
      id: row._id.toString(),
      at: row.createdAt,
      level: 'info',
      message: `${row.action} ${row.entityType}${row.entityId ? ` ${row.entityId}` : ''}`,
      who: row.adminId?.name || row.adminId?.email || '',
    })),
  };
};
