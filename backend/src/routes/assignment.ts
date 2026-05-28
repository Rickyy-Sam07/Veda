import { Router, Request, Response } from 'express';
import { regenerateSingleQuestion } from '../services/ai.js';
import { 
  dbGetAssignments, 
  dbGetAssignmentById, 
  dbCreateAssignment, 
  dbUpdateAssignment, 
  dbDeleteAssignment 
} from '../services/dbService.js';
import { addAssignmentJob, addPdfJob } from '../services/queueService.js';

const router = Router();

// 1. Create assignment structure & queue AI job
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      dueDate,
      questionTypes,
      numberOfQuestions,
      marksPerQuestion,
      additionalInstructions
    } = req.body;

    // Validation
    if (!title || !dueDate || !questionTypes || !numberOfQuestions || !marksPerQuestion) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    if (numberOfQuestions <= 0 || marksPerQuestion <= 0) {
      return res.status(400).json({ error: 'Number of questions and marks per question must be greater than zero.' });
    }

    const totalMarks = numberOfQuestions * marksPerQuestion;

    const assignmentData = {
      title,
      description,
      dueDate: new Date(dueDate),
      questionTypes,
      numberOfQuestions: parseInt(numberOfQuestions, 10),
      marksPerQuestion: parseInt(marksPerQuestion, 10),
      totalMarks,
      additionalInstructions,
      status: 'pending',
      sections: []
    };

    const assignment = await dbCreateAssignment(assignmentData);

    // Trigger BullMQ or In-Memory background generation
    await addAssignmentJob(assignment._id.toString());

    return res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Create assignment error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Get all assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    const assignments = await dbGetAssignments();
    return res.json(assignments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to retrieve assignments' });
  }
});

// 3. Get single assignment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await dbGetAssignmentById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    return res.json(assignment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to retrieve assignment' });
  }
});

// 4. Delete assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await dbDeleteAssignment(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    return res.json({ message: 'Assignment successfully deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete assignment' });
  }
});

// 5. Regenerate entire assignment
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await dbGetAssignmentById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const updated = await dbUpdateAssignment(req.params.id, {
      status: 'pending',
      sections: [],
      pdfPath: undefined
    });

    await addAssignmentJob(assignment._id.toString());

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to trigger regeneration' });
  }
});

// 6. Regenerate single question (Bonus Feature 3)
router.post('/:id/questions/:questionId/regenerate', async (req: Request, res: Response) => {
  try {
    const { id, questionId } = req.params;
    const assignment = await dbGetAssignmentById(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Locate the question inside sections
    let targetQuestion: any = null;
    let targetSection: any = null;

    const sectionsCopy = JSON.parse(JSON.stringify(assignment.sections));

    for (const section of sectionsCopy) {
      const q = section.questions.find((quest: any) => quest.id === questionId);
      if (q) {
        targetQuestion = q;
        targetSection = section;
        break;
      }
    }

    if (!targetQuestion) {
      return res.status(404).json({ error: 'Question not found inside this assignment' });
    }

    // Call Groq single question regeneration service
    const regenerated = await regenerateSingleQuestion({
      assignmentTitle: assignment.title,
      questionTypes: assignment.questionTypes,
      currentQuestionText: targetQuestion.text,
      difficulty: targetQuestion.difficulty,
      marks: targetQuestion.marks,
      additionalInstructions: assignment.additionalInstructions
    });

    // Replace the question details
    targetQuestion.text = regenerated.text;
    targetQuestion.answerKey = regenerated.answerKey;
    targetQuestion.id = regenerated.id; // updated id to trigger UI updates

    const updated = await dbUpdateAssignment(id, { sections: sectionsCopy });

    // Recompile PDF
    await addPdfJob(assignment._id.toString());

    return res.json(updated);
  } catch (error: any) {
    console.error('Regenerate single question error:', error);
    return res.status(500).json({ error: error.message || 'Failed to regenerate question' });
  }
});

// 7. Update question inline manually (Bonus Feature 3)
router.put('/:id/questions/:questionId', async (req: Request, res: Response) => {
  try {
    const { id, questionId } = req.params;
    const { text, difficulty, marks, answerKey } = req.body;
    const assignment = await dbGetAssignmentById(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    let targetQuestion: any = null;
    const sectionsCopy = JSON.parse(JSON.stringify(assignment.sections));

    for (const section of sectionsCopy) {
      const q = section.questions.find((quest: any) => quest.id === questionId);
      if (q) {
        targetQuestion = q;
        break;
      }
    }

    if (!targetQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Perform updates
    if (text !== undefined) targetQuestion.text = text;
    if (difficulty !== undefined) targetQuestion.difficulty = difficulty;
    if (marks !== undefined) targetQuestion.marks = parseInt(marks, 10);
    if (answerKey !== undefined) targetQuestion.answerKey = answerKey;

    // Recompute total marks if marks changed
    let sumMarks = 0;
    sectionsCopy.forEach((sec: any) => {
      sec.questions.forEach((q: any) => {
        sumMarks += q.marks;
      });
    });

    const updated = await dbUpdateAssignment(id, {
      sections: sectionsCopy,
      totalMarks: sumMarks
    });

    // Recompile PDF
    await addPdfJob(assignment._id.toString());

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update question details' });
  }
});

// 8. Custom PDF export compiler (Bonus Feature 5)
router.post('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const { schoolName, examTerm } = req.body;
    await addPdfJob(req.params.id, schoolName, examTerm);
    return res.json({ message: 'PDF regeneration job added successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to trigger PDF recompilation' });
  }
});

export default router;
