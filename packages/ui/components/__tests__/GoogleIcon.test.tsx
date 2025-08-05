import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GoogleIcon } from '../GoogleIcon';

describe('GoogleIcon', () => {
  it('renders with default size', () => {
    const { container } = render(<GoogleIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders with custom size', () => {
    const { container } = render(<GoogleIcon size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('has correct viewBox', () => {
    const { container } = render(<GoogleIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 21 20');
  });

  it('contains Google logo paths', () => {
    const { container } = render(<GoogleIcon />);
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(4); // Google logo has 4 colored parts
  });
});