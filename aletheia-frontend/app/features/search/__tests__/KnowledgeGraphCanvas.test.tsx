/**
 * Tests for KnowledgeGraphCanvas component
 */

import { render, screen } from '@testing-library/react';
import { KnowledgeGraphCanvas } from '../components/KnowledgeGraphCanvas';

describe('KnowledgeGraphCanvas', () => {
  it('should render placeholder text', () => {
    render(<KnowledgeGraphCanvas />);
    expect(screen.getByText(/knowledgegraphcanvas.*todo: implement/i)).toBeInTheDocument();
  });

  it('should render with correct dimensions', () => {
    const { container } = render(<KnowledgeGraphCanvas />);
    const box = container.firstChild;
    expect(box).toHaveStyle('width: 100%');
    expect(box).toHaveStyle('height: 600px');
  });

  it('should work without handlers', () => {
    render(<KnowledgeGraphCanvas />);
    expect(screen.getByText(/knowledgegraphcanvas.*todo: implement/i)).toBeInTheDocument();
  });
});
