'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  BookOpen, 
  Sparkles, 
  FolderHeart, 
  Settings, 
  Plus, 
  GraduationCap
} from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Sidebar() {
  const pathname = usePathname();
  const assignments = useStore((state) => state.assignments);

  const menuItems = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'My Groups', href: '/groups', icon: Users },
    { 
      name: 'Assignments', 
      href: '/', 
      icon: BookOpen, 
      badge: assignments.length > 0 ? assignments.length : undefined 
    },
    { name: "AI Teacher's Toolkit", href: '/toolkit', icon: Sparkles },
    { name: 'My Library', href: '/library', icon: FolderHeart }
  ];

  return (
    <aside className="veda-sidebar">
      {/* VedaAl Brand Logo */}
      <div className="brand-logo">
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="url(#logo-grad-sidebar)" />
            <path d="M6 8L12 16L18 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="logo-grad-sidebar" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EA580C" />
                <stop offset="1" stopColor="#F97316" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="logo-text">Veda<span className="logo-highlight">Al</span></span>
      </div>

      {/* Primary Action Button */}
      <Link href="/create" className="btn-create-assignment">
        <Sparkles size={16} strokeWidth={2.5} />
        <span>Create Assignment</span>
      </Link>

      {/* Nav List */}
      <nav className="nav-list">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/' && pathname.startsWith('/assignment'));

          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-item-inner">
                <Icon size={18} className="nav-icon" />
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile and Settings */}
      <div className="sidebar-bottom">
        <Link href="#" className="nav-item-settings">
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        
        {/* School Info Box */}
        <div className="school-info-card">
          <div className="school-avatar">
            <span>DP</span>
          </div>
          <div className="school-details">
            <h4 className="school-name">Delhi Public School</h4>
            <p className="school-branch">Bokaro Steel City</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .veda-sidebar {
          width: 260px;
          height: 100vh;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-light);
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 42px;
          padding-left: 8px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }

        .logo-highlight {
          color: var(--accent-primary);
        }

        .btn-create-assignment {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: #ffffff;
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          margin-bottom: 36px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .btn-create-assignment::before {
          content: '';
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          background: var(--accent-gradient);
          z-index: -1;
          border-radius: calc(var(--radius-lg) + 2px);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .btn-create-assignment:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(234, 88, 12, 0.25);
        }

        .btn-create-assignment:hover::before {
          opacity: 1;
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 14px;
          transition: all 0.15s ease-in-out;
          cursor: pointer;
        }

        .nav-item-inner {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-item:hover {
          background-color: var(--bg-main);
          color: var(--text-primary);
        }

        .nav-item.active {
          background-color: #fef2f2;
          color: var(--accent-primary);
          font-weight: 600;
        }

        .nav-item.active :global(.nav-icon) {
          color: var(--accent-primary);
        }

        .nav-badge {
          background-color: var(--accent-primary);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(234, 88, 12, 0.3);
        }

        .sidebar-bottom {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border-light);
        }

        .nav-item-settings {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 14px;
          transition: all 0.15s ease-in-out;
        }

        .nav-item-settings:hover {
          background-color: var(--bg-main);
          color: var(--text-primary);
        }

        .school-info-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background-color: var(--bg-main);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-light);
        }

        .school-avatar {
          width: 38px;
          height: 38px;
          background: var(--accent-gradient);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 13px;
          box-shadow: var(--shadow-sm);
        }

        .school-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .school-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .school-branch {
          font-size: 10px;
          font-weight: 500;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </aside>
  );
}
