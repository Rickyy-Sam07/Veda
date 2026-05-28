import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Assignment, IAssignment, ISection, IQuestion } from '../models/Assignment.js';

const FALLBACK_FILE = path.join(process.cwd(), 'uploads', 'db_assignments.json');

// Ensure uploads folder exists
const ensureUploadsDir = () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

// Check if Mongoose is connected
export const isMongoConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Local JSON File Database Fallback methods
const loadLocalDB = (): any[] => {
  ensureUploadsDir();
  if (!fs.existsSync(FALLBACK_FILE)) {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify([]));
    return [];
  }
  try {
    const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading fallback JSON database, resetting:', err);
    return [];
  }
};

const saveLocalDB = (data: any[]) => {
  ensureUploadsDir();
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2));
};

export const dbGetAssignments = async (): Promise<any[]> => {
  if (isMongoConnected()) {
    return await Assignment.find().sort({ createdAt: -1 });
  }
  console.log('🔌 DB Service: MongoDB disconnected. Using local JSON database.');
  return loadLocalDB().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const dbGetAssignmentById = async (id: string): Promise<any | null> => {
  if (isMongoConnected()) {
    return await Assignment.findById(id);
  }
  console.log(`🔌 DB Service: MongoDB disconnected. Fetching ${id} from local JSON database.`);
  const db = loadLocalDB();
  return db.find((a) => a._id === id) || null;
};

export const dbCreateAssignment = async (data: any): Promise<any> => {
  if (isMongoConnected()) {
    const assignment = new Assignment(data);
    return await assignment.save();
  }
  
  console.log('🔌 DB Service: MongoDB disconnected. Creating assignment in local JSON database.');
  const db = loadLocalDB();
  const newAssignment = {
    _id: `mock_db_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    ...data,
    status: 'pending',
    sections: [],
    createdAt: new Date().toISOString()
  };
  db.push(newAssignment);
  saveLocalDB(db);
  return newAssignment;
};

export const dbUpdateAssignment = async (id: string, updates: any): Promise<any | null> => {
  if (isMongoConnected()) {
    // If it's a direct document, Mongoose might receive save. But routes use findById + update.
    return await Assignment.findByIdAndUpdate(id, updates, { new: true });
  }
  
  console.log(`🔌 DB Service: MongoDB disconnected. Updating ${id} in local JSON database.`);
  const db = loadLocalDB();
  const idx = db.findIndex((a) => a._id === id);
  if (idx === -1) return null;

  db[idx] = { ...db[idx], ...updates };
  saveLocalDB(db);
  return db[idx];
};

export const dbDeleteAssignment = async (id: string): Promise<any | null> => {
  if (isMongoConnected()) {
    return await Assignment.findByIdAndDelete(id);
  }

  console.log(`🔌 DB Service: MongoDB disconnected. Deleting ${id} from local JSON database.`);
  const db = loadLocalDB();
  const toDelete = db.find((a) => a._id === id);
  if (!toDelete) return null;

  const filtered = db.filter((a) => a._id !== id);
  saveLocalDB(filtered);
  return toDelete;
};
