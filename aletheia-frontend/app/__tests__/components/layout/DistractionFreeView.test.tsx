/**
 * Tests for DistractionFreeView component
 */

import { render, screen } from '@testing-library/react';
import { DistractionFreeView } from '../../../components/layout/DistractionFreeView';

describe('DistractionFreeView', () => {
  it('should render children correctly', () => {
    render(
      <DistractionFreeView>
        <div>Test Content</div>
      </DistractionFreeView>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render without children', () => {
    const { container } = render(<DistractionFreeView />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply default styles when disabled', () => {
    const { container } = render(<DistractionFreeView enabled={false}>Content</DistractionFreeView>);
    const box = container.firstChild;
    expect(box).toHaveStyle('width: 100%');
    expect(box).toHaveStyle('height: 100vh');
  });

  it('should apply distraction-free styles when enabled', () => {
    const { container } = render(<DistractionFreeView enabled={true}>Content</DistractionFreeView>);
    const box = container.firstChild;
    expect(box).toHaveStyle('width: 100%');
    expect(box).toHaveStyle('height: 100vh');
  });

  it('should default to disabled', () => {
    const { container } = render(<DistractionFreeView>Content</DistractionFreeView>);
    const box = container.firstChild;
    expect(box).toBeInTheDocument();
  });
});
