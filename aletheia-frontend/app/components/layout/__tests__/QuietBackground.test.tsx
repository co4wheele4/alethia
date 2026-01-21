/**
 * Tests for QuietBackground component
 */

import { render, screen } from '@testing-library/react';
import { QuietBackground } from '../QuietBackground';

describe('QuietBackground', () => {
  it('should render children correctly', () => {
    render(
      <QuietBackground>
        <div>Test Content</div>
      </QuietBackground>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render without children', () => {
    const { container } = render(<QuietBackground />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply background styles', () => {
    const { container } = render(<QuietBackground>Content</QuietBackground>);
    const box = container.firstChild;
    expect(box).toHaveStyle('min-height: 100%');
  });
});
