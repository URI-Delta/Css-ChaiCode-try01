import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/ui.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <EmptyState
        icon="🧩"
        title="404 — page not found"
        description="This selector doesn't match anything."
        action={
          <Link to="/" className="btn btn-primary btn-sm">
            Back to home
          </Link>
        }
      />
    </div>
  );
}
