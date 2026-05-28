'use client';

import { useState } from 'react';
import { Sparkles, Calendar, Award, MessageSquare, Copy, FileDown, Check, ChevronRight, Printer } from 'lucide-react';
import Header from '../../components/Header';
import { useToast } from '../../components/Toast';

const isClient = typeof window !== 'undefined';
const getApiBase = () => {
  if (!isClient) return 'http://localhost:5000/api';
  const isStandaloneDev = window.location.port === '3000';
  return isStandaloneDev ? 'http://localhost:5000/api' : `${window.location.protocol}//${window.location.host}/api`;
};
const API_BASE = getApiBase();

export default function Toolkit() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('lesson');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('Grade 10');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'text'>('form');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const renderConsoleContent = () => {
    if (!aiResponse) return null;

    const lines = aiResponse.split('\n');

    return (
      <div className="checklist-render-view">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          
          if (trimmed === '') {
            return <div key={idx} style={{ height: '8px' }} />;
          }

          if (trimmed.includes('─') || trimmed.includes('=')) {
            return <div key={idx} className="checklist-divider" />;
          }

          // Clean bullet prefixes first to check for header patterns underneath
          const cleanText = trimmed.replace(/^[•\-*]\s*/, '').trim();

          // Detect headers (including if they had a bullet prefix originally)
          const isHeader = trimmed.startsWith('#') || 
                           cleanText.match(/^(Day \d+|Day [A-Za-z]+|Tasks to Do|Objectives|Activity|Learning Activities|Criteria \d+):/i) || 
                           (cleanText.length > 2 && cleanText === cleanText.toUpperCase() && !cleanText.includes('─') && !cleanText.includes('='));

          if (isHeader) {
            const cleanHeader = cleanText.replace(/^#+\s*/, '');
            return (
              <h4 key={idx} className="checklist-header">
                {cleanHeader}
              </h4>
            );
          }

          // Check if it is a bullet point (meaning it originally started with •, -, or *)
          const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');

          if (isBullet) {
            const itemKey = `item-${idx}-${cleanText.slice(0, 15)}`;
            const isChecked = checkedItems[itemKey] || false;

            return (
              <label key={idx} className="checklist-item">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={(e) => setCheckedItems({
                    ...checkedItems,
                    [itemKey]: e.target.checked
                  })}
                  className="checklist-checkbox"
                />
                <span className="checklist-text">{cleanText}</span>
              </label>
            );
          }

          // Otherwise normal text lines
          return (
            <p key={idx} className="checklist-normal-text">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  const handleQuickGenerate = async () => {
    if (!topic.trim()) {
      showToast('Please specify a topic or keyword to begin!', 'warning');
      return;
    }

    setLoading(true);
    setAiResponse('');
    setCopied(false);

    try {
      // Call real Groq API via backend
      const toolNames: Record<string, string> = {
        lesson: 'lesson plan',
        comments: 'grade book comments',
        rubric: 'grading rubric'
      };
      const res = await fetch(`${API_BASE}/toolkit/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: activeTab, topic, grade })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.result);
        showToast('AI content generated successfully!', 'success');
      } else {
        throw new Error('API error');
      }
    } catch {
      // Graceful fallback with rich template
      const toolLabel = activeTab === 'lesson' ? 'Lesson Plan' : activeTab === 'comments' ? 'Grade Comments' : 'Rubric';
      setAiResponse(`📋 [AI Generated ${toolLabel}: ${topic} — ${grade}]\n${'─'.repeat(60)}\n\nThis is a detailed AI-generated ${toolLabel.toLowerCase()} for "${topic}" tailored for ${grade} students.\n\n• Objectives clearly mapped to curriculum standards\n• Differentiated learning outcomes for mixed ability groups\n• Assessment criteria aligned with national benchmarks\n• Real-world applications and worked examples included\n\nNote: Backend connection unavailable. This is a preview template.\nConnect your Groq API to get fully customized AI content.`);
      showToast('Generated using template (backend offline)', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse).then(() => {
      setCopied(true);
      showToast('Content copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = async () => {
    if (!aiResponse) return;

    showToast('Compiling checklist PDF...', 'info');

    try {
      const res = await fetch(`${API_BASE}/toolkit/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: activeTab,
          topic,
          grade,
          aiResponse
        })
      });

      if (!res.ok) throw new Error('PDF Generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VedaAI-${activeTab}-${topic.replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('PDF checklist exported successfully!', 'success');
    } catch (err) {
      console.error('PDF Export failed:', err);
      showToast('Failed to compile PDF. Exporting as raw text instead.', 'warning');
      
      // Graceful fallback to text download
      const blob = new Blob([aiResponse], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VedaAI-${activeTab}-${topic.replace(/\s+/g, '-')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('VedaAI: Print checklist triggered.');
    try {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      } else {
        throw new Error('window.print is not defined or supported in this browser environment');
      }
    } catch (err) {
      console.error('VedaAI Print failed:', err);
      showToast('Print is unsupported or blocked by this browser/sandbox. Please press Ctrl+P or open in a new tab.', 'warning');
    }
  };

  const tools = [
    { id: 'lesson', title: 'Lesson Plan Drafter', desc: 'Create a 1-week syllabus outline.', icon: Calendar, color: '#f59e0b' },
    { id: 'comments', title: 'Grading Comments Writer', desc: 'Draft feedback comment scripts.', icon: MessageSquare, color: '#3b82f6' },
    { id: 'rubric', title: 'Rubric Blueprint Maker', desc: 'Design grading blueprints and weights.', icon: Award, color: '#10b981' }
  ];

  const toolTitles: Record<string, string> = {
    lesson: 'Lesson Plan Drafter',
    comments: 'Grading Comments',
    rubric: 'Rubric Blueprint'
  };

  return (
    <>
      <Header breadcrumbs={['AI Teacher\'s Toolkit']} />

      <div className="toolkit-container animate-fade-in">
        <div className="title-row">
          <div>
            <h1 className="toolkit-title">AI Teacher's Toolkit</h1>
            <p className="toolkit-subtitle">Leverage custom AI engines to streamline lesson planning, comments drafting, and rubrics.</p>
          </div>
        </div>

        <div className="toolkit-workspace">
          {/* Left panel - Tools select */}
          <div className="left-panel">
            <h3 className="panel-title">Select Assistant</h3>
            <div className="tools-list">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTab === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTab(tool.id);
                      setAiResponse('');
                    }}
                    className={`tool-select-btn ${isActive ? 'active' : ''}`}
                  >
                    <div className="btn-inner">
                      <div className="icon-badge" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}>
                        <Icon size={16} />
                      </div>
                      <div className="tool-details">
                        <span className="tool-name">{tool.title}</span>
                        <span className="tool-desc">{tool.desc}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="arrow-icon" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel - Input/Output */}
          <div className="right-panel">
            <h3 className="panel-title">Configure Parameters</h3>
            <div className="parameter-form">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Syllabus Topic / Subject Keywords</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Electric Resistance and Circuits"
                    className="form-input"
                  />
                </div>

                <div className="form-group max-w-160">
                  <label className="form-label">Target Grade</label>
                  <select 
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="form-select"
                  >
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleQuickGenerate}
                disabled={loading}
                className="btn-quick-generate"
              >
                <Sparkles size={16} />
                <span>{loading ? 'AI Engine Thinking...' : 'Draft with AI'}</span>
              </button>
            </div>

            {/* AI Console Screen */}
            {(aiResponse || loading) && (
              <div className="ai-output-console">
                <div className="console-header">
                  <div className="console-header-left">
                    <Sparkles size={14} className="sparkle-glow" />
                    <span>{toolTitles[activeTab]} — AI Output</span>
                  </div>
                  {aiResponse && !loading && (
                    <div className="console-actions">
                      {/* View mode toggle pill */}
                      <div className="view-mode-toggles">
                        <button 
                          type="button"
                          className={`btn-toggle-view ${viewMode === 'form' ? 'active' : ''}`}
                          onClick={() => setViewMode('form')}
                        >
                          Checklist Form
                        </button>
                        <button 
                          type="button"
                          className={`btn-toggle-view ${viewMode === 'text' ? 'active' : ''}`}
                          onClick={() => setViewMode('text')}
                        >
                          Raw Text
                        </button>
                      </div>

                      {/* Print Checklist Form Button */}
                      <button 
                        type="button"
                        className="btn-console-action" 
                        onClick={handlePrint}
                        title="Print Checklist as PDF Form"
                      >
                        <Printer size={13} />
                        <span>Print</span>
                      </button>

                      <button type="button" className="btn-console-action" onClick={handleCopy} title="Copy to clipboard">
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button type="button" className="btn-console-action" onClick={handleExport} title="Export as text file">
                        <FileDown size={13} />
                        <span>Export</span>
                      </button>
                    </div>
                  )}
                </div>
                {loading ? (
                  <div className="console-loader">
                    <LoaderSpinner />
                    <span>Analyzing syllabus parameters...</span>
                  </div>
                ) : (
                  <div className="console-scroll-container printable-area">
                    {viewMode === 'form' ? renderConsoleContent() : <pre className="console-text">{aiResponse}</pre>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .toolkit-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .toolkit-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .toolkit-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }

        /* Workspace Grid Split */
        .toolkit-workspace {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .left-panel {
          width: 300px;
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }

        .right-panel {
          flex: 1;
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
          min-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .panel-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .tools-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tool-select-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          border: 1px solid var(--border-light);
          background-color: var(--bg-main);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          text-align: left;
        }

        .tool-select-btn:hover {
          background-color: #ffffff;
          border-color: var(--accent-primary);
        }

        .tool-select-btn.active {
          border-color: var(--accent-primary);
          background-color: #fff7ed;
          box-shadow: var(--shadow-sm);
        }

        .btn-inner {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-badge {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tool-details {
          display: flex;
          flex-direction: column;
        }

        .tool-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .tool-desc {
          font-size: 10px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .arrow-icon {
          color: var(--text-muted);
          transition: transform 0.15s ease;
        }

        .tool-select-btn:hover .arrow-icon {
          color: var(--accent-primary);
          transform: translateX(2px);
        }

        /* Forms */
        .parameter-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .flex-1 { flex: 1; }
        .max-w-160 { max-width: 160px; }

        .form-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
          display: block;
        }

        .form-input, .form-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          font-size: 13px;
        }

        .form-input:focus {
          border-color: var(--border-focus);
        }

        .btn-quick-generate {
          align-self: flex-end;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--accent-gradient);
          color: #ffffff;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 13px;
          border: none;
          box-shadow: 0 4px 10px rgba(234, 88, 12, 0.25);
          cursor: pointer;
        }

        .btn-quick-generate:hover {
          transform: translateY(-1px);
        }

        /* AI Output console screen */
        .ai-output-console {
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 20px;
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: fadeIn 0.3s ease forwards;
          box-shadow: var(--shadow-sm);
        }

        .console-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-family: var(--font-inter);
          font-size: 12px;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 8px;
          font-weight: 600;
          position: relative;
          z-index: 20;
        }

        .console-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          z-index: 25;
        }

        .console-actions {
          display: flex;
          gap: 6px;
          align-items: center;
          position: relative;
          z-index: 30;
        }

        .btn-console-action {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-console-action:hover {
          background-color: var(--bg-main);
          color: var(--text-primary);
          border-color: var(--accent-primary);
        }

        .sparkle-glow {
          color: var(--accent-primary);
          animation: pulse 1.5s infinite;
        }

        .console-loader {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 0;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
        }

        .console-text {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          color: var(--text-primary);
          height: 240px;
          overflow-y: auto;
          text-align: left;
        }

        .console-scroll-container {
          height: 280px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .checklist-render-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: var(--text-primary);
          text-align: left;
        }

        .checklist-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          user-select: none;
          padding: 10px 14px;
          background-color: var(--bg-main);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          transition: all 0.15s ease;
        }

        .checklist-item:hover {
          background-color: #ffffff;
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-sm);
        }

        .checklist-checkbox {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid var(--text-muted);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          display: grid;
          place-content: center;
          margin-top: 1px;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .checklist-checkbox:checked {
          border-color: var(--accent-primary);
          background-color: var(--accent-primary);
        }

        .checklist-checkbox::before {
          content: "";
          width: 10px;
          height: 10px;
          transform: scale(0);
          transition: 120ms transform ease-in-out;
          box-shadow: inset 1em 1em white;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }

        .checklist-checkbox:checked::before {
          transform: scale(1);
        }

        .checklist-text {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.5;
          transition: all 0.15s ease;
        }

        .checklist-checkbox:checked + .checklist-text {
          color: var(--text-muted);
          text-decoration: line-through;
        }

        .checklist-header {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 18px;
          margin-bottom: 6px;
          border-left: 3px solid var(--accent-primary);
          padding-left: 10px;
        }

        .checklist-divider {
          height: 1px;
          background-color: var(--border-light);
          margin: 12px 0;
        }

        .checklist-normal-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* View Mode Toggles */
        .view-mode-toggles {
          display: flex;
          background-color: var(--bg-main);
          border-radius: 6px;
          padding: 2px;
          margin-right: 8px;
          border: 1px solid var(--border-light);
        }

        .btn-toggle-view {
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 700;
          color: var(--text-secondary);
          background: none;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-toggle-view:hover {
          color: var(--text-primary);
        }

        .btn-toggle-view.active {
          background-color: var(--accent-primary);
          color: #ffffff;
        }

        /* Responsive Breakpoints for All Types of Screens */
        @media (max-width: 1024px) {
          .left-panel {
            width: 100% !important;
          }
          .console-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding-bottom: 12px !important;
          }
          .console-actions {
            flex-wrap: wrap !important;
            width: 100% !important;
            gap: 8px !important;
          }
          .view-mode-toggles {
            margin-right: 0 !important;
            width: 100% !important;
            justify-content: space-between !important;
          }
          .btn-toggle-view {
            flex: 1 !important;
            text-align: center !important;
          }
          .btn-console-action {
            flex: 1 !important;
            justify-content: center !important;
            min-width: 80px !important;
          }
        }

        @media (max-width: 640px) {
          .toolkit-container {
            padding: 16px !important;
            gap: 16px !important;
          }
          .toolkit-workspace {
            gap: 16px !important;
          }
          .left-panel, .right-panel {
            padding: 16px !important;
            border-radius: 16px !important;
          }
          .form-row {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .max-w-160 {
            max-width: 100% !important;
          }
          .btn-quick-generate {
            width: 100% !important;
            justify-content: center !important;
            margin-top: 4px !important;
          }
          .toolkit-title {
            font-size: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .console-actions {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .view-mode-toggles {
            grid-column: span 3 !important;
            width: 100% !important;
            margin-right: 0 !important;
          }
          .btn-console-action {
            min-width: 0 !important;
            padding: 6px 4px !important;
            font-size: 10px !important;
          }
        }
      `}</style>
    </>
  );
}

function LoaderSpinner() {
  return (
    <div className="spinner">
      <style jsx>{`
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #334155;
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
