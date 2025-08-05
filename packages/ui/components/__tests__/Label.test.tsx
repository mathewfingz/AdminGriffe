import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from '../Label';

describe('Label', () => {
  it('renders with text content', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('shows required asterisk when required prop is true', () => {
    render(<Label required>Required Label</Label>);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show asterisk when required prop is false', () => {
    render(<Label required={false}>Optional Label</Label>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('applies htmlFor attribute', () => {
    render(<Label htmlFor="test-input">Label for input</Label>);
    const label = screen.getByText('Label for input');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('applies custom className', () => {
    render(<Label className="custom-label">Custom Label</Label>);
    expect(screen.getByText('Custom Label')).toHaveClass('custom-label');
  });

  it('has default styling classes', () => {
    render(<Label>Styled Label</Label>);
    const label = screen.getByText('Styled Label');
    expect(label).toHaveClass('font-poppins');
    expect(label).toHaveClass('text-base');
    expect(label).toHaveClass('text-design-foreground-default');
  });
});