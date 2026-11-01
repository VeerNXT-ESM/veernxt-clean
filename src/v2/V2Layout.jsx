import { useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, User, Home, LayoutDashboard, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAccountSummary } from '../lib/useAccountSummary';
import AccountMenu from '../components/ui/AccountMenu';
import Footer from '../components/Footer';
import { V2_SECTIONS } from './sections';

// Employers have no learning/jobs/finance/legal; they get their own two links.
const EMPLOYER_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/employer/dashboard' },
  { key: 'find', label: 'Find Candidates', icon: Search, to: '/find-candidates' },
];
import './v2.css';

/**
 * Shared chrome for every signed-in screen: slim header (logo -> universal landing,
 * four section links, chat icon, avatar) plus a mobile bottom nav. The avatar
 * menu is the only way into the student dashboard (/home/me).
 */
export default function V2Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { fullName, avatarUrl, profilingCompleted, isEmployer } = useAccountSummary();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const triggerRef = useRef(null);

  const handleLogout = async () => {
    localStorage.removeItem('employer_session');
    await supabase.auth.signOut();
    navigate('/');
  };

  const sections = isEmployer ? EMPLOYER_SECTIONS : V2_SECTIONS;
  const homePath = isEmployer ? '/employer/dashboard' : '/home';
  const isActive = (s) => pathname.startsWith(s.to);

  return (
    <div className="v2-shell">
      <header className="v2-header">
        <div className="v2-header-inner">
          <Link to={homePath} className="v2-logo" aria-label="VeerNXT home">
            <img src="/logo.png" alt="VeerNXT" />
          </Link>

          <nav className="v2-nav" aria-label="Sections">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.key} to={s.to} className={`v2-nav-link ${isActive(s) ? 'active' : ''}`}>
                  <Icon size={18} aria-hidden="true" />
                  {s.label}
                </Link>
              );
            })}
          </nav>

          <div className="v2-header-right">
            <Link to="/home/messages" className={`v2-icon-btn ${pathname === '/home/messages' ? 'active' : ''}`} aria-label="Messages" title="Messages">
              <MessageSquare size={22} />
            </Link>
            <div className="v2-avatar-wrap">
              <button
                type="button"
                ref={triggerRef}
                className="v2-avatar-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label="Account menu"
              >
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <User size={20} />}
              </button>
              <AccountMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                fullName={fullName}
                avatarUrl={avatarUrl}
                isEmployer={isEmployer}
                profilingCompleted={profilingCompleted}
                onLogout={handleLogout}
                returnFocusRef={triggerRef}
                profilePath="/home/me"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="v2-main">
        <Outlet />
      </main>

      <Footer />

      <nav className="v2-bottom-nav" aria-label="Sections">
        <Link to={homePath} className={`v2-bottom-item ${pathname === homePath ? 'active' : ''}`}>
          <Home size={22} /><span>Home</span>
        </Link>
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.key} to={s.to} className={`v2-bottom-item ${isActive(s) ? 'active' : ''}`}>
              <Icon size={22} /><span>{s.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
