/**
 * Tests for AttributionFooter component
 */

import { render, screen } from '@testing-library/react';
import { AttributionFooter } from '../../../components/truth-discovery/AttributionFooter';

describe('AttributionFooter', () => {
  it('should render placeholder when no props', () => {
    render(<AttributionFooter />);
    expect(screen.getByText('AttributionFooter - TODO: Implement')).toBeInTheDocument();
  });

  it('should render with timestamp', () => {
    render(<AttributionFooter timestamp="2024-01-01T10:00:00Z" />);
    expect(screen.getByText(/updated:.*2024-01-01/i)).toBeInTheDocument();
  });

  it('should render with origin', () => {
    render(<AttributionFooter origin="Database" />);
    expect(screen.getByText(/source:.*database/i)).toBeInTheDocument();
  });

  it('should render with confidence', () => {
    render(<AttributionFooter confidence={85} />);
    expect(screen.getByText(/confidence:.*85%/i)).toBeInTheDocument();
  });

  it('should render with all properties', () => {
    render(
      <AttributionFooter
        timestamp="2024-01-01T10:00:00Z"
        origin="API"
        confidence={90}
      />
    );
    
    expect(screen.getByText(/updated:.*2024-01-01/i)).toBeInTheDocument();
    expect(screen.getByText(/source:.*api/i)).toBeInTheDocument();
    expect(screen.getByText(/confidence:.*90%/i)).toBeInTheDocument();
  });

  it('should combine properties with separators', () => {
    render(
      <AttributionFooter
        timestamp="2024-01-01T10:00:00Z"
        origin="API"
        confidence={90}
      />
    );
    
    const text = screen.getByText(/updated:.*source:.*confidence:/i);
    expect(text).toBeInTheDocument();
  });
});
