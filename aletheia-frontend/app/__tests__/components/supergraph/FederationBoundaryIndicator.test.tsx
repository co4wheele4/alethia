/**
 * Tests for FederationBoundaryIndicator component
 */

import { render, screen } from '@testing-library/react';
import { FederationBoundaryIndicator } from '../../../components/supergraph/FederationBoundaryIndicator';

describe('FederationBoundaryIndicator', () => {
  it('should not render when visible is false', () => {
    const { container } = render(<FederationBoundaryIndicator visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render by default', () => {
    const { container } = render(<FederationBoundaryIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when visible is true', () => {
    render(<FederationBoundaryIndicator visible={true} />);
    expect(screen.getByText(/federation boundary:.*unknown/i)).toBeInTheDocument();
  });

  it('should render with boundary name', () => {
    render(<FederationBoundaryIndicator boundary="UserService" visible={true} />);
    expect(screen.getByText(/federation boundary:.*userservice/i)).toBeInTheDocument();
  });
});
