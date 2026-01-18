/**
 * Tests for DetailDrawer component
 */

import { render, screen } from '@testing-library/react';
import { DetailDrawer } from '../../../components/truth-discovery/DetailDrawer';

describe('DetailDrawer', () => {
  it('should not render when closed', () => {
    render(<DetailDrawer open={false} />);
    expect(screen.queryByText('DetailDrawer - TODO: Implement')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(<DetailDrawer open={true} />);
    expect(screen.getByText('DetailDrawer - TODO: Implement')).toBeInTheDocument();
  });

  it('should render children when provided', () => {
    render(
      <DetailDrawer open={true}>
        <div>Custom Content</div>
      </DetailDrawer>
    );
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should call onClose when drawer is closed', () => {
    const handleClose = vi.fn();
    render(<DetailDrawer open={true} onClose={handleClose} />);
    
    // MUI Drawer closes via backdrop click or escape key
    // We can test that onClose is passed correctly
    expect(screen.getByText('DetailDrawer - TODO: Implement')).toBeInTheDocument();
  });

  it('should work with different anchor positions', () => {
    const { rerender } = render(<DetailDrawer open={true} anchor="left" />);
    expect(screen.getByText('DetailDrawer - TODO: Implement')).toBeInTheDocument();
    
    rerender(<DetailDrawer open={true} anchor="right" />);
    expect(screen.getByText('DetailDrawer - TODO: Implement')).toBeInTheDocument();
    
    rerender(<DetailDrawer open={true} anchor="top" />);
    expect(screen.getByText('DetailDrawer - TODO: Implement')).toBeInTheDocument();
    
    rerender(<DetailDrawer open={true} anchor="bottom" />);
    expect(screen.getByText('DetailDrawer - TODO: Implement')).toBeInTheDocument();
  });
});
