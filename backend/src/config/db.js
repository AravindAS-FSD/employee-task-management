import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) throw new Error('MONGODB_URI is not set (see .env.example)');
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
