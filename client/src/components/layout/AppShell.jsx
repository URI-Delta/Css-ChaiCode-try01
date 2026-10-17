import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { BookOpen, Trophy, LayoutDashboard, FolderKanban, Bookmark, Gem, LineChart, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from './Navbar.jsx';
import { useAuthStore } from '../../store/authStore.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';
import clsx from 'clsx';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/challenges', label: 'Challenges', icon: Trophy },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/achievements', label: 'Achievements', icon: Gem },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
];

export default function AppShell({ children }) {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  usePrefersReducedMotion();

  return (
    <div className="min-h-screen bg-bg">
      <a href="#main" className="sr-only">
        Skip to content
      </a>
      <Navbar />
      <div className="mx-auto flex max-w-7xl">
        <aside
          className={clsx('sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-line bg-surface pt-4 transition-all md:flex', open ? 'w-56' : 'w-16')}
          aria-label="Learning sections"
        >
          <nav className="flex flex-1 flex-col gap-0.5 px-2">
            {items.map((it) => {
              const active = location.pathname.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  title={it.label}
                  aria-current={active ? 'page' : undefined}
                  className={clsx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors', active ? 'bg-elevated font-semibold text-brand' : 'text-muted hover:text-text')}
                >
                  <it.icon size={17} aria-hidden />
                  {open && <span>{it.label}</span>}
                </Link>
              );
            })}
            <div className="mt-auto px-2 pb-4">
              {open && (
                <div className="rounded-lg border border-line bg-card p-3 text-xs text-muted">
                  Signed in as <span className="font-semibold text-text">{user?.name}</span>
                  <span className="mt-1 block">Plan: <span className={user?.plan === 'pro' ? 'text-pro' : ''}>{user?.plan}</span></span>
                </div>
              )}
            </div>
          </nav>
          <button className="btn btn-ghost btn-sm m-2" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}>
            {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {open && 'Collapse'}
          </button>
        </aside>
        <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
