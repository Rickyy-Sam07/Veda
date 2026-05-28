import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  answerKey?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAssignment extends Document {
  title: string;
  description?: string;
  dueDate: Date;
  questionTypes: string[];
  numberOfQuestions: number;
  marksPerQuestion: number;
  totalMarks: number;
  additionalInstructions?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  sections: ISection[];
  pdfPath?: string;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks: { type: Number, required: true },
  answerKey: { type: String }
}, { _id: false });

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema]
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  questionTypes: { type: [String], required: true },
  numberOfQuestions: { type: Number, required: true },
  marksPerQuestion: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  additionalInstructions: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'generating', 'completed', 'failed'], 
    default: 'pending' 
  },
  sections: [SectionSchema],
  pdfPath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
export default Assignment;
