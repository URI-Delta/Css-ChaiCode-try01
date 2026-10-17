import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="mb-2 font-bold">
            CSS <span className="text-brand">Visual</span>
          </div>
          <p className="text-sm text-muted">Learn CSS by seeing it. Built for developers who'd rather try than memorize.</p>
        </div>
        <FooterCol
          title="Learn"
          links={[
            { to: '/learn', label: 'Tracks & lessons' },
            { to: '/challenges', label: 'Challenges' },
            { to: '/projects', label: 'Projects' },
            { to: '/playground', label: 'Playground' },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { to: '/about', label: 'About' },
            { to: '/pricing', label: 'Pricing' },
            { to: '/leaderboard', label: 'Leaderboard' },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { to: '/privacy', label: 'Privacy policy' },
            { to: '/terms', label: 'Terms of service' },
          ]}
        />
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">© {new Date().getFullYear()} CSS Visual. All rights reserved.</div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h3>
      <ul className="flex flex-col gap-1.5 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-muted transition-colors hover:text-text">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
