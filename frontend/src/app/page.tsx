'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  SlidersHorizontal, 
  MoreVertical, 
  Calendar, 
  Trash2, 
  Eye, 
  FileText, 
  Plus, 
  RefreshCw,
  X,
  ChevronDown
} from 'lucide-react';
import Header from '../components/Header';
import { useStore, IAssignment } from '../store/useStore';
import { useToast } from '../components/Toast';

const STATUS_FILTERS = ['All', 'pending', 'generating', 'completed', 'failed'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function Dashboard() {
  const router = useRouter();
  const { assignments, isLoading, fetchAssignments, deleteAssignment } = useStore();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Close filter menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAssignment(id);
    setActiveDropdown(null);
    showToast(`"${title}" deleted successfully.`, 'info');
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusLabels: Record<string, string> = {
    pending: 'Queued',
    generating: 'Generating',
    completed: 'Completed',
    failed: 'Failed'
  };

  return (
    <>
      <Header breadcrumbs={['Assignment']} />

      <div className="dashboard-container animate-fade-in">
        {/* Title Section */}
        <div className="title-row">
          <div className="title-left">
            <span className="active-dot"></span>
            <div>
              <h1 className="dashboard-title">Assignments</h1>
              <p className="dashboard-subtitle">Manage and create assignments for your classes.</p>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="controls-bar">
          <div className="filter-wrapper" ref={filterRef}>
            <button
              className={`btn-filter ${statusFilter !== 'All' ? 'active' : ''}`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <SlidersHorizontal size={16} />
              <span>Filter: {statusFilter === 'All' ? 'All' : statusLabels[statusFilter] || statusFilter}</span>
              <ChevronDown size={12} />
            </button>

            {showFilterMenu && (
              <div className="filter-dropdown">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    className={`filter-option ${statusFilter === s ? 'selected' : ''}`}
                    onClick={() => { setStatusFilter(s); setShowFilterMenu(false); }}
                  >
                    <span className={`filter-dot dot-${s}`} />
                    {s === 'All' ? 'All Assignments' : statusLabels[s] || s}
                    {statusFilter === s && <span className="filter-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search Assignment" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="btn-clear-search" onClick={() => setSearchTerm('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <span className="result-count">
            {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Content Panel */}
        {isLoading && assignments.length === 0 ? (
          <div className="loading-state">
            <RefreshCw size={24} className="animate-spin-slow" color="var(--accent-primary)" />
            <p>Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          /* Figma Perfect Empty State */
          <div className="empty-state-card">
            <div className="empty-state-illustration">
              <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="90" cy="90" r="70" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
                <path d="M45 65C35 55 45 45 55 55C65 65 50 85 40 75" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M50 115L52 110L57 108L52 106L50 101L48 106L43 108L48 110L50 115Z" fill="#3B82F6" />
                <circle cx="130" cy="95" r="4" fill="#2563EB" />
                <rect x="75" y="55" width="45" height="55" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
                <rect x="83" y="65" width="12" height="4" rx="2" fill="#1E293B" />
                <rect x="83" y="75" width="28" height="2" rx="1" fill="#E5E7EB" />
                <rect x="83" y="81" width="28" height="2" rx="1" fill="#E5E7EB" />
                <rect x="83" y="87" width="20" height="2" rx="1" fill="#E5E7EB" />
                <path d="M108 108L128 128" stroke="#9CA3AF" strokeWidth="8" strokeLinecap="round" />
                <circle cx="95" cy="95" r="22" fill="white" stroke="#9CA3AF" strokeWidth="4" />
                <path d="M88 88L102 102" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
                <path d="M102 88L88 102" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="empty-title">No assignments yet</h2>
            <p className="empty-description">
              Create your first assignment to start collecting and grading student submissions. 
              You can set up rubrics, define marking criteria, and let AI assist with grading.
            </p>
            
            <Link href="/create" className="btn-create-first">
              <Plus size={18} strokeWidth={2.5} />
              <span>Create Your First Assignment</span>
            </Link>
          </div>
        ) : (
          /* Cards Grid */
          <div className="assignments-grid">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment._id}
                className="assignment-card"
                onClick={() => router.push(`/assignment/${assignment._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header">
                  <h3 className="card-title">{assignment.title}</h3>
                  
                  {/* Action Menu Trigger */}
                  <div className="dropdown-container">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === assignment._id ? null : assignment._id);
                      }} 
                      className="btn-dots"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeDropdown === assignment._id && (
                      <div className="dropdown-menu">
                        <Link
                          href={`/assignment/${assignment._id}`}
                          className="dropdown-item"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye size={14} />
                          <span>View Assignment</span>
                        </Link>
                        <button 
                          onClick={(e) => handleDelete(assignment._id, assignment.title, e)} 
                          className="dropdown-item delete-item"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status indicator badge */}
                <div className="status-container">
                  {assignment.status === 'generating' && (
                    <span className="badge badge-generating animate-pulse-slow">
                      <RefreshCw size={10} className="animate-spin-slow" />
                      Generating AI Paper...
                    </span>
                  )}
                  {assignment.status === 'pending' && (
                    <span className="badge badge-pending">
                      Queued in worker...
                    </span>
                  )}
                  {assignment.status === 'completed' && (
                    <span className="badge badge-completed">
                      ✓ Ready to view
                    </span>
                  )}
                  {assignment.status === 'failed' && (
                    <span className="badge badge-failed">
                      ✗ Generation Failed
                    </span>
                  )}
                </div>

                {/* Assigned On / Due Row matching Figma */}
                <div className="card-footer-row">
                  <span className="date-assigned">
                    Assigned on : <span className="date-value">{new Date(assignment.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                  </span>
                  
                  <span className="date-due">
                    <strong>Due :</strong> <span className="date-value">{new Date(assignment.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Floating Action Pill matching Figma */}
        <div className="bottom-floating-btn-container">
          <Link href="/create" className="btn-floating-create">
            <Plus size={16} strokeWidth={2.5} />
            <span>Create Assignment</span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 24px;
          flex: 1;
        }

        .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .title-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .active-dot {
          width: 10px;
          height: 10px;
          background-color: #10b981;
          border-radius: 50%;
          margin-top: 8px;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }

        .dashboard-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .dashboard-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .controls-bar {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          padding: 10px 20px;
          border-radius: 9999px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          gap: 16px;
        }

        .filter-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .btn-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: none;
          background-color: transparent;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .btn-filter:hover {
          color: var(--text-primary);
        }

        .btn-filter.active {
          color: var(--accent-primary);
        }
        }

        .filter-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 50;
          min-width: 180px;
          padding: 4px 0;
          animation: fadeIn 0.15s ease forwards;
        }

        .filter-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          transition: background-color 0.1s ease;
        }

        .filter-option:hover { background-color: var(--bg-main); color: var(--text-primary); }
        .filter-option.selected { color: var(--accent-primary); background-color: #fff7ed; }

        .filter-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dot-All { background-color: #9ca3af; }
        .dot-pending { background-color: #6b7280; }
        .dot-generating { background-color: #f97316; }
        .dot-completed { background-color: #10b981; }
        .dot-failed { background-color: #ef4444; }

        .filter-check {
          margin-left: auto;
          font-size: 12px;
          color: var(--accent-primary);
        }

        .result-count {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          white-space: nowrap;
          margin-left: auto;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 180px;
          max-width: 360px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 8px 36px 8px 38px;
          border: 1px solid var(--border-light);
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .search-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.15);
          outline: none;
        }

        .btn-clear-search {
          position: absolute;
          right: 12px;
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

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          gap: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        /* Empty State Styling matching Figma illustration */
        .empty-state-card {
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: 24px;
          padding: 60px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: var(--shadow-sm);
          max-width: 600px;
          margin: 40px auto;
        }

        .empty-state-illustration {
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 12px;
        }
        }

        .empty-description {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 440px;
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .btn-create-first {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: #111827;
          color: #ffffff;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 14px;
          box-shadow: var(--shadow-md);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-create-first:hover {
          transform: translateY(-2px);
          background-color: #1f2937;
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
        }

        /* Cards Grid */
        .assignments-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 768px) {
          .assignments-grid {
            grid-template-columns: 1fr;
          }
        }

        .assignment-card {
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.2s ease;
          position: relative;
        }

        .assignment-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: #ea580c44;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .btn-dots {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .btn-dots:hover {
          background-color: var(--bg-main);
          color: var(--text-primary);
        }

        .dropdown-container {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 28px;
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 160px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          padding: 4px 0;
          animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-align: left;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          transition: background-color 0.1s ease;
        }

        .dropdown-item:hover {
          background-color: var(--bg-main);
          color: var(--text-primary);
        }

        .delete-item {
          color: #dc2626;
        }

        .delete-item:hover {
          background-color: #fef2f2;
          color: #b91c1c;
        }

        .status-container {
          display: flex;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
        }

        .badge-generating {
          background-color: #fff7ed;
          color: #c2410c;
          border: 1px solid #ffedd5;
        }

        .badge-pending {
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
        }

        .badge-completed {
          background-color: #ecfdf5;
          color: #047857;
          border: 1px solid #d1fae5;
        }

        .badge-failed {
          background-color: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fee2e2;
        }

        .card-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-light);
          padding-top: 14px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .date-assigned {
          color: var(--text-secondary);
        }

        .date-assigned .date-value {
          color: var(--text-primary);
          font-weight: 600;
        }

        .date-due strong {
          color: var(--text-primary);
          font-weight: 700;
          margin-right: 4px;
        }

        .date-due .date-value {
          color: var(--text-secondary);
          font-weight: 600;
        }

        /* Bottom Floating Action Pill */
        .bottom-floating-btn-container {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          margin-left: 130px; /* Offset fixed sidebar width */
          z-index: 100;
        }

        .btn-floating-create {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          background-color: #111827;
          color: #ffffff;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .btn-floating-create:hover {
          transform: scale(1.05) translateY(-1px);
          background-color: #1f2937;
          box-shadow: 0 12px 30px rgba(0,0,0,0.25);
        }

        @media (max-width: 768px) {
          .bottom-floating-btn-container {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}
