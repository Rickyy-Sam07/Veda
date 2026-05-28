import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { redisConfig } from '../config/redis.js';
import { generateAssignmentQuestions } from './ai.js';
import { generateAssignmentPDF } from './pdf.js';
import { sendJobProgress, notifyAssignmentUpdated } from './wsManager.js';
import { dbGetAssignmentById, dbUpdateAssignment } from './dbService.js';

export let isRedisConnected = false;
export let assessmentQueue: Queue | null = null;

// Initialize a connection tester that will fail fast and silently
const connectionTester = new Redis({
  ...redisConfig,
  lazyConnect: true // Don't block
});

// Bind silent error catcher to prevent ECONNREFUSED print spams
connectionTester.on('error', (err) => {
  // Swallow connection refusal events silently
});

// Perform fast async connection check on backend boot
connectionTester.connect()
  .then(() => {
    isRedisConnected = true;
    assessmentQueue = new Queue('assessment-queue', {
      connection: connectionTester
    });
    console.log('📡 Redis Queue Service: Redis is online. BullMQ enabled.');
  })
  .catch(() => {
    console.warn('⚠️ Redis is offline. VedaAI Queue will operate in In-Memory Queue Mode (Silent Fallback).');
  });

// In-Memory job runner simulating background processes
const runInMemoryAssessmentJob = async (assignmentId: string) => {
  console.log(`🔌 InMemory Queue: Processing AI generation for assignment: ${assignmentId}`);
  const assignment = await dbGetAssignmentById(assignmentId);
  if (!assignment) return;

  try {
    // 1. Status generating
    await dbUpdateAssignment(assignmentId, { status: 'generating' });
    notifyAssignmentUpdated(assignmentId, 'generating');
    sendJobProgress(assignmentId, 1, 5, '🚀 [1/5 Queue] Connected to In-Memory Event Loop.');

    // 2. Generate questions
    await new Promise((resolve) => setTimeout(resolve, 800)); // small delay
    sendJobProgress(assignmentId, 2, 5, '🧠 [2/5 AI Engine] Generating exam paper sections...');
    
    const sections = await generateAssignmentQuestions({
      title: assignment.title,
      description: assignment.description,
      questionTypes: assignment.questionTypes,
      numberOfQuestions: assignment.numberOfQuestions,
      marksPerQuestion: assignment.marksPerQuestion,
      additionalInstructions: assignment.additionalInstructions
    }, (log) => {
      sendJobProgress(assignmentId, 3, 5, log);
    });

    // 3. Save sections and update status
    await dbUpdateAssignment(assignmentId, {
      sections,
      status: 'completed'
    });
    
    sendJobProgress(assignmentId, 4, 5, '📦 [4/5 Database] Saving assessment sections and answer keys...');

    // 4. Trigger PDF Generation
    await new Promise((resolve) => setTimeout(resolve, 400));
    sendJobProgress(assignmentId, 5, 5, '🖨️ [5/5 PDF Compiler] Generating print-ready academic PDF sheet...');
    
    // Automatically trigger local PDF compiling
    await runInMemoryPdfJob(assignmentId);
  } catch (err: any) {
    await dbUpdateAssignment(assignmentId, { status: 'failed' });
    notifyAssignmentUpdated(assignmentId, 'failed');
    sendJobProgress(assignmentId, 5, 5, `❌ [Failed] Error generated in worker: ${err?.message || 'Unknown'}`);
  }
};

const runInMemoryPdfJob = async (assignmentId: string, schoolName?: string, examTerm?: string) => {
  console.log(`🔌 InMemory Queue: Processing PDF compile for assignment: ${assignmentId}`);
  const assignment = await dbGetAssignmentById(assignmentId);
  if (!assignment) return;

  try {
    const relativePdfPath = await generateAssignmentPDF(
      assignment,
      schoolName,
      examTerm
    );

    await dbUpdateAssignment(assignmentId, { pdfPath: relativePdfPath });
    notifyAssignmentUpdated(assignmentId, 'completed', relativePdfPath);
    console.log(`🔌 InMemory Queue: PDF compiled successfully at ${relativePdfPath}`);
  } catch (err) {
    console.error('In-memory PDF Compilation failed:', err);
  }
};

export const addAssignmentJob = async (assignmentId: string) => {
  if (isRedisConnected && assessmentQueue) {
    try {
      await assessmentQueue.add('generate-assessment', { assignmentId }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
      });
      return;
    } catch (err) {
      console.warn('Redis queue add failed, falling back to In-Memory Queue.');
    }
  }

  // Fallback
  setTimeout(() => runInMemoryAssessmentJob(assignmentId), 500);
};

export const addPdfJob = async (assignmentId: string, customSchoolName?: string, customExamTerm?: string) => {
  if (isRedisConnected && assessmentQueue) {
    try {
      await assessmentQueue.add('generate-pdf', { assignmentId, customSchoolName, customExamTerm });
      return;
    } catch (err) {
      console.warn('Redis queue add PDF failed, falling back to In-Memory Queue.');
    }
  }

  // Fallback
  setTimeout(() => runInMemoryPdfJob(assignmentId, customSchoolName, customExamTerm), 500);
};
