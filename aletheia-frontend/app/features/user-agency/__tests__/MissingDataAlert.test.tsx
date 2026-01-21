/**
 * Tests for MissingDataAlert component
 */

import { render, screen } from '@testing-library/react';
import { MissingDataAlert } from '../components/MissingDataAlert';

describe('MissingDataAlert', () => {
  it('should render with default message', () => {
    render(<MissingDataAlert />);
    expect(screen.getByText('Missing Data')).toBeInTheDocument();
    expect(screen.getByText('Required data is missing')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<MissingDataAlert message="Custom missing data message" />);
    expect(screen.getByText('Custom missing data message')).toBeInTheDocument();
  });

  it('should render with field-specific message', () => {
    render(<MissingDataAlert field="email" />);
    expect(screen.getByText(/data missing for field: email/i)).toBeInTheDocument();
  });

  it('should prioritize custom message over field', () => {
    render(<MissingDataAlert message="Custom" field="email" />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
  });

  it('should render as warning alert', () => {
    render(<MissingDataAlert />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardWarning');
  });
});
