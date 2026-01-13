/**
 * Tests for SourcePopover component
 */

import { render, screen } from '@testing-library/react';
import { SourcePopover } from '../../../components/truth-discovery/SourcePopover';

describe('SourcePopover', () => {
  it('should not render when closed', () => {
    render(<SourcePopover open={false} />);
    expect(screen.queryByText('Source Information')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(<SourcePopover open={true} anchorEl={document.body} />);
    expect(screen.getByText('Source Information')).toBeInTheDocument();
  });

  it('should render with source origin', () => {
    render(
      <SourcePopover
        open={true}
        anchorEl={document.body}
        source={{ origin: 'Database' }}
      />
    );
    expect(screen.getByText(/origin:.*database/i)).toBeInTheDocument();
  });

  it('should render with timestamp', () => {
    render(
      <SourcePopover
        open={true}
        anchorEl={document.body}
        source={{ timestamp: '2024-01-01T10:00:00Z' }}
      />
    );
    expect(screen.getByText(/time:.*2024-01-01/i)).toBeInTheDocument();
  });

  it('should render with confidence', () => {
    render(
      <SourcePopover
        open={true}
        anchorEl={document.body}
        source={{ confidence: 85 }}
      />
    );
    expect(screen.getByText(/confidence:.*85%/i)).toBeInTheDocument();
  });

  it('should render with all source properties', () => {
    render(
      <SourcePopover
        open={true}
        anchorEl={document.body}
        source={{
          origin: 'API',
          timestamp: '2024-01-01T10:00:00Z',
          confidence: 90,
        }}
      />
    );
    
    expect(screen.getByText(/origin:.*api/i)).toBeInTheDocument();
    expect(screen.getByText(/time:.*2024-01-01/i)).toBeInTheDocument();
    expect(screen.getByText(/confidence:.*90%/i)).toBeInTheDocument();
  });
});
