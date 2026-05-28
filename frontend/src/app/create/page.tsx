'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Upload, 
  HelpCircle, 
  Loader2, 
  Terminal, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Header from '../../components/Header';
import { useStore } from '../../store/useStore';

export default function CreateAssignment() {
  const router = useRouter();
  const { createAssignment, creationLogs, activeJobProgress, clearCreationLogs } = useStore();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['MCQ']);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(5);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  // File upload state (optional)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // App flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    // Clear old logs when mounting the create form
    clearCreationLogs();
  }, [clearCreationLogs]);

  // WebSocket redirection logic when generation finishes
  useEffect(() => {
    if (isSubmitting && createdId && activeJobProgress) {
      if (activeJobProgress.assignmentId === createdId) {
        if (activeJobProgress.step === 5 && activeJobProgress.log.includes(' Archiving') || activeJobProgress.log.toLowerCase().includes('ready') || activeJobProgress.log.toLowerCase().includes('success')) {
          // Trigger confetti explosion
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
          
          // Auto route to details in 1 second
          setTimeout(() => {
            router.push(`/assignment/${createdId}`);
          }, 1200);
        }
      }
    }
  }, [activeJobProgress, isSubmitting, createdId, router]);

  const handleCheckboxChange = (type: string) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((t) => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!title.trim()) {
      alert('Please provide a title for the assignment.');
      return;
    }
    if (!dueDate) {
      alert('Please specify a due date.');
      return;
    }
    if (new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
      alert('Due date cannot be in the past.');
      return;
    }
    if (numberOfQuestions <= 0) {
      alert('Number of questions must be a positive number.');
      return;
    }
    if (marksPerQuestion <= 0) {
      alert('Marks per question must be a positive number.');
      return;
    }

    setIsSubmitting(true);

    const assignment = await createAssignment({
      title,
      description,
      dueDate,
      questionTypes,
      numberOfQuestions,
      marksPerQuestion,
      additionalInstructions
    });

    if (assignment) {
      setCreatedId(assignment._id);
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header breadcrumbs={['Assignment', 'Create New']} backHref="/" />

      <div className="create-container animate-fade-in">
        {isSubmitting ? (
          /* Live WebSocket logger screen (Bonus Feature 2) */
          <div className="logger-panel card-glow">
            <div className="logger-header">
              <Terminal size={20} color="var(--accent-primary)" />
              <h3>VedaAI - Queue & Generation Engine</h3>
            </div>
            
            <div className="logger-console">
              {creationLogs.map((log, index) => {
                let isError = log.includes('❌') || log.toLowerCase().includes('failed');
                let isSuccess = log.includes('✅') || log.includes('✨') || log.toLowerCase().includes('ready');
                
                return (
                  <div 
                    key={index} 
                    className={`console-line ${isError ? 'line-error' : isSuccess ? 'line-success' : ''}`}
                  >
                    <span className="line-timestamp">[{new Date().toLocaleTimeString()}]</span>
                    <span className="line-text">{log}</span>
                  </div>
                );
              })}
              
              {!creationLogs.some((l) => l.includes('❌') || l.includes('Archiving')) && (
                <div className="console-line animate-pulse-slow font-italic">
                  <span className="line-timestamp">[{new Date().toLocaleTimeString()}]</span>
                  <span className="line-text">🤖 AI Engine is thinking... please hold on...</span>
                </div>
              )}
            </div>

            <div className="logger-footer">
              <Loader2 size={16} className="animate-spin-slow" color="var(--accent-primary)" />
              <span>
                {activeJobProgress 
                  ? `Processing Step ${activeJobProgress.step} of ${activeJobProgress.totalSteps}...`
                  : 'Contacting worker queue...'
                }
              </span>
            </div>
          </div>
        ) : (
          /* Form panel */
          <div className="form-card">
            <div className="form-header-row">
              <Sparkles size={20} className="sparkle-icon" />
              <h2>Build AI Assessment</h2>
            </div>

            <form onSubmit={handleSubmit} className="assignment-form">
              {/* Assignment Title */}
              <div className="form-group">
                <label className="form-label">Assignment Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Quiz on Electricity" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description / Subject Details</label>
                <textarea 
                  placeholder="e.g. Standard 10 Physics Assessment covering resistance, currents, and power."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              {/* Due Date & Files Upload Row */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Due Date *</label>
                  <div className="input-with-icon">
                    <Calendar size={16} className="input-icon" />
                    <input 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="form-input date-input"
                      required
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div className="form-group flex-1">
                  <label className="form-label">Reference Syllabus / Textbook PDF (Optional)</label>
                  <div className="file-upload-zone">
                    <Upload size={16} className="upload-icon" />
                    <span className="upload-text">
                      {uploadedFile ? uploadedFile.name : 'Upload PDF / Text guidelines'}
                    </span>
                    <input 
                      type="file" 
                      accept=".pdf,.txt" 
                      onChange={handleFileUpload} 
                      className="hidden-file-input"
                    />
                  </div>
                </div>
              </div>

              {/* Parameter Settings Row */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Number of Questions *</label>
                  <input 
                    type="number" 
                    min={1}
                    max={50}
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(parseInt(e.target.value, 10))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Marks per Question *</label>
                  <input 
                    type="number" 
                    min={1}
                    max={100}
                    value={marksPerQuestion}
                    onChange={(e) => setMarksPerQuestion(parseInt(e.target.value, 10))}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* Question Types Checkbox Selector */}
              <div className="form-group">
                <label className="form-label">Question Types (Select at least one) *</label>
                <div className="checkbox-row">
                  {['MCQ', 'Short Answer', 'Long Answer'].map((type) => {
                    const isChecked = questionTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleCheckboxChange(type)}
                        className={`checkbox-btn ${isChecked ? 'checked' : ''}`}
                      >
                        <span className="checkbox-indicator">{isChecked ? '✓' : ''}</span>
                        <span>{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="form-group">
                <label className="form-label">Additional Instructions / AI Prompt Guidelines</label>
                <textarea 
                  placeholder="e.g. Focus on parallel vs series circuits. Include mathematical equations for resistance calculations. Keep difficulty strictly balanced between moderate and easy."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="form-textarea"
                  rows={4}
                />
              </div>

              {/* Submit Row */}
              <div className="submit-row">
                <button type="submit" className="btn-submit">
                  <Sparkles size={16} />
                  <span>Generate AI Assessment</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        .create-container {
          padding: 24px;
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        /* Live Logger Screen */
        .logger-panel {
          width: 100%;
          max-width: 700px;
          background-color: #0f172a;
          border-radius: var(--radius-lg);
          border: 1px solid #334155;
          padding: 24px;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        }

        .logger-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #334155;
          padding-bottom: 12px;
        }

        .logger-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: #f1f5f9;
          font-family: var(--font-inter);
        }

        .logger-console {
          background-color: #020617;
          border-radius: var(--radius-md);
          padding: 16px;
          height: 320px;
          overflow-y: auto;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #1e293b;
        }

        .console-line {
          display: flex;
          gap: 10px;
          line-height: 1.5;
        }

        .line-timestamp {
          color: #64748b;
        }

        .line-text {
          color: #cbd5e1;
        }

        .line-error {
          color: #f87171;
        }

        .line-success {
          color: #4ade80;
        }

        .logger-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
        }

        /* Form styling */
        .form-card {
          width: 100%;
          max-width: 680px;
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: 24px;
          padding: 30px;
          box-shadow: var(--shadow-sm);
        }

        .form-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 16px;
          margin-bottom: 24px;
        }

        .sparkle-icon {
          color: var(--accent-primary);
        }

        .form-header-row h2 {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .assignment-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .flex-1 {
          flex: 1;
        }

        .form-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--text-primary);
          transition: all 0.15s ease;
        }

        .form-input:focus, .form-textarea:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.15);
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .date-input {
          padding-left: 36px;
        }

        .file-upload-zone {
          border: 1.5px dashed var(--border-light);
          background-color: var(--bg-main);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          position: relative;
          transition: all 0.15s ease;
        }

        .file-upload-zone:hover {
          border-color: var(--accent-primary);
          background-color: #fffaf7;
        }

        .upload-icon {
          color: var(--text-secondary);
        }

        .upload-text {
          font-size: 13px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hidden-file-input {
          position: absolute;
          left: 0; top: 0; right: 0; bottom: 0;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .checkbox-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid var(--border-light);
          background-color: #ffffff;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .checkbox-btn:hover {
          background-color: var(--bg-main);
        }

        .checkbox-btn.checked {
          border-color: var(--accent-primary);
          background-color: #fef2f2;
          color: var(--accent-primary);
        }

        .checkbox-indicator {
          font-size: 12px;
          font-weight: 800;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #ffffff;
          border: 1.5px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkbox-btn.checked .checkbox-indicator {
          background-color: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #ffffff;
        }

        .submit-row {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
          margin-top: 10px;
        }

        .btn-submit {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--accent-gradient);
          color: #ffffff;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 14px;
          border: none;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(234, 88, 12, 0.4);
        }

        @media (max-width: 600px) {
          .form-row {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </>
  );
}
