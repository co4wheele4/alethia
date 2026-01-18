/**
 * Tests for ErrorBanner component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBanner, ErrorSource } from '../../../components/integrity/ErrorBanner';

describe('ErrorBanner', () => {
  it('should render with default message and source', () => {
    render(<ErrorBanner />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByText('System Error')).toBeInTheDocument();
    expect(screen.getByText(/source: system error/i)).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<ErrorBanner message="Custom error message" />);
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<ErrorBanner title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render with user source', () => {
    render(<ErrorBanner source="user" />);
    expect(screen.getByText('User Error')).toBeInTheDocument();
    expect(screen.getByText(/source: user error/i)).toBeInTheDocument();
  });

  it('should render with data source', () => {
    render(<ErrorBanner source="data" />);
    expect(screen.getByText('Data Error')).toBeInTheDocument();
    expect(screen.getByText(/source: data error/i)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<ErrorBanner onClose={handleClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should work without onClose handler', () => {
    render(<ErrorBanner />);
    // Should not have close button if onClose is not provided
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('should display both title and message', () => {
    render(<ErrorBanner title="Error Title" message="Error message" />);
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should handle invalid source type with default label', () => {
    // Test default case by passing an invalid source type
    render(<ErrorBanner source={'invalid' as unknown as ErrorSource} />);
    // The default case returns 'Error' - check for it in title or source text
    const errorText = screen.queryByText(/^Error$/i) || screen.queryByText(/source: error/i);
    expect(errorText).toBeInTheDocument();
  });
});
