import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer;

export const connectDb = async () => {
  mongoose.set('strictQuery', true);

  let uri = env.mongoUri;

  if (uri === 'memory' || process.env.USE_MEMORY_DB === 'true') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('theruux');
    console.log('Using in-memory MongoDB (dev only)');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

export const getDbState = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
};

export const stopMemoryDb = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
};
