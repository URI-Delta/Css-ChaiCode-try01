import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../components/layout/Navbar.jsx';
import SandboxPreview from '../features/playground/SandboxPreview.jsx';

const renderNav = () =>
  render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );

describe('Navbar', () => {
  it('shows sign-in / register CTAs when signed out', () => {
    renderNav();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Start Learning')).toBeInTheDocument();
  });

  it('renders key navigation links', () => {
    renderNav();
    ['Learn', 'Playground', 'Challenges', 'Pricing'].forEach((label) => {
      expect(screen.getByRole('link', { name: label })).toBeTruthy();
    });
  });

  it('exposes a mobile menu toggle that expands the drawer', () => {
    renderNav();
    const toggle = screen.getByRole('button', { name: /toggle menu/i });
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    // drawer contains duplicate link — one drawer-only "Dashboard" is present
    expect(screen.getAllByText('Playground').length).toBeGreaterThanOrEqual(2);
  });
});

describe('SandboxPreview isolation', () => {
  it('renders user code inside a sandboxed iframe without allow-same-origin', () => {
    const { container } = render(
      <SandboxPreview html="<h1>hi</h1>" css="h1{color:#000}" js="console.log(1)" />
    );
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
    const tokens = iframe.getAttribute('sandbox').split(' ');
    expect(tokens).toContain('allow-scripts');
    expect(tokens).not.toContain('allow-same-origin');
    expect(iframe.getAttribute('srcdoc')).toContain('<h1>hi</h1>');
    expect(iframe.getAttribute('srcdoc')).toMatch(/Content-Security-Policy/);
    expect(iframe.getAttribute('srcdoc')).not.toMatch(/localStorage|document\.cookie/);
  });

  it('hooks runtime errors from the sandbox via postMessage', () => {
    let captured = null;
    const { container } = render(
      <SandboxPreview html="" css="" js="" onError={(m) => (captured = m)} />
    );
    const iframe = container.querySelector('iframe');
    expect(iframe.getAttribute('srcdoc')).toMatch(/window\.addEventListener\('error'/);
  });
});
