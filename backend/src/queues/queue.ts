import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';

export const assessmentQueue = new Queue('assessment-queue', {
  connection: redisConfig
});

// Swallow background connection error logs silently
assessmentQueue.on('error', (err) => {
  // Silent catch
});

export const addAssignmentJob = async (assignmentId: string) => {
  try {
    return await assessmentQueue.add('generate-assessment', { assignmentId }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
  } catch (err) {
    console.warn('⚠️ BullMQ Queue Add failed (Redis offline).');
  }
};

export const addPdfJob = async (assignmentId: string, customSchoolName?: string, customExamTerm?: string) => {
  try {
    return await assessmentQueue.add('generate-pdf', { assignmentId, customSchoolName, customExamTerm });
  } catch (err) {
    console.warn('⚠️ BullMQ PDF Job Add failed (Redis offline).');
  }
};
