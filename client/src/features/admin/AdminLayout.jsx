import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Trophy, FolderKanban, Gem, Sparkles, LineChart, Settings, ClipboardList } from 'lucide-react';

const tabs = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/challenges', label: 'Challenges', icon: Trophy },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: Gem },
  { to: '/admin/ai-settings', label: 'AI settings', icon: Sparkles },
  { to: '/admin/analytics', label: 'Analytics', icon: LineChart },
  { to: '/admin/settings', label: 'Platform', icon: Settings },
  { to: '/admin/audit-logs', label: 'Audit logs', icon: ClipboardList },
];

export default function AdminLayout({ children }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">server-enforced area</span>
      </div>
      <nav className="mt-4 flex gap-1 overflow-x-auto pb-1" aria-label="Admin sections">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-elevated font-semibold text-brand' : 'text-muted hover:text-text'}`
            }
          >
            <t.icon size={14} aria-hidden /> {t.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-5">{children}</div>
    </div>
  );
}
