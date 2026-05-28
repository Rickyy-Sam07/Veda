'use client';

import Link from 'next/link';
import { 
  Sparkles, 
  BookOpen, 
  Users, 
  Clock, 
  ArrowRight, 
  GraduationCap 
} from 'lucide-react';
import Header from '../../components/Header';
import { useStore } from '../../store/useStore';

export default function HomeDashboard() {
  const assignments = useStore((state) => state.assignments);

  const stats = [
    { title: 'Active Assignments', value: assignments.length, icon: BookOpen, color: '#f97316' },
    { title: 'Total Student Groups', value: 4, icon: Users, color: '#3b82f6' },
    { title: 'Submissions Graded', value: '88%', icon: GraduationCap, color: '#10b981' },
    { title: 'Weekly Hours Saved', value: '14 hrs', icon: Clock, color: '#8b5cf6' }
  ];

  return (
    <>
      <Header breadcrumbs={['Home', 'Overview']} />

      <div className="home-container animate-fade-in">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="banner-left">
            <h1 className="welcome-title">Welcome back, John! 👋</h1>
            <p className="welcome-subtitle">
              Ready to create your next lesson assessment? Use VedaAI to build structured question papers in seconds.
            </p>
            <Link href="/create" className="btn-banner-action">
              <Sparkles size={16} />
              <span>Create AI Assessment</span>
            </Link>
          </div>
          <div className="banner-right">🏫</div>
        </div>

        {/* Stats Row */}
        <div className="stats-grid">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  <Icon size={20} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">{stat.title}</span>
                  <h3 className="stat-value">{stat.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Section - Recent activity & shortcut panels */}
        <div className="dashboard-columns">
          {/* Active Groups */}
          <div className="content-column flex-1">
            <div className="column-header">
              <h3 className="column-title">Active Student Groups</h3>
              <Link href="/groups" className="column-link">View All</Link>
            </div>
            
            <div className="groups-list">
              {[
                { name: 'Class 10 - A (Physics)', count: '28 Students', active: true },
                { name: 'Class 9 - C (Science)', count: '32 Students', active: false },
                { name: 'Class 12 - B (Advanced Calculus)', count: '24 Students', active: true }
              ].map((group, idx) => (
                <div key={idx} className="group-row-item">
                  <div className="group-row-left">
                    <span className="group-row-avatar">🎒</span>
                    <div>
                      <h4 className="group-row-name">{group.name}</h4>
                      <p className="group-row-count">{group.count}</p>
                    </div>
                  </div>
                  <span className={`group-status-pill ${group.active ? 'active' : ''}`}>
                    {group.active ? 'Active Now' : 'Idle'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Tools Shortcuts */}
          <div className="content-column flex-1">
            <div className="column-header">
              <h3 className="column-title">AI Teacher shortcuts</h3>
              <Link href="/toolkit" className="column-link">Open Toolkit</Link>
            </div>

            <div className="shortcuts-list">
              {[
                { title: 'Syllabus Quiz Maker', desc: 'Convert textbook topics into modular exams.', emoji: '🧠' },
                { title: 'Lesson Plan Drafter', desc: 'Create 1-week structured class syllabi.', emoji: '📅' },
                { title: 'Report Comment Writer', desc: 'Draft customizable grade comments instantly.', emoji: '✍️' }
              ].map((tool, idx) => (
                <Link href="/toolkit" key={idx} className="shortcut-card-item">
                  <div className="shortcut-left">
                    <span className="shortcut-emoji">{tool.emoji}</span>
                    <div>
                      <h4 className="shortcut-name">{tool.title}</h4>
                      <p className="shortcut-desc">{tool.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="shortcut-arrow" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .home-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .welcome-banner {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 30px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: var(--shadow-md);
        }

        .welcome-title {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #ffffff;
        }

        .welcome-subtitle {
          font-size: 14px;
          color: #94a3b8;
          max-width: 460px;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .btn-banner-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--accent-gradient);
          color: #ffffff;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(234, 88, 12, 0.3);
        }

        .btn-banner-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(234, 88, 12, 0.4);
        }

        .banner-right {
          font-size: 72px;
          opacity: 0.85;
        }

        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }

        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-details {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 2px;
        }

        /* Columns layout */
        .dashboard-columns {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .content-column {
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
          min-width: 320px;
        }

        .column-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .column-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .column-link {
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-primary);
        }

        /* Group row item */
        .groups-list, .shortcuts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .group-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background-color: var(--bg-main);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
        }

        .group-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .group-row-avatar {
          font-size: 20px;
        }

        .group-row-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .group-row-count {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .group-status-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          background-color: #e5e7eb;
          color: #4b5563;
          border-radius: 9999px;
        }

        .group-status-pill.active {
          background-color: #ecfdf5;
          color: #059669;
        }

        /* Shortcut card items */
        .shortcut-card-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background-color: var(--bg-main);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .shortcut-card-item:hover {
          border-color: var(--accent-primary);
          background-color: #fffaf7;
          transform: translateX(2px);
        }

        .shortcut-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shortcut-emoji {
          font-size: 20px;
        }

        .shortcut-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .shortcut-desc {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .shortcut-arrow {
          color: var(--text-muted);
          transition: transform 0.15s ease;
        }

        .shortcut-card-item:hover .shortcut-arrow {
          color: var(--accent-primary);
          transform: translateX(2px);
        }

        @media (max-width: 768px) {
          .welcome-banner {
            flex-direction: column;
            text-align: center;
          }
          .banner-right {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
