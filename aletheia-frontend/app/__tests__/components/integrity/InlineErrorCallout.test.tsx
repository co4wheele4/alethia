/**
 * Tests for InlineErrorCallout component
 */

import { render, screen } from '@testing-library/react';
import { InlineErrorCallout } from '../../../components/integrity/InlineErrorCallout';

describe('InlineErrorCallout', () => {
  it('should render with default error message', () => {
    render(<InlineErrorCallout />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    // MUI Alert severity is applied via classes, not attributes
    expect(alert).toHaveClass('MuiAlert-standardError');
  });

  it('should render with custom message', () => {
    render(<InlineErrorCallout message="Custom error message" />);
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should render with error severity by default', () => {
    render(<InlineErrorCallout message="Error message" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    // MUI Alert severity is applied via classes
    expect(alert).toHaveClass('MuiAlert-standardError');
  });

  it('should render with warning severity', () => {
    render(<InlineErrorCallout message="Warning message" severity="warning" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('MuiAlert-standardWarning');
  });

  it('should render with info severity', () => {
    render(<InlineErrorCallout message="Info message" severity="info" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('MuiAlert-standardInfo');
  });
});
