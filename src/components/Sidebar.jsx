import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Zap, Images, LogOut, Menu, X } from 'lucide-react'
import './Sidebar.css'

// ⚡ 1. Added 'credits' to the props
export default function Sidebar({ activeTab, onTabChange, onLogout, credits }) {
  const { user } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [userName, setUserName] = useState('')

  // Fetch the user's name, but reject it if it says "undefined"
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    // We explicitly block the literal strings 'undefined' and 'null'
    if (storedName && storedName !== 'undefined' && storedName !== 'null') {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = () => {
    onLogout()
    setIsMobileOpen(false)
  }

  const handleTabChange = (tab) => {
    onTabChange(tab)
    setIsMobileOpen(false)
  }

  // --- BULLETPROOF NAME DISPLAY LOGIC ---
  let finalDisplayName = 'Guest User';

  if (userName) {
    // If they have a real name saved, use it!
    finalDisplayName = userName;
  } else if (user?.email) {
    // If no name is found, extract it from their email
    const choppedEmail = user.email.split('@')[0];
    finalDisplayName = choppedEmail.charAt(0).toUpperCase() + choppedEmail.slice(1);
  }

  // Grab the first letter for the purple avatar circle
  const avatarLetter = finalDisplayName.charAt(0).toUpperCase();

  return (
    <>
      <button className="mobile-menu-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar glass ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">✨</div>
            <h1>AI Studio</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => handleTabChange('generate')}
          >
            <Zap size={20} />
            <span>Generate Image</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => handleTabChange('gallery')}
          >
            <Images size={20} />
            <span>My Gallery</span>
          </button>
        </nav>

        {/* ⚡ 2. THE NEW WALLET DISPLAY */}
        {/* We use margin-top: 'auto' to push this and the footer to the bottom of the sidebar */}
        <div className="sidebar-wallet" style={{
          marginTop: 'auto',
          marginHorizontal: '20px',
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(147, 51, 234, 0.08))',
          borderRadius: '12px',
          border: '1px solid rgba(79, 70, 229, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4f46e5', fontWeight: '700', fontSize: '14px' }}>
            <Zap size={16} fill="#4f46e5" />
            Your Wallet
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {credits !== undefined ? credits : '-'} 
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>credits left</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            {/* Display the correct initial */}
            <div className="avatar">{avatarLetter}</div>
            
            <div className="user-details">
              {/* Display the beautifully formatted name */}
              <p className="user-email" style={{ fontWeight: 600, color: '#0f172a' }}>
                {finalDisplayName}
              </p>
              <p className="user-label">Free Tier</p>
            </div>
            
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  )
}