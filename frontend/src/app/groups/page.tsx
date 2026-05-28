'use client';

import { useState } from 'react';
import { Users, GraduationCap, Plus, MessageSquare, BookOpen, X, Send, ChevronRight, Trash2, UserPlus } from 'lucide-react';
import Header from '../../components/Header';
import { useToast } from '../../components/Toast';

interface Classroom {
  id: number;
  name: string;
  subject: string;
  students: number;
  exams: number;
  coTeacher: string;
  avatar: string;
  messages: { author: string; text: string; time: string }[];
}

const INITIAL_CLASSROOMS: Classroom[] = [
  { id: 1, name: 'Class 10 - A (Physics)', subject: 'Physics', students: 28, exams: 5, coTeacher: 'Sarah Jenkins', avatar: '🎒', messages: [
    { author: 'Sarah Jenkins', text: 'Chapter 12 assignment is due this Friday. Please remind students!', time: '10:30 AM' },
    { author: 'John Doe', text: 'I will post a study guide on the board tomorrow.', time: '11:15 AM' },
  ]},
  { id: 2, name: 'Class 9 - C (Science)', subject: 'General Science', students: 32, exams: 2, coTeacher: 'N/A', avatar: '🧪', messages: [
    { author: 'John Doe', text: 'Lab session scheduled for Thursday. Everyone bring their safety kits.', time: '09:00 AM' },
  ]},
  { id: 3, name: 'Class 12 - B (Advanced Calculus)', subject: 'Mathematics', students: 24, exams: 8, coTeacher: 'Robert Chen', avatar: '📐', messages: [
    { author: 'Robert Chen', text: 'Integration by parts test moved to next Wednesday.', time: '2:00 PM' },
    { author: 'John Doe', text: 'Practice sheets have been uploaded to the library.', time: '3:00 PM' },
  ]},
  { id: 4, name: 'Class 8 - A (Social Studies)', subject: 'World History', students: 30, exams: 4, coTeacher: 'Emily Watson', avatar: '🌍', messages: [
    { author: 'Emily Watson', text: 'History project submissions open now.', time: '1:00 PM' },
  ]},
];

export default function Groups() {
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState<Classroom[]>(INITIAL_CLASSROOMS);

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupStudents, setNewGroupStudents] = useState(25);
  const [newGroupCoTeacher, setNewGroupCoTeacher] = useState('');

  // Class Board Modal
  const [boardRoom, setBoardRoom] = useState<Classroom | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Manage Group Modal
  const [manageRoom, setManageRoom] = useState<Classroom | null>(null);

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !newGroupSubject.trim()) {
      showToast('Please fill in the group name and subject.', 'error');
      return;
    }
    const newGroup: Classroom = {
      id: Date.now(),
      name: newGroupName,
      subject: newGroupSubject,
      students: newGroupStudents,
      exams: 0,
      coTeacher: newGroupCoTeacher || 'N/A',
      avatar: '🏫',
      messages: [],
    };
    setClassrooms((prev) => [newGroup, ...prev]);
    setShowCreateModal(false);
    setNewGroupName('');
    setNewGroupSubject('');
    setNewGroupStudents(25);
    setNewGroupCoTeacher('');
    showToast(`"${newGroupName}" group created successfully!`, 'success');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !boardRoom) return;
    const msg = { author: 'John Doe', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setClassrooms((prev) => prev.map((r) => r.id === boardRoom.id ? { ...r, messages: [...r.messages, msg] } : r));
    setBoardRoom((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
    setNewMessage('');
    showToast('Message posted to class board!', 'success');
  };

  const handleDeleteGroup = (id: number) => {
    const room = classrooms.find((c) => c.id === id);
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
    setManageRoom(null);
    showToast(`"${room?.name}" was removed.`, 'info');
  };

  return (
    <>
      <Header breadcrumbs={['My Groups']} />

      <div className="groups-container animate-fade-in">
        <div className="title-row">
          <div>
            <h1 className="groups-title">My Student Groups</h1>
            <p className="groups-subtitle">Coordinate your classrooms, syllabus enrollments, and active exams.</p>
          </div>
          <button className="btn-create-group" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Create New Group</span>
          </button>
        </div>

        <div className="groups-grid">
          {classrooms.map((room) => (
            <div key={room.id} className="group-card">
              <div className="card-top-row">
                <span className="room-avatar-badge">{room.avatar}</span>
                <span className="students-pill">
                  <Users size={12} />
                  <span>{room.students} Students</span>
                </span>
              </div>

              <h3 className="room-name">{room.name}</h3>
              <p className="room-subject">Subject: <strong>{room.subject}</strong></p>
              
              <div className="room-meta">
                <div className="meta-item">
                  <BookOpen size={13} />
                  <span>{room.exams} Active Exams</span>
                </div>
                <div className="meta-item">
                  <GraduationCap size={13} />
                  <span>Co-Teacher: {room.coTeacher}</span>
                </div>
              </div>

              <div className="card-footer">
                <button className="btn-chat" onClick={() => setBoardRoom(room)}>
                  <MessageSquare size={13} />
                  <span>Class Board {room.messages.length > 0 && <span className="msg-count">({room.messages.length})</span>}</span>
                </button>
                
                <button className="btn-manage" onClick={() => setManageRoom(room)}>
                  Manage Group
                </button>
              </div>
            </div>
          ))}

          {classrooms.length === 0 && (
            <div className="empty-groups">
              <span>👥</span>
              <p>No groups yet. Create your first classroom group!</p>
              <button onClick={() => setShowCreateModal(true)}>+ Create Group</button>
            </div>
          )}
        </div>
      </div>

      {/* ─── CREATE GROUP MODAL ─── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button className="btn-close-modal" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Class / Group Name *</label>
                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Class 11 - A (Chemistry)" className="modal-input" />
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <input type="text" value={newGroupSubject} onChange={(e) => setNewGroupSubject(e.target.value)} placeholder="e.g. Chemistry" className="modal-input" />
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Number of Students</label>
                  <input type="number" min={1} max={100} value={newGroupStudents} onChange={(e) => setNewGroupStudents(parseInt(e.target.value) || 1)} className="modal-input" />
                </div>
                <div className="form-group flex-1">
                  <label>Co-Teacher (Optional)</label>
                  <input type="text" value={newGroupCoTeacher} onChange={(e) => setNewGroupCoTeacher(e.target.value)} placeholder="e.g. Dr. Smith" className="modal-input" />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-modal-primary" onClick={handleCreateGroup}>
                <Plus size={14} />
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CLASS BOARD MODAL ─── */}
      {boardRoom && (
        <div className="modal-overlay" onClick={() => setBoardRoom(null)}>
          <div className="modal-card board-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>📋 Class Board</h2>
                <p className="modal-subtitle">{boardRoom.name}</p>
              </div>
              <button className="btn-close-modal" onClick={() => setBoardRoom(null)}><X size={18} /></button>
            </div>

            <div className="board-messages">
              {boardRoom.messages.length === 0 && (
                <div className="board-empty">No messages yet. Be the first to post!</div>
              )}
              {boardRoom.messages.map((msg, idx) => (
                <div key={idx} className={`board-msg ${msg.author === 'John Doe' ? 'own' : ''}`}>
                  <div className="msg-author">{msg.author}</div>
                  <div className="msg-bubble">{msg.text}</div>
                  <div className="msg-time">{msg.time}</div>
                </div>
              ))}
            </div>

            <div className="board-input-row">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Write an announcement..."
                className="board-input"
              />
              <button className="btn-send" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MANAGE GROUP MODAL ─── */}
      {manageRoom && (
        <div className="modal-overlay" onClick={() => setManageRoom(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>⚙️ Manage Group</h2>
                <p className="modal-subtitle">{manageRoom.name}</p>
              </div>
              <button className="btn-close-modal" onClick={() => setManageRoom(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <div className="manage-stats-row">
                <div className="manage-stat">
                  <span className="stat-num">{manageRoom.students}</span>
                  <span className="stat-label">Students</span>
                </div>
                <div className="manage-stat">
                  <span className="stat-num">{manageRoom.exams}</span>
                  <span className="stat-label">Active Exams</span>
                </div>
                <div className="manage-stat">
                  <span className="stat-num">{manageRoom.messages.length}</span>
                  <span className="stat-label">Board Posts</span>
                </div>
              </div>

              <div className="manage-actions">
                <button className="manage-action-btn" onClick={() => { showToast(`Enrollment updated for ${manageRoom.name}`, 'success'); setManageRoom(null); }}>
                  <UserPlus size={14} />
                  <span>Add / Remove Students</span>
                  <ChevronRight size={14} className="ml-auto" />
                </button>
                <button className="manage-action-btn" onClick={() => { showToast('Opening syllabus sync for this group...', 'info'); setManageRoom(null); }}>
                  <BookOpen size={14} />
                  <span>Sync Syllabus</span>
                  <ChevronRight size={14} className="ml-auto" />
                </button>
                <button className="manage-action-btn danger" onClick={() => handleDeleteGroup(manageRoom.id)}>
                  <Trash2 size={14} />
                  <span>Delete This Group</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .groups-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .groups-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .groups-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .btn-create-group {
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

        .btn-create-group:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(234, 88, 12, 0.4);
        }

        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .group-card {
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 0.2s ease;
        }

        .group-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: #ea580c33;
        }

        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .room-avatar-badge {
          font-size: 24px;
          width: 44px;
          height: 44px;
          background-color: var(--bg-main);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-light);
        }

        .students-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          background-color: var(--bg-main);
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid var(--border-light);
        }

        .room-name {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .room-subject {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: -6px;
        }

        .room-meta {
          border-top: 1px dashed var(--border-light);
          border-bottom: 1px dashed var(--border-light);
          padding: 12px 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 4px;
        }

        .btn-chat {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid var(--border-light);
          background-color: #ffffff;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-chat:hover {
          background-color: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .msg-count { color: var(--accent-primary); }

        .btn-manage {
          padding: 8px 16px;
          background: var(--accent-gradient);
          color: #ffffff;
          border: none;
          font-size: 12px;
          font-weight: 700;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-manage:hover { opacity: 0.9; transform: translateY(-1px); }

        .empty-groups {
          grid-column: 1/-1;
          text-align: center;
          padding: 60px;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }

        .empty-groups span { font-size: 48px; }
        .empty-groups button {
          margin-top: 8px;
          padding: 10px 20px;
          background: var(--accent-gradient);
          color: #fff;
          border: none;
          border-radius: 9999px;
          font-weight: 700;
          cursor: pointer;
        }

        /* ─── MODALS ─── */
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

        .modal-card {
          background: #ffffff;
          border-radius: 24px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }

        .board-modal {
          max-width: 560px;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-light);
          background-color: var(--bg-main);
        }

        .modal-header h2 {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .modal-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
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
        }

        .btn-close-modal:hover { background-color: #fef2f2; color: #ef4444; border-color: #ef4444; }

        .modal-body {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .modal-input {
          padding: 10px 14px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-size: 13px;
          color: var(--text-primary);
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .modal-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.12);
          outline: none;
        }

        .form-row { display: flex; gap: 16px; }
        .flex-1 { flex: 1; }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid var(--border-light);
          background-color: var(--bg-main);
        }

        .btn-modal-cancel {
          padding: 9px 18px;
          border: 1px solid var(--border-light);
          background: #ffffff;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-modal-cancel:hover { background-color: var(--bg-main); color: var(--text-primary); }

        .btn-modal-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          background: var(--accent-gradient);
          color: #ffffff;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
          transition: all 0.2s ease;
        }

        .btn-modal-primary:hover { transform: translateY(-1px); }

        /* Board */
        .board-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background-color: #f8fafc;
          min-height: 260px;
          max-height: 360px;
        }

        .board-empty {
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
          padding: 40px 0;
        }

        .board-msg {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 80%;
        }

        .board-msg.own { align-self: flex-end; align-items: flex-end; }

        .msg-author {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
        }

        .msg-bubble {
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-primary);
          line-height: 1.4;
          box-shadow: var(--shadow-sm);
        }

        .board-msg.own .msg-bubble {
          background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
          color: #ffffff;
          border-color: transparent;
        }

        .msg-time {
          font-size: 10px;
          color: var(--text-muted);
        }

        .board-input-row {
          display: flex;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid var(--border-light);
        }

        .board-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid var(--border-light);
          border-radius: 9999px;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .board-input:focus { border-color: var(--border-focus); outline: none; }

        .btn-send {
          width: 40px;
          height: 40px;
          background: var(--accent-gradient);
          border: none;
          border-radius: 50%;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .btn-send:hover { transform: scale(1.05); }
        .btn-send:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Manage modal */
        .manage-stats-row {
          display: flex;
          gap: 12px;
          margin-bottom: 4px;
        }

        .manage-stat {
          flex: 1;
          background-color: var(--bg-main);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 12px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-num {
          font-size: 22px;
          font-weight: 800;
          color: var(--accent-primary);
        }

        .stat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .manage-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .manage-action-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border: 1px solid var(--border-light);
          background-color: #ffffff;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          width: 100%;
        }

        .manage-action-btn:hover { background-color: var(--bg-main); border-color: var(--accent-primary); }
        .manage-action-btn.danger { color: #dc2626; }
        .manage-action-btn.danger:hover { background-color: #fef2f2; border-color: #ef4444; }
        .ml-auto { margin-left: auto; }
      `}</style>
    </>
  );
}
