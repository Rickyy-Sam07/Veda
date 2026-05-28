import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    // Timeout rapidly if offline so it doesn't block Express boot for 30s
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('MongoDB Connected Successfully.');
  } catch (error) {
    console.warn('⚠️ MongoDB Connection failed. VedaAI database will operate with a local JSON file database fallback.');
  }
};
