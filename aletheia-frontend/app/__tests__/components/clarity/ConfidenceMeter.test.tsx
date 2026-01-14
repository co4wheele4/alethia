/**
 * Tests for ConfidenceMeter component
 */

import { render, screen } from '@testing-library/react';
import { ConfidenceMeter } from '../../../components/clarity/ConfidenceMeter';

describe('ConfidenceMeter', () => {
  it('should render with default confidence', () => {
    render(<ConfidenceMeter />);
    expect(screen.getByText(/confidence\/score: unknown/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render with custom confidence value', () => {
    render(<ConfidenceMeter confidence={75} />);
    expect(screen.getByText(/confidence\/score: 75%/i)).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
  });

  it('should hide label when showLabel is false', () => {
    render(<ConfidenceMeter showLabel={false} />);
    expect(screen.queryByText(/confidence\/score:/i)).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show label by default', () => {
    render(<ConfidenceMeter confidence={50} />);
    expect(screen.getByText(/confidence\/score: 50%/i)).toBeInTheDocument();
  });

  it('should handle 100% confidence', () => {
    render(<ConfidenceMeter confidence={100} />);
    expect(screen.getByText(/confidence\/score: 100%/i)).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('should handle 0% confidence', () => {
    render(<ConfidenceMeter confidence={0} />);
    expect(screen.getByText(/confidence\/score: 0%/i)).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });
});
