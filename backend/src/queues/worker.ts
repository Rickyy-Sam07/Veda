import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { Assignment } from '../models/Assignment.js';
import { generateAssignmentQuestions } from '../services/ai.js';
import { generateAssignmentPDF } from '../services/pdf.js';
import { sendJobProgress, notifyAssignmentUpdated } from '../services/wsManager.js';
import { addPdfJob } from './queue.js';

export const startWorker = () => {
  const worker = new Worker(
    'assessment-queue',
    async (job: Job) => {
      const { assignmentId, customSchoolName, customExamTerm } = job.data;
      
      console.log(`👷 Worker: Processing job "${job.name}" for Assignment: ${assignmentId}`);

      if (job.name === 'generate-assessment') {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
          throw new Error(`Assignment with ID ${assignmentId} not found in database.`);
        }

        try {
          // 1. Mark status as generating
          assignment.status = 'generating';
          await assignment.save();
          notifyAssignmentUpdated(assignmentId, 'generating');
          sendJobProgress(assignmentId, 1, 5, '🚀 [1/5 Queue] Connected to Redis queue. Worker selected.');

          // 2. Run AI Generation
          sendJobProgress(assignmentId, 2, 5, '🧠 [2/5 AI Engine] Generating exam paper sections via Groq API...');
          
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

          // 3. Save sections to database
          assignment.sections = sections;
          assignment.status = 'completed';
          await assignment.save();
          
          sendJobProgress(assignmentId, 4, 5, '📦 [4/5 Database] Saving assessment sections and answer keys...');

          // 4. Trigger PDF Generation job
          sendJobProgress(assignmentId, 5, 5, '🖨️ [5/5 PDF Compiler] Queueing academic PDF compilation job...');
          await addPdfJob(assignmentId);
          
          notifyAssignmentUpdated(assignmentId, 'completed');
          console.log(`👷 Worker: Successfully processed AI generation for Assignment: ${assignmentId}`);
        } catch (err: any) {
          assignment.status = 'failed';
          await assignment.save();
          notifyAssignmentUpdated(assignmentId, 'failed');
          sendJobProgress(assignmentId, 5, 5, `❌ [Failed] Error generated during process: ${err?.message || 'Unknown error'}`);
          console.error(`👷 Worker: Failed processing job.`, err);
          throw err;
        }
      }

      if (job.name === 'generate-pdf') {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
          throw new Error(`Assignment with ID ${assignmentId} not found for PDF compilation.`);
        }

        try {
          console.log(`👷 Worker: Generating PDF for Assignment: ${assignmentId}`);
          
          const relativePdfPath = await generateAssignmentPDF(
            assignment,
            customSchoolName,
            customExamTerm
          );

          assignment.pdfPath = relativePdfPath;
          await assignment.save();

          console.log(`👷 Worker: PDF compiled successfully at ${relativePdfPath}`);
          notifyAssignmentUpdated(assignmentId, 'completed', relativePdfPath);
        } catch (err) {
          console.error(`👷 Worker: PDF Compilation failed.`, err);
          throw err;
        }
      }
    },
    {
      connection: redisConfig,
      concurrency: 2
    }
  );

  // Silent error catcher preventing ECONNREFUSED terminal floods
  worker.on('error', (err) => {
    // Catch silently
  });

  worker.on('active', (job) => {
    console.log(`👷 Worker Active: Job #${job.id} started.`);
  });

  worker.on('completed', (job) => {
    console.log(`👷 Worker Success: Job #${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`👷 Worker Failure: Job #${job?.id} failed with error:`, err);
  });

  return worker;
};
