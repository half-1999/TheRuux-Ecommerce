import mongoose from 'mongoose';

/**
 * Run fn(session) inside a transaction when the deployment supports it.
 * Falls back to fn(null) on standalone Mongo (no replica set).
 */
export const withTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {
      /* ignore */
    }

    const needsReplica =
      err?.code === 20 ||
      /Transaction numbers are only allowed/i.test(err?.message || '');

    if (needsReplica) {
      // Standalone / memory without replSet — still execute commerce logic
      return fn(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
};
