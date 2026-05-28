import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IAssignment } from '../models/Assignment.js';

export const generateAssignmentPDF = async (
  assignment: IAssignment,
  customSchoolName?: string,
  customExamTerm?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure uploads folder exists
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `assignment_${assignment._id}_${Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- HEADER & SCHOOL DETAILS ---
      const schoolName = (customSchoolName || 'VEDA AI ACADEMY').toUpperCase();
      const examTerm = (customExamTerm || 'ASSESSMENT TEST SHEET').toUpperCase();

      doc.font('Helvetica-Bold').fontSize(18).fillColor('#111827').text(schoolName, { align: 'center' });
      doc.fontSize(10).fillColor('#4b5563').text(examTerm, { align: 'center' });
      
      // Horizontal Double Border Line
      doc.moveDown(0.5);
      doc.strokeColor('#d1d5db').lineWidth(1.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.1);
      doc.strokeColor('#d1d5db').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.8);

      // --- ASSIGNMENT TITLE & DETAILS ---
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2937').text(`SUBJECT: ${assignment.title.toUpperCase()}`, { align: 'left' });
      
      // Metadata box
      const initialY = doc.y;
      doc.font('Helvetica').fontSize(9).fillColor('#374151');
      doc.text(`Due Date: ${new Date(assignment.dueDate).toLocaleDateString()}`, 50, initialY);
      doc.text(`Total Questions: ${assignment.numberOfQuestions}`, 220, initialY);
      doc.text(`Total Marks: ${assignment.totalMarks} Marks`, 400, initialY);
      
      doc.moveDown(1.5);
      const currentY = doc.y;

      // --- STUDENT INFO BOX (Beautifully Bordered Exam Header) ---
      doc.strokeColor('#9ca3af').lineWidth(1).rect(50, currentY, 495, 45).stroke();
      
      // Write labels inside the student info box
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1f2937');
      doc.text('STUDENT NAME:', 60, currentY + 18);
      doc.strokeColor('#9ca3af').lineWidth(0.5).moveTo(150, currentY + 26).lineTo(300, currentY + 26).stroke();

      doc.text('ROLL NO:', 320, currentY + 18);
      doc.strokeColor('#9ca3af').lineWidth(0.5).moveTo(375, currentY + 26).lineTo(435, currentY + 26).stroke();

      doc.text('SEC:', 450, currentY + 18);
      doc.strokeColor('#9ca3af').lineWidth(0.5).moveTo(480, currentY + 26).lineTo(530, currentY + 26).stroke();

      doc.y = currentY + 55;
      doc.moveDown(1.2);

      // --- ADDITIONAL INSTRUCTIONS ---
      if (assignment.additionalInstructions) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('General Instructions:');
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#4b5563').text(assignment.additionalInstructions);
        doc.moveDown(1.5);
      }

      // --- SECTIONS & QUESTIONS ---
      let questionIndex = 1;

      assignment.sections.forEach((section) => {
        // Check page overflow before writing section header
        if (doc.y > 700) {
          doc.addPage();
        }

        // Section Title Banner
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(section.title.toUpperCase(), { underline: true });
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#4b5563').text(`(${section.instruction})`);
        doc.moveDown(0.8);

        section.questions.forEach((q) => {
          // Check page overflow
          if (doc.y > 720) {
            doc.addPage();
          }

          const qY = doc.y;
          // Format text cleanly
          doc.font('Helvetica').fontSize(10).fillColor('#111827');
          doc.text(`Q${questionIndex}.  ${q.text}`, 50, qY, { width: 420 });

          // Marks aligned right
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#4b5563');
          doc.text(`[${q.marks} M]`, 490, qY, { align: 'right' });

          // Print difficulty badge metadata next to question
          const diffText = `Difficulty: ${q.difficulty.toUpperCase()}`;
          doc.font('Helvetica-Oblique').fontSize(8).fillColor('#9ca3af');
          doc.text(diffText, 50, doc.y + 3);
          
          doc.moveDown(1.5);
          questionIndex++;
        });
      });

      // --- FOOTER NOTE ---
      doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, 770).lineTo(545, 770).stroke();
      doc.font('Helvetica').fontSize(8).fillColor('#9ca3af').text('Powered by VedaAI Assessment Creator', 50, 775, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/uploads/${fileName}`);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};
