'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Bell, ChevronDown, User, Settings, LogOut, CheckCircle, X, LayoutGrid } from 'lucide-react';

interface HeaderProps {
  breadcrumbs?: string[];
  backHref?: string;
}

const NOTIFICATIONS = [
  { id: '1', icon: '✅', title: 'Assignment Generated', desc: 'Physics Quiz — Standard 10 is ready to view.', time: '2 min ago', read: false },
  { id: '2', icon: '📄', title: 'PDF Compiled', desc: 'Your exam paper PDF is ready to download.', time: '15 min ago', read: false },
  { id: '3', icon: '⚠️', title: 'Generation Warning', desc: 'Math Assignment generation took longer than expected.', time: '1 hr ago', read: true },
  { id: '4', icon: '👥', title: 'New Group Added', desc: 'Class 11 - A (Chemistry) was created successfully.', time: '3 hrs ago', read: true },
];

export default function Header({ breadcrumbs = ['Assignment'], backHref }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="veda-header">
      <div className="header-left">
        {backHref && (
          <Link href={backHref} className="btn-back">
            <ArrowLeft size={16} color="#374151" strokeWidth={2.5} />
          </Link>
        )}
        
        <div className="breadcrumbs">
          <LayoutGrid size={16} className="crumb-grid-icon" />
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="crumb-item">
              {idx > 0 && <span className="crumb-separator">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'crumb-active' : 'crumb-inactive'}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="header-right">
        {/* Notification Bell */}
        <div className="notif-wrapper" ref={notifRef}>
          <button 
            className="btn-notification"
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn-mark-read" onClick={markAllRead}>
                    <CheckCircle size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">🎉 All caught up! No notifications.</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`notif-item ${!notif.read ? 'unread' : ''}`}>
                      <span className="notif-icon">{notif.icon}</span>
                      <div className="notif-content">
                        <p className="notif-item-title">{notif.title}</p>
                        <p className="notif-item-desc">{notif.desc}</p>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                      <button 
                        className="notif-dismiss"
                        onClick={(e) => dismissNotification(notif.id, e)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="profile-wrapper" ref={profileRef}>
          <div 
            className="user-profile"
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
          >
            <div className="avatar">👨‍🏫</div>
            <span className="user-name">John Doe</span>
            <ChevronDown size={14} className={`dropdown-arrow ${showProfile ? 'rotated' : ''}`} />
          </div>

          {showProfile && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <div className="profile-avatar-lg">👨‍🏫</div>
                <div>
                  <p className="profile-name">John Doe</p>
                  <p className="profile-email">john.doe@school.edu</p>
                </div>
              </div>

              <div className="profile-menu">
                <button className="profile-menu-item" onClick={() => setShowProfile(false)}>
                  <User size={14} />
                  <span>My Profile</span>
                </button>
                <button className="profile-menu-item" onClick={() => setShowProfile(false)}>
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
                <div className="profile-divider" />
                <button className="profile-menu-item sign-out" onClick={() => setShowProfile(false)}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .veda-header {
          height: 64px;
          background-color: var(--bg-sidebar);
          border-bottom: 1px solid var(--border-light);
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-back {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border-light);
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-back:hover {
          transform: translateX(-2px);
          background-color: var(--bg-main);
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          font-size: 14px;
          font-weight: 600;
        }

        .crumb-item {
          display: flex;
          align-items: center;
        }

        .crumb-separator {
          margin: 0 8px;
          color: var(--text-muted);
          font-weight: 400;
        }

        .crumb-grid-icon {
          color: var(--text-muted);
          margin-right: 8px;
          flex-shrink: 0;
        }

        .crumb-inactive { color: var(--text-secondary); }
        .crumb-active { color: var(--text-primary); }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Notification Bell */
        .notif-wrapper {
          position: relative;
        }

        .btn-notification {
          position: relative;
          background: none;
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          background-color: #ffffff;
        }

        .btn-notification:hover {
          background-color: var(--bg-main);
          color: var(--text-primary);
          border-color: var(--border-focus);
        }

        .bell-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          background-color: #ef4444;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          font-size: 9px;
          font-weight: 800;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 360px;
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
          z-index: 200;
          animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }

        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-light);
          background-color: var(--bg-main);
        }

        .notif-title {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .btn-mark-read {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: var(--accent-primary);
          background: none;
          border: none;
          cursor: pointer;
        }

        .notif-list {
          max-height: 320px;
          overflow-y: auto;
        }

        .notif-empty {
          padding: 30px 20px;
          text-align: center;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light);
          cursor: pointer;
          transition: background-color 0.1s ease;
          position: relative;
        }

        .notif-item:last-child { border-bottom: none; }

        .notif-item:hover { background-color: var(--bg-main); }

        .notif-item.unread {
          background-color: #fff7ed;
        }

        .notif-item.unread::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background-color: var(--accent-primary);
          border-radius: 50%;
        }

        .notif-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }

        .notif-content { flex: 1; }

        .notif-item-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .notif-item-desc {
          font-size: 11px;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .notif-time {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .notif-dismiss {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .notif-item:hover .notif-dismiss { opacity: 1; }
        .notif-dismiss:hover { color: #ef4444; background-color: #fef2f2; }

        /* Profile */
        .profile-wrapper {
          position: relative;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 9999px;
          border: 1px solid var(--border-light);
          background-color: #ffffff;
          transition: all 0.15s ease;
        }

        .user-profile:hover {
          background-color: var(--bg-main);
          border-color: var(--border-focus);
        }

        .avatar {
          font-size: 16px;
          width: 28px;
          height: 28px;
          background-color: #fef2f2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-light);
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .dropdown-arrow {
          color: var(--text-secondary);
          transition: transform 0.2s ease;
        }

        .dropdown-arrow.rotated { transform: rotate(180deg); }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 240px;
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
          z-index: 200;
          animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #ffffff;
        }

        .profile-avatar-lg {
          font-size: 22px;
          width: 42px;
          height: 42px;
          background-color: rgba(255,255,255,0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-name {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
        }

        .profile-email {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .profile-menu {
          padding: 8px;
        }

        .profile-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all 0.1s ease;
        }

        .profile-menu-item:hover {
          background-color: var(--bg-main);
          color: var(--text-primary);
        }

        .profile-divider {
          height: 1px;
          background-color: var(--border-light);
          margin: 4px 0;
        }

        .sign-out {
          color: #ef4444;
        }

        .sign-out:hover {
          background-color: #fef2f2;
          color: #dc2626;
        }
      `}</style>
    </header>
  );
}
