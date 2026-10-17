import mongoose from 'mongoose';
import { env } from './env.js';
import { log } from './logger.js';

// Request bodies are sanitized (middleware/validate.js sanitizeJson) and every
// query built from request input goes through zod validation or ObjectId casting,
// so raw client keys can never reach a Mongo filter as operators.
mongoose.set('strictQuery', true);

const opts = {
  serverSelectionTimeoutMS: 10_000,
  autoIndex: env.NODE_ENV !== 'production', // build indexes on boot in dev/test only
};

export async function connectDb(uri = env.MONGODB_URI) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  const conn = await mongoose.connect(uri, opts);
  log.info('MongoDB connected', { host: conn.connection.host, db: conn.connection.name });
  return conn;
}

export async function disconnectDb() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  log.info('MongoDB disconnected');
}

mongoose.connection.on('disconnected', () => log.warn('MongoDB disconnected, retrying…'));
mongoose.connection.on('error', (err) => log.error('MongoDB connection error', { message: err.message }));
