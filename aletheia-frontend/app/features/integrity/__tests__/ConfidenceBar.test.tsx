/**
 * Tests for ConfidenceBar component
 */

import { render, screen } from '@testing-library/react';
import { ConfidenceBar } from '../components/ConfidenceBar';

describe('ConfidenceBar', () => {
  it('should render with default confidence', () => {
    render(<ConfidenceBar />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render with custom confidence value', () => {
    render(<ConfidenceBar confidence={85} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '85');
  });

  it('should render with label', () => {
    render(<ConfidenceBar label="AI Confidence" confidence={50} />);
    expect(screen.getByText('AI Confidence')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should not render label when not provided', () => {
    render(<ConfidenceBar confidence={75} />);
    expect(screen.queryByText(/ai confidence/i)).not.toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should handle 100% confidence', () => {
    render(<ConfidenceBar confidence={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('should handle 0% confidence', () => {
    render(<ConfidenceBar confidence={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });
});
