import { Component } from 'react';
import Button from './Button.jsx';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI error boundary caught:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-4xl" aria-hidden>🫠</div>
          <h2 className="text-lg font-semibold">Something broke while rendering.</h2>
          <p className="max-w-md text-sm text-muted">{this.state.error?.message || 'Unknown rendering error.'}</p>
          <Button onClick={() => window.location.reload()}>Reload the page</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
