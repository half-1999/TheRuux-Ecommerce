import { AuditLog } from '../models/AuditLog.js';

export const writeAudit = async ({ adminId, action, entityType, entityId = '', meta = {} }) => {
  try {
    await AuditLog.create({ adminId, action, entityType, entityId: String(entityId), meta });
  } catch (err) {
    console.error('Audit log failed', err.message);
  }
};

export const auditAdmin =
  (action, entityType, getEntityId = (req) => req.params.id) =>
  async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400 && req.user) {
        void writeAudit({
          adminId: req.user._id,
          action,
          entityType,
          entityId: getEntityId(req, body) || '',
          meta: { method: req.method, path: req.originalUrl },
        });
      }
      return originalJson(body);
    };
    next();
  };
