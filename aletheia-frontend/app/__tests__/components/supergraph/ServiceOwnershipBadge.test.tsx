/**
 * Tests for ServiceOwnershipBadge component
 */

import { render, screen } from '@testing-library/react';
import { ServiceOwnershipBadge } from '../../../components/supergraph/ServiceOwnershipBadge';

describe('ServiceOwnershipBadge', () => {
  it('should not render when visible is false', () => {
    const { container } = render(<ServiceOwnershipBadge visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render by default', () => {
    const { container } = render(<ServiceOwnershipBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when visible is true', () => {
    render(<ServiceOwnershipBadge visible={true} />);
    expect(screen.getByText('Service')).toBeInTheDocument();
  });

  it('should render with service name', () => {
    render(<ServiceOwnershipBadge serviceName="UserService" visible={true} />);
    expect(screen.getByText('Service: UserService')).toBeInTheDocument();
  });

  it('should render without service name', () => {
    render(<ServiceOwnershipBadge visible={true} />);
    expect(screen.getByText('Service')).toBeInTheDocument();
  });
});
