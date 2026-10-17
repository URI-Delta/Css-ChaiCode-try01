import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, BookOpen, Code2, Trophy, LayoutDashboard, Sparkles, Gem } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import clsx from 'clsx';

const links = [
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/playground', label: 'Playground', icon: Code2 },
  { to: '/challenges', label: 'Challenges', icon: Trophy },
  { to: '/pricing', label: 'Pricing', icon: Gem },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--surface)" stroke="var(--border)" />
        <path d="M8 22l8-6 8 6" stroke="var(--brand)" strokeWidth="2.5" fill="none" />
      </svg>
      <span>
        CSS <span className="text-brand">Visual</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4" aria-label="Main">
        <Logo />

        {/* desktop links */}
        <div className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => clsx('rounded-lg px-3 py-1.5 text-sm transition-colors', isActive ? 'bg-elevated text-brand' : 'text-muted hover:text-text')}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-ghost btn-sm hidden md:inline-flex" onClick={() => setTheme(nextTheme)} aria-label={`Switch to ${nextTheme} theme`}>
            {theme === 'dark' ? '☀︎' : '☾'}
          </button>

          {user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => clsx('btn btn-sm', isActive ? 'btn-primary' : 'btn-secondary', 'hidden sm:inline-flex')}>
                <LayoutDashboard size={15} /> Dashboard
              </NavLink>
              <div className="relative hidden md:block">
                <details className="group">
                  <summary className="btn btn-ghost btn-sm cursor-pointer list-none">
                    {user.name?.split(' ')[0] || 'Account'} ▾
                  </summary>
                  <div className="card-surface absolute right-0 z-50 mt-2 w-48 p-2 shadow-xl">
                    <MenuLink to="/progress">Progress</MenuLink>
                    <MenuLink to="/my-projects">My projects</MenuLink>
                    <MenuLink to="/bookmarks">Bookmarks</MenuLink>
                    {user.role === 'admin' && <MenuLink to="/admin">Admin</MenuLink>}
                    <MenuLink to="/settings/profile">Settings</MenuLink>
                    <MenuLink to="/billing">Billing</MenuLink>
                    <hr className="my-1 border-line" />
                    <button
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:text-text"
                      onClick={async () => {
                        await logout();
                        window.location.assign('/');
                      }}
                    >
                      Log out
                    </button>
                  </div>
                </details>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Start Learning
              </Link>
            </>
          )}

          <button className="btn btn-ghost btn-sm md:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* mobile drawer */}
      {open && (
        <div className="border-t border-line bg-bg px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-elevated" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-elevated" onClick={() => setOpen(false)}>Dashboard</Link>
                <Link to="/settings/profile" className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-elevated" onClick={() => setOpen(false)}>Settings</Link>
                <button className="rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-elevated" onClick={() => logout().then(() => window.location.assign('/'))}>Log out</button>
              </>
            ) : (
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-elevated" onClick={() => setOpen(false)}>Sign in</Link>
            )}
            <button className="rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-elevated" onClick={() => setTheme(nextTheme)}>
              Switch to {nextTheme} theme
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ to, children }) {
  return (
    <Link to={to} className="block rounded-md px-3 py-2 text-sm text-muted hover:text-text">
      {children}
    </Link>
  );
}
