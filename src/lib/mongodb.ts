import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

/**
 * Reuse the connection across hot reloads / lambda invocations instead of
 * opening a new one on every request.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export function connectToDatabase(): Promise<typeof mongoose> {
  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(MONGODB_URI as string, {
      maxPoolSize: 10
    });
  }
  return global._mongooseConn;
}
