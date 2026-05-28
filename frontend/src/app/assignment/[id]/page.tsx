'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Eye, 
  GraduationCap, 
  Edit3, 
  Check, 
  HelpCircle, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Printer,
  AlertTriangle,
  X
} from 'lucide-react';
import Header from '../../../components/Header';
import { useStore, IQuestion } from '../../../store/useStore';
import { useToast } from '../../../components/Toast';

const isClient = typeof window !== 'undefined';
const getBackendHost = () => {
  if (!isClient) return 'http://localhost:5000';
  const isStandaloneDev = window.location.port === '3000';
  return isStandaloneDev ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.host}`;
};
const BACKEND_HOST = getBackendHost();

export default function AssignmentDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { 
    activeAssignment, 
    isLoading, 
    fetchAssignmentById, 
    regenerateEntireAssignment,
    regenerateQuestion,
    updateQuestionInline,
    recompilePDF
  } = useStore();

  // Teacher Toggles
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  
  // Custom Header States (Bonus 5)
  const [schoolName, setSchoolName] = useState('Delhi Public School');
  const [examTerm, setExamTerm] = useState('First Term Examinations (2026)');
  const [isCompilingPDF, setIsCompilingPDF] = useState(false);

  // Student Simulator States (Bonus 4)
  const [isStudentMode, setIsStudentMode] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Single Question Regen Loaders (Bonus 3)
  const [loadingRegenId, setLoadingRegenId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAssignmentById(id);
    }
  }, [id, fetchAssignmentById]);

  // Exam timer logic
  useEffect(() => {
    if (isStudentMode) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStudentMode]);

  if (isLoading && !activeAssignment) {
    return (
      <div className="center-loader">
        <RefreshCw size={32} className="animate-spin-slow" color="var(--accent-primary)" />
        <p>Loading assessment details...</p>
      </div>
    );
  }

  if (!activeAssignment) {
    return (
      <div className="error-state">
        <p>Could not locate the requested assignment sheet.</p>
        <button onClick={() => router.push('/')} className="btn-back-home">
          Go Back
        </button>
      </div>
    );
  }

  const handleRegenerateEntire = async () => {
    setShowRegenConfirm(false);
    showToast('Regenerating entire assessment... this may take a moment.', 'info');
    await regenerateEntireAssignment(activeAssignment!._id);
    showToast('Assessment regeneration queued successfully!', 'success');
  };

  const handleRegenerateSingle = async (qId: string) => {
    setLoadingRegenId(qId);
    try {
      await regenerateQuestion(activeAssignment!._id, qId);
      showToast('Question regenerated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to regenerate question.', 'error');
    } finally {
      setLoadingRegenId(null);
    }
  };

  const handleSaveInlineEdit = async (qId: string) => {
    if (editingText.trim()) {
      await updateQuestionInline(activeAssignment!._id, qId, { text: editingText });
      showToast('Question updated successfully!', 'success');
    }
    setEditingQuestionId(null);
  };

  const handleCompilePDF = async () => {
    setIsCompilingPDF(true);
    showToast('Compiling PDF with custom headers...', 'info');
    await recompilePDF(activeAssignment!._id, schoolName, examTerm);
    
    // Give worker 2 seconds to recompile the PDFKit file
    setTimeout(async () => {
      await fetchAssignmentById(activeAssignment!._id);
      setIsCompilingPDF(false);
      showToast('PDF compiled successfully with custom exam headers!', 'success');
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStudentSubmit = () => {
    showToast('🎉 Assessment submitted! Your responses have been recorded.', 'success');
    setIsStudentMode(false);
    setStudentAnswers({});
  };

  return (
    <>
      <Header breadcrumbs={['Assignment', activeAssignment.title]} backHref="/" />

      <div className="detail-container animate-fade-in">
        {/* TOP INTERACTIVE TOGGLE PANEL */}
        <div className="toggles-panel">
          <div className="mode-tabs">
            <button 
              className={`mode-tab ${!isStudentMode ? 'active' : ''}`}
              onClick={() => setIsStudentMode(false)}
            >
              👨‍🏫 Teacher Mode
            </button>
            <button 
              className={`mode-tab ${isStudentMode ? 'active' : ''}`}
              onClick={() => setIsStudentMode(true)}
            >
              ✏️ Student Exam Simulator
            </button>
          </div>

          {!isStudentMode ? (
            /* Teacher Tools Panel */
            <div className="teacher-controls">
              <button 
                onClick={() => setShowAnswerKey(!showAnswerKey)} 
                className={`btn-toggle-key ${showAnswerKey ? 'active' : ''}`}
              >
                <Eye size={16} />
                <span>{showAnswerKey ? 'Hide Answer Key' : 'Reveal Answer Keys'}</span>
              </button>
              
              <div className="pdf-header-customizer">
                <input 
                  type="text" 
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="School Name"
                  className="customizer-input"
                  title="Customize School Header on generated PDF"
                />
                <input 
                  type="text" 
                  value={examTerm}
                  onChange={(e) => setExamTerm(e.target.value)}
                  placeholder="Exam Term"
                  className="customizer-input"
                  title="Customize Exam Label on generated PDF"
                />
                <button 
                  onClick={handleCompilePDF} 
                  disabled={isCompilingPDF}
                  className="btn-update-pdf"
                >
                  {isCompilingPDF ? 'Compiling...' : 'Update PDF Header'}
                </button>
              </div>
            </div>
          ) : (
            /* Student Mode details */
            <div className="student-timer-box">
              <Clock size={16} className="timer-icon animate-pulse-slow" />
              <span>Time Remaining: <strong className="timer-value">{formatTime(timeLeft)}</strong></span>
            </div>
          )}
        </div>

        {/* ASSESSMENT VIEW SHEET */}
        <div className="exam-paper-card">
          {/* Printable Layout Sheet Header */}
          <div className="exam-sheet-header">
            <h1 className="exam-school-title">
              {isStudentMode ? schoolName.toUpperCase() : schoolName.toUpperCase()}
            </h1>
            <p className="exam-sheet-term">
              {isStudentMode ? examTerm.toUpperCase() : examTerm.toUpperCase()}
            </p>
            <div className="double-border-line"></div>
          </div>

          {/* Exam Title & Meta */}
          <div className="exam-meta-block">
            <h2 className="exam-subject-title">SUBJECT: {activeAssignment.title.toUpperCase()}</h2>
            <div className="meta-grid">
              <span><strong>Due Date:</strong> {new Date(activeAssignment.dueDate).toLocaleDateString()}</span>
              <span><strong>Total Questions:</strong> {activeAssignment.numberOfQuestions}</span>
              <span><strong>Total Marks:</strong> {activeAssignment.totalMarks} Marks</span>
            </div>
          </div>

          {/* Figma Perfect Student Lines */}
          <div className="student-lines-box">
            <div className="student-line-field">
              <span className="line-label">STUDENT NAME:</span>
              <input type="text" className="line-input" placeholder="Enter student name" readOnly={!isStudentMode} />
            </div>
            
            <div className="student-line-field max-w-160">
              <span className="line-label">ROLL NO:</span>
              <input type="text" className="line-input text-center" placeholder="____" readOnly={!isStudentMode} />
            </div>

            <div className="student-line-field max-w-100">
              <span className="line-label">SEC:</span>
              <input type="text" className="line-input text-center" placeholder="___" readOnly={!isStudentMode} />
            </div>
          </div>

          {/* Instructions Box */}
          {activeAssignment.additionalInstructions && (
            <div className="exam-instructions-box">
              <h4 className="instructions-title">General Instructions:</h4>
              <p className="instructions-text">{activeAssignment.additionalInstructions}</p>
            </div>
          )}

          {/* Render Sections */}
          <div className="sections-list">
            {activeAssignment.sections.map((section, sIdx) => (
              <div key={sIdx} className="section-block">
                <h3 className="section-title">{section.title.toUpperCase()}</h3>
                <p className="section-instruction">({section.instruction})</p>

                <div className="questions-list">
                  {section.questions.map((question, qIdx) => {
                    const isEditing = editingQuestionId === question.id;
                    const isRegenerating = loadingRegenId === question.id;

                    return (
                      <div key={question.id} className="question-wrapper">
                        <div className="question-header">
                          <div className="question-left-info">
                            <span className="q-number">Q{qIdx + 1}.</span>
                            
                            {/* Editable Question Text Panel */}
                            {isEditing ? (
                              <div className="inline-edit-box">
                                <textarea 
                                  value={editingText} 
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="edit-textarea"
                                  rows={2}
                                />
                                <button 
                                  onClick={() => handleSaveInlineEdit(question.id)} 
                                  className="btn-save-edit"
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            ) : (
                              <p className="q-text">{question.text}</p>
                            )}
                          </div>

                          <div className="question-right-info">
                            {/* Difficulty Badges */}
                            <span className={`difficulty-badge badge-${question.difficulty}`}>
                              {question.difficulty}
                            </span>
                            <span className="q-marks">[{question.marks} Marks]</span>

                            {/* Inline Tools for Teacher Mode (Bonus 3) */}
                            {!isStudentMode && !isEditing && (
                              <div className="question-tools">
                                <button 
                                  onClick={() => {
                                    setEditingQuestionId(question.id);
                                    setEditingText(question.text);
                                  }} 
                                  className="tool-btn" 
                                  title="Edit Question Inline"
                                >
                                  <Edit3 size={12} />
                                </button>
                                
                                <button 
                                  onClick={() => handleRegenerateSingle(question.id)} 
                                  disabled={isRegenerating}
                                  className={`tool-btn ${isRegenerating ? 'animate-spin-slow' : ''}`}
                                  title="Regenerate this specific question"
                                >
                                  <RefreshCw size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Student Answer Box (Simulator Mode) */}
                        {isStudentMode && (
                          <div className="student-response-box">
                            <textarea
                              placeholder="Write your answer here..."
                              value={studentAnswers[question.id] || ''}
                              onChange={(e) => setStudentAnswers({
                                ...studentAnswers,
                                [question.id]: e.target.value
                              })}
                              className="student-answer-textarea"
                              rows={3}
                            />
                          </div>
                        )}

                        {/* Answer Key Display (Teacher Mode Toggle) */}
                        {!isStudentMode && showAnswerKey && question.answerKey && (
                          <div className="answer-key-box">
                            <h5 className="answer-key-title">🔑 AI Answer Key & Teacher Rubric:</h5>
                            <p className="answer-key-text">{question.answerKey}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM STICKY ACTION BAR */}
        <div className="action-bar-sticky">
          <button 
            onClick={() => router.push('/')} 
            className="btn-action-outline"
          >
            Back to Dashboard
          </button>

          {!isStudentMode ? (
            /* Teacher Action Panel */
            <div className="bar-right">
              <button 
                onClick={() => setShowRegenConfirm(true)} 
                className="btn-action-danger"
              >
                <RefreshCw size={14} />
                <span>Regenerate Assessment</span>
              </button>

              <a 
                href={activeAssignment.pdfPath ? `${BACKEND_HOST}${activeAssignment.pdfPath}` : '#'}
                download
                onClick={(e) => {
                  if (!activeAssignment.pdfPath) {
                    e.preventDefault();
                    showToast('PDF is still compiling. Please wait a few seconds and try again.', 'warning');
                  }
                }}
                className={`btn-action-primary ${!activeAssignment.pdfPath ? 'disabled' : ''}`}
              >
                <Download size={14} />
                <span>Download PDF</span>
              </a>
              <button onClick={handlePrint} className="btn-action-outline">
                <Printer size={14} />
                <span>Print</span>
              </button>
            </div>
          ) : (
            /* Student Action Panel */
            <div className="bar-right">
              <button 
                onClick={handleStudentSubmit} 
                className="btn-action-primary"
              >
                Submit Exam Paper
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Regenerate Confirmation Modal */}
      {showRegenConfirm && (
        <div className="modal-overlay" onClick={() => setShowRegenConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrap">
              <AlertTriangle size={28} color="#f59e0b" />
            </div>
            <h3 className="confirm-title">Regenerate Entire Assessment?</h3>
            <p className="confirm-desc">
              This will discard all current questions and custom edits, and generate a completely new assessment using AI. This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn-confirm-cancel" onClick={() => setShowRegenConfirm(false)}>
                Cancel
              </button>
              <button className="btn-confirm-danger" onClick={handleRegenerateEntire}>
                <RefreshCw size={14} />
                Yes, Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .detail-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 80px; /* space for sticky bar */
        }

        .center-loader, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 24px;
          gap: 16px;
          color: var(--text-secondary);
        }

        .btn-back-home {
          padding: 10px 20px;
          background-color: #111827;
          color: #ffffff;
          border-radius: 9999px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Toggles Panel */
        .toggles-panel {
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: var(--shadow-sm);
          flex-wrap: wrap;
          gap: 16px;
        }

        .mode-tabs {
          display: flex;
          background-color: var(--bg-main);
          padding: 4px;
          border-radius: var(--radius-md);
        }

        .mode-tab {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mode-tab.active {
          background-color: #ffffff;
          color: var(--accent-primary);
          box-shadow: var(--shadow-sm);
        }

        .teacher-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-toggle-key {
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

        .btn-toggle-key.active {
          background-color: #fff7ed;
          color: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .pdf-header-customizer {
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 1px solid var(--border-light);
          padding-left: 16px;
        }

        .customizer-input {
          padding: 8px 12px;
          font-size: 12px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          width: 140px;
        }

        .btn-update-pdf {
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          background-color: #1f2937;
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .student-timer-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #fef2f2;
          border-radius: 9999px;
          color: #ef4444;
          font-weight: 600;
          font-size: 13px;
        }

        .timer-icon {
          color: #ef4444;
        }

        /* Exam Paper Card */
        .exam-paper-card {
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 24px;
          padding: 40px 50px;
          box-shadow: var(--shadow-sm);
          max-width: 800px;
          margin: 0 auto;
          min-height: 800px;
        }

        .exam-sheet-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .exam-school-title {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .exam-sheet-term {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .double-border-line {
          height: 4px;
          border-top: 1.5px solid #9ca3af;
          border-bottom: 0.5px solid #9ca3af;
          margin-top: 12px;
        }

        .exam-meta-block {
          margin-bottom: 24px;
        }

        .exam-subject-title {
          font-size: 15px;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .meta-grid {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary);
          border-bottom: 1px dashed var(--border-light);
          padding-bottom: 12px;
        }

        /* Student Line Fields */
        .student-lines-box {
          display: flex;
          gap: 20px;
          border: 1px solid #d1d5db;
          padding: 16px;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
          background-color: #fafbfc;
        }

        .student-line-field {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .max-w-160 { max-width: 160px; }
        .max-w-100 { max-width: 100px; }

        .line-label {
          font-size: 11px;
          font-weight: 800;
          color: #374151;
          white-space: nowrap;
        }

        .line-input {
          width: 100%;
          border: none;
          border-bottom: 1px solid #9ca3af;
          background: none;
          font-size: 13px;
          font-weight: 600;
          padding: 2px 4px;
          color: #111827;
        }

        .line-input::placeholder {
          color: #cbd5e1;
          font-style: italic;
        }

        /* General Instructions */
        .exam-instructions-box {
          background-color: #fafbfc;
          border-left: 3px solid #6b7280;
          padding: 10px 14px;
          margin-bottom: 30px;
        }

        .instructions-title {
          font-size: 12px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .instructions-text {
          font-size: 12px;
          font-style: italic;
          color: #4b5563;
        }

        /* Section Layouts */
        .sections-list {
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .section-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 800;
          color: #111827;
          text-decoration: underline;
        }

        .section-instruction {
          font-size: 12px;
          font-style: italic;
          color: var(--text-secondary);
          margin-top: -6px;
          margin-bottom: 8px;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .question-wrapper {
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 16px;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .question-left-info {
          display: flex;
          gap: 8px;
          flex: 1;
        }

        .q-number {
          font-weight: 700;
          font-size: 14px;
          color: #111827;
        }

        .q-text {
          font-size: 14px;
          color: #111827;
          white-space: pre-line;
          line-height: 1.5;
        }

        .question-right-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .q-marks {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        /* Difficulty Badges */
        .difficulty-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
        }

        .badge-easy {
          background-color: var(--easy-bg);
          color: var(--easy-text);
          border: 1px solid var(--easy-border);
        }

        .badge-medium {
          background-color: var(--medium-bg);
          color: var(--medium-text);
          border: 1px solid var(--medium-border);
        }

        .badge-hard {
          background-color: var(--hard-bg);
          color: var(--hard-text);
          border: 1px solid var(--hard-border);
        }

        /* Inline Question Editor */
        .inline-edit-box {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          flex: 1;
        }

        .edit-textarea {
          flex: 1;
          padding: 8px;
          font-size: 13px;
          border: 1px solid var(--accent-primary);
          border-radius: var(--radius-sm);
        }

        .btn-save-edit {
          background-color: #10b981;
          color: #ffffff;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* Quick question tools next to tags */
        .question-tools {
          display: flex;
          gap: 4px;
          margin-left: 8px;
          border-left: 1px solid var(--border-light);
          padding-left: 8px;
        }

        .tool-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .tool-btn:hover {
          background-color: var(--bg-main);
          color: var(--accent-primary);
        }

        /* Student Answer Input Box */
        .student-response-box {
          margin-top: 10px;
          padding-left: 28px;
        }

        .student-answer-textarea {
          width: 100%;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          font-size: 13px;
          background-color: #fafbfc;
        }

        .student-answer-textarea:focus {
          border-color: var(--border-focus);
          background-color: #ffffff;
        }

        /* Answer Key Box */
        .answer-key-box {
          margin-top: 12px;
          margin-left: 28px;
          background-color: #fef8f5;
          border: 1px solid #fed7aa;
          border-radius: var(--radius-md);
          padding: 12px 16px;
        }

        .answer-key-title {
          font-size: 11px;
          font-weight: 800;
          color: var(--accent-primary);
          margin-bottom: 4px;
        }

        .answer-key-text {
          font-size: 13px;
          color: #7c2d12;
          line-height: 1.5;
        }

        /* Sticky Action Bar */
        .action-bar-sticky {
          position: fixed;
          bottom: 0;
          left: 260px; /* sidebar space */
          right: 0;
          height: 68px;
          background-color: #ffffff;
          border-top: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
          z-index: 80;
        }

        .btn-action-outline {
          padding: 10px 20px;
          border: 1px solid var(--border-light);
          background-color: #ffffff;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .btn-action-outline:hover {
          background-color: var(--bg-main);
          color: var(--text-primary);
        }

        .bar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-action-danger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: 1px solid var(--border-light);
          background-color: #ffffff;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          color: #dc2626;
          cursor: pointer;
        }

        .btn-action-danger:hover {
          background-color: #fef2f2;
          border-color: #fecaca;
        }

        .btn-action-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: var(--accent-gradient);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(234, 88, 12, 0.25);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(234, 88, 12, 0.35);
        }

        .btn-action-primary.disabled {
          background: var(--text-muted);
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media (max-width: 900px) {
          .action-bar-sticky {
            left: 0;
          }
        }

        /* Confirm Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeIn 0.15s ease;
        }

        .confirm-modal {
          background: #ffffff;
          border-radius: 20px;
          padding: 32px 28px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .confirm-icon-wrap {
          width: 56px;
          height: 56px;
          background-color: #fffbeb;
          border: 2px solid #fde68a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .confirm-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 10px;
        }

        .confirm-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .confirm-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .btn-confirm-cancel {
          padding: 10px 20px;
          border: 1px solid var(--border-light);
          background: #ffffff;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-confirm-cancel:hover { background-color: var(--bg-main); }

        .btn-confirm-danger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background-color: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 10px rgba(220, 38, 38, 0.25);
        }

        .btn-confirm-danger:hover { background-color: #b91c1c; transform: translateY(-1px); }

        @media print {
          .veda-sidebar, .veda-header, .toggles-panel, .action-bar-sticky {
            display: none !important;
          }
          .veda-workspace { margin-left: 0 !important; }
          .exam-paper-card { box-shadow: none; border: none; max-width: 100%; }
        }
      `}</style>
    </>
  );
}
