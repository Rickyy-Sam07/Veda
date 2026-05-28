'use client';

import { useState, useRef } from 'react';
import { FileText, FolderPlus, Download, ExternalLink, Calendar, Search, X, Eye, Trash2, Upload } from 'lucide-react';
import Header from '../../components/Header';
import { useToast } from '../../components/Toast';

interface LibraryFile {
  id: number;
  title: string;
  type: string;
  size: string;
  date: string;
  avatar: string;
  url?: string;
}

const INITIAL_FILES: LibraryFile[] = [
  { id: 1, title: 'Standard 10 Physics Curriculum (NCERT)', type: 'PDF Syllabus', size: '2.4 MB', date: '12-04-2026', avatar: '📚' },
  { id: 2, title: 'Advanced Calculus Textbook Reference Chapters', type: 'PDF Document', size: '8.1 MB', date: '04-05-2026', avatar: '📊' },
  { id: 3, title: 'Formative Assessment Guidelines and Marks Distribution', type: 'Text Guidelines', size: '128 KB', date: '20-05-2026', avatar: '📝' },
  { id: 4, title: 'Electricity Lab Simulation Procedures Class 10', type: 'HTML Workbook', size: '850 KB', date: '25-05-2026', avatar: '⚡' },
];

export default function Library() {
  const { showToast } = useToast();
  const [files, setFiles] = useState<LibraryFile[]>(INITIAL_FILES);
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState<LibraryFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = files.filter((f) => f.title.toLowerCase().includes(search.toLowerCase()) || f.type.toLowerCase().includes(search.toLowerCase()));

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: LibraryFile[] = [];
    Array.from(fileList).forEach((file) => {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const typeMap: Record<string, string> = { PDF: 'PDF Document', TXT: 'Text Guidelines', DOC: 'Word Document', DOCX: 'Word Document', HTML: 'HTML Workbook' };
      newFiles.push({
        id: Date.now() + Math.random(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: typeMap[ext] || `${ext} File`,
        size: formatSize(file.size),
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        avatar: ext === 'PDF' ? '📄' : ext === 'TXT' ? '📝' : '📁',
        url: URL.createObjectURL(file),
      });
    });
    setFiles((prev) => [...newFiles, ...prev]);
    showToast(`${newFiles.length} file(s) uploaded successfully!`, 'success');
  };

  const handleDelete = (id: number, title: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    showToast(`"${title}" removed from library.`, 'info');
  };

  const handleDownload = (file: LibraryFile) => {
    if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.title;
      a.click();
    }
    showToast(`Downloading "${file.title}"...`, 'info');
  };

  const handleOpen = (file: LibraryFile) => {
    if (file.url) {
      window.open(file.url, '_blank');
    } else {
      setPreviewFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <>
      <Header breadcrumbs={['My Library']} />

      <div className="library-container animate-fade-in">
        <div className="title-row">
          <div>
            <h1 className="library-title">My Syllabus Library</h1>
            <p className="library-subtitle">Upload and organize textbook materials, reference syllabi, and guidelines for your AI question engines.</p>
          </div>
          <button className="btn-add-ref" onClick={() => fileInputRef.current?.click()}>
            <FolderPlus size={16} />
            <span>Upload Reference File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx,.html"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={20} className="drop-icon" />
          <span className="drop-text">
            {isDragging ? 'Drop files here to upload!' : 'Drag & drop files here, or click to browse'}
          </span>
          <span className="drop-hint">PDF, TXT, DOC, HTML accepted</span>
        </div>

        {/* Search Panel */}
        <div className="search-bar-row">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search saved references..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn-clear-search" onClick={() => setSearch('')}><X size={12} /></button>
            )}
          </div>
          <span className="file-count">{filtered.length} {filtered.length === 1 ? 'file' : 'files'}</span>
        </div>

        {/* Files Table List */}
        <div className="library-table-wrapper">
          {filtered.length === 0 ? (
            <div className="table-empty">
              {search ? `No files found for "${search}"` : 'No files yet. Upload your first reference!'}
            </div>
          ) : (
            <table className="library-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Format Type</th>
                  <th>File Size</th>
                  <th>Uploaded On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="file-name-cell">
                        <span className="file-avatar">{file.avatar}</span>
                        <span className="file-title">{file.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="format-badge">{file.type}</span>
                    </td>
                    <td className="size-text">{file.size}</td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={12} />
                        <span>{file.date}</span>
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn-action-icon"
                          onClick={() => handleDownload(file)}
                          title="Download File"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          className="btn-action-icon"
                          onClick={() => handleOpen(file)}
                          title="Preview Document"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn-action-icon danger"
                          onClick={() => handleDelete(file.id, file.title)}
                          title="Remove from Library"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <div className="preview-title-row">
                <span className="preview-avatar">{previewFile.avatar}</span>
                <div>
                  <h3 className="preview-title">{previewFile.title}</h3>
                  <p className="preview-meta">{previewFile.type} • {previewFile.size} • Uploaded {previewFile.date}</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setPreviewFile(null)}><X size={18} /></button>
            </div>
            <div className="preview-body">
              <div className="preview-placeholder">
                <span className="preview-icon">{previewFile.avatar}</span>
                <p>Document preview not available for this file type.</p>
                <p className="preview-hint">Use the download button to open this file in your local viewer.</p>
                <button className="btn-download-preview" onClick={() => { handleDownload(previewFile); setPreviewFile(null); }}>
                  <Download size={14} />
                  Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .library-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .library-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .library-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .btn-add-ref {
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
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-ref:hover { transform: translateY(-1px); }

        /* Drop Zone */
        .drop-zone {
          border: 2px dashed var(--border-light);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: var(--bg-sidebar);
        }

        .drop-zone:hover, .drop-zone.dragging {
          border-color: var(--accent-primary);
          background-color: #fffaf7;
        }

        .drop-zone.dragging { background-color: #fff7ed; }

        .drop-icon { color: var(--accent-primary); }

        .drop-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .drop-hint {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Search Bar */
        .search-bar-row {
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          padding: 10px 16px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .search-box {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 8px 36px;
          border: 1px solid var(--border-light);
          border-radius: 9999px;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .search-input:focus { border-color: var(--border-focus); outline: none; }

        .btn-clear-search {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }

        .file-count {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          white-space: nowrap;
        }

        /* Table Styles */
        .library-table-wrapper {
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          box-shadow: var(--shadow-sm);
          overflow-x: auto;
        }

        .table-empty {
          padding: 60px;
          text-align: center;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .library-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .library-table th {
          background-color: var(--bg-main);
          padding: 14px 18px;
          font-weight: 750;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-light);
        }

        .library-table td {
          padding: 14px 18px;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-light);
        }

        .library-table tr:last-child td { border-bottom: none; }
        .library-table tr:hover td { background-color: #fafbfc; }

        .file-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-avatar {
          font-size: 20px;
          width: 36px;
          height: 36px;
          background-color: var(--bg-main);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        .file-title {
          font-weight: 700;
          color: var(--text-primary);
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .format-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: #f3f4f6;
          color: #4b5563;
          white-space: nowrap;
        }

        .size-text {
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .date-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .date-cell span { color: var(--text-secondary); }

        .actions-cell { display: flex; gap: 6px; }

        .btn-action-icon {
          background: none;
          border: 1px solid var(--border-light);
          padding: 6px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .btn-action-icon:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background-color: #fffaf7;
        }

        .btn-action-icon.danger:hover {
          border-color: #ef4444;
          color: #ef4444;
          background-color: #fef2f2;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeIn 0.15s ease;
        }

        .preview-modal {
          background: #ffffff;
          border-radius: 24px;
          width: 100%;
          max-width: 540px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .preview-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-light);
          background-color: var(--bg-main);
          gap: 12px;
        }

        .preview-title-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .preview-avatar {
          font-size: 28px;
          width: 48px;
          height: 48px;
          background: #ffffff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        .preview-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .preview-meta {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .btn-close-modal {
          background: none;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 6px;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          transition: all 0.1s ease;
          flex-shrink: 0;
        }

        .btn-close-modal:hover { background-color: #fef2f2; color: #ef4444; border-color: #ef4444; }

        .preview-body {
          padding: 40px 24px;
        }

        .preview-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
          color: var(--text-secondary);
        }

        .preview-icon { font-size: 48px; }

        .preview-placeholder p {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .preview-hint {
          font-size: 13px !important;
          color: var(--text-secondary) !important;
          font-weight: 400 !important;
        }

        .btn-download-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 10px 20px;
          background: var(--accent-gradient);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
          transition: all 0.2s ease;
        }

        .btn-download-preview:hover { transform: translateY(-1px); }
      `}</style>
    </>
  );
}
