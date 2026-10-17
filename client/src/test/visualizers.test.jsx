import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FlexboxVisualizer from '../components/visualizers/FlexboxVisualizer.jsx';
import BoxModelVisualizer from '../components/visualizers/BoxModelVisualizer.jsx';

describe('FlexboxVisualizer', () => {
  it('renders default flex-direction and updates generated CSS on change', async () => {
    render(<FlexboxVisualizer />);
    const pre = await screen.findByText(/flex-direction: row;/s);
    expect(pre).toBeInTheDocument();

    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: 'column' } });
    expect(await screen.findByText(/flex-direction: column;/s)).toBeInTheDocument();
  });

  it('updates gap value and the coresponding CSS', () => {
    render(<FlexboxVisualizer />);
    const slider = screen.getAllByRole('slider').find((el) => el.getAttribute('aria-label') === 'Gap');
    expect(slider).toBeTruthy();
    fireEvent.change(slider, { target: { value: '24' } });
    const valueLabels = screen.getAllByText('24px');
    expect(valueLabels.length).toBeGreaterThanOrEqual(1);
  });
});

describe('BoxModelVisualizer', () => {
  it('shows the composed CSS with padding values from sliders', () => {
    render(<BoxModelVisualizer />);
    expect(screen.getByText(/padding: 12px;/s)).toBeInTheDocument();
    const padding = screen.getAllByRole('slider').find((el) => el.getAttribute('aria-label') === 'Padding');
    fireEvent.change(padding, { target: { value: '30' } });
    expect(screen.getByText(/padding: 30px;/s)).toBeInTheDocument();
  });
});
