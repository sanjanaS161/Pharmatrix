import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Home from './components/Home';
import Scanner from './components/Scanner';
import Search from './components/Search';
import Cabinet from './components/Cabinet';
import SmartDietPlanner from './components/SmartDietPlanner';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Login from './components/Login';
import Intro from './components/Intro';
import NotFound from './components/NotFound';
import { Scan, Search as SearchIcon, BriefcaseMedical, Home as HomeIcon, LogIn, LogOut, User, MousePointer2, Utensils, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function NavBar() {
  const { user, logout, showLoginPrompt, setShowLoginPrompt } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Helper to handle restricted navigation clicks
  const handleProtectedAction = (e) => {
    if (!user) {
      e.preventDefault();
      setShowLoginPrompt(true);
      return;
    }
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  return (
    <nav style={{ position: 'relative', zIndex: 50 }}>
      {/* Exclude Home from protection so guests can at least arrive at the Home page via click */}
      <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""} onClick={() => setShowLoginPrompt(false)}>
        <HomeIcon size={20} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/scanner" className={({ isActive }) => isActive ? "active" : ""} onClick={(e) => handleProtectedAction(e, '/scanner')}>
        <Scan size={20} />
        <span>Scanner</span>
      </NavLink>
      <NavLink to="/search" className={({ isActive }) => isActive ? "active" : ""} onClick={(e) => handleProtectedAction(e, '/search')}>
        <SearchIcon size={20} />
        <span>Search</span>
      </NavLink>
      <NavLink to="/cabinet" className={({ isActive }) => isActive ? "active" : ""} onClick={(e) => handleProtectedAction(e, '/cabinet')}>
        <BriefcaseMedical size={20} />
        <span>Cabinet</span>
      </NavLink>
      <NavLink to="/diet-planner" className={({ isActive }) => isActive ? "active" : ""} onClick={(e) => handleProtectedAction(e, '/diet-planner')}>
        <Utensils size={20} />
        <span>Diet Planner</span>
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => isActive ? "active" : ""} onClick={(e) => handleProtectedAction(e, '/analytics')}>
        <BarChart3 size={20} />
        <span>Analytics</span>
      </NavLink>

      {/* Profile Icon Dropdown - Added glow when prompted */}
      <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => { setShowProfileMenu(!showProfileMenu); setShowLoginPrompt(false); }}
          title="Account Menu"
          style={{
            background: showLoginPrompt ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
            border: '1px solid',
            borderColor: showLoginPrompt ? 'var(--accent-primary)' : 'var(--glass-border)',
            borderRadius: '50%',
            width: '42px', height: '42px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: showLoginPrompt ? 'var(--accent-primary)' : 'var(--text-primary)',
            marginRight: '1rem',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            padding: 0,
            boxShadow: showLoginPrompt ? '0 0 25px var(--accent-glow), inset 0 0 10px rgba(47,128,237,0.18)' : 'none',
            transform: showLoginPrompt ? 'scale(1.05)' : 'scale(1)',
            position: 'relative',
            zIndex: 60 /* Ensure it pops over the blur overlay */
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface-elevated)';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 0 15px var(--accent-glow)';
            e.currentTarget.style.color = 'var(--accent-primary)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = showLoginPrompt ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)';
            e.currentTarget.style.transform = showLoginPrompt ? 'scale(1.05)' : 'scale(1)';
            e.currentTarget.style.boxShadow = showLoginPrompt ? '0 0 25px var(--accent-glow), inset 0 0 10px rgba(47,128,237,0.18)' : 'none';
            e.currentTarget.style.color = showLoginPrompt ? 'var(--accent-primary)' : 'var(--text-primary)';
            e.currentTarget.style.borderColor = showLoginPrompt ? 'var(--accent-primary)' : 'var(--glass-border)';
          }}
        >
          {showLoginPrompt && (
            <motion.div animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid var(--accent-primary)', pointerEvents: 'none' }}
            />
          )}
          <User size={22} />
        </button>

        {/* Dropdown Card */}
        <div style={{
          position: 'absolute',
          top: '120%',
          right: '1rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.25rem',
          minWidth: '220px',
          border: '1px solid var(--glass-border)',
          zIndex: 1000,
          opacity: showProfileMenu ? 1 : 0,
          visibility: showProfileMenu ? 'visible' : 'hidden',
          transform: showProfileMenu ? 'translateY(0)' : 'translateY(-10px)',
          pointerEvents: showProfileMenu ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {user ? (
            <>
              <div style={{
                paddingBottom: '12px',
                borderBottom: '1px solid var(--glass-border)',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '1.1rem'
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {user.username}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: '600' }}>
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(239,68,68,0.05)', border: 'none',
                  color: 'var(--error-color)', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  fontWeight: '600', cursor: 'pointer',
                  width: '100%', textAlign: 'left',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.05)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <div style={{
                paddingBottom: '12px',
                borderBottom: '1px solid var(--glass-border)',
                marginBottom: '4px'
              }}>
                <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-primary)', fontSize: '1rem' }}>
                  Guest User
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Sign in or create account
                </p>
              </div>
              <button
                className="btn-accent"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/login');
                }}
                style={{
                  width: '100%',
                  boxShadow: '0 4px 15px var(--accent-glow)',
                  fontSize: '0.95rem'
                }}
              >
                <LogIn size={18} /> Login
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, setShowLoginPrompt } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setShowLoginPrompt(false); // don't show overlay, we're redirecting to login
    }
  }, [user, setShowLoginPrompt]);

  if (!user) {
    // Redirect to /login, saving where they came from so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Redirect already-logged-in users away from /login
function AlreadyAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  if (user) {
    return <Navigate to={from} replace />;
  }
  return children;
}

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const { showLoginPrompt, setShowLoginPrompt } = useAuth();

  useEffect(() => {
    if (!showLoginPrompt) return;

    const handlePointerDown = (event) => {
      const guideCard = event.target.closest('[data-login-guide-card="true"]');
      if (!guideCard) {
        setShowLoginPrompt(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowLoginPrompt(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLoginPrompt, setShowLoginPrompt]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      <Router>
        {showIntro && <Intro onComplete={() => setShowIntro(false)} />}

        {/* Login Guidance Overlay */}
        <AnimatePresence>
          {showLoginPrompt && (
            <>
              <motion.div
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                transition={{ duration: 0.4 }}
                style={{
                  position: 'fixed', inset: 0, zIndex: 40,
                  background: 'radial-gradient(circle at calc(100% - max(calc((100vw - 1200px) / 2 + 42px), 42px)) 52px, transparent 0%, rgba(10, 10, 10, 0.8) 15%, rgba(0, 0, 0, 0.98) 70%)',
                  pointerEvents: 'auto'
                }}
                onClick={() => setShowLoginPrompt(false)} // Dismiss on click anywhere
              />

              {/* Tooltip Guidance aligned directly under profile icon */}
              <div style={{ position: 'fixed', top: '68px', right: 'max(calc((100vw - 1200px) / 2 + 22px), 1rem)', width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 130 }}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  data-login-guide-card="true"
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--accent-primary)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px var(--accent-glow)',
                    position: 'relative',
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '-8px', right: '14px',
                    width: '14px', height: '14px', background: 'var(--bg-surface)',
                    borderLeft: '1px solid var(--accent-primary)',
                    borderTop: '1px solid var(--accent-primary)',
                    transform: 'rotate(45deg)'
                  }} />
                  <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.95rem', lineHeight: '1.4' }}>
                    Please <span style={{ color: 'var(--accent-primary)' }}>Login</span> to access this feature
                  </p>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Click the profile icon to sign in
                  </p>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        <NavBar />
        <main className="container" style={{ opacity: showIntro ? 0 : 1, transition: 'opacity 0.8s ease-in-out' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/cabinet" element={<ProtectedRoute><Cabinet /></ProtectedRoute>} />
            <Route path="/diet-planner" element={<ProtectedRoute><SmartDietPlanner /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
            <Route path="/login" element={<AlreadyAuth><Login /></AlreadyAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

// Wrap export to ensure AuthProvider wraps App
export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}
