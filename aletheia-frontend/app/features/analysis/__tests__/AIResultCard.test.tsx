/**
 * Tests for AIResultCard component
 */

import { render, screen } from '@testing-library/react';
import { AIResultCard } from '../components/AIResultCard';

describe('AIResultCard', () => {
  it('should render title', () => {
    render(<AIResultCard />);
    expect(screen.getByText('AI Result')).toBeInTheDocument();
  });

  it('should render with result', () => {
    render(<AIResultCard result="Test result" />);
    expect(screen.getByText('Test result')).toBeInTheDocument();
  });

  it('should render with confidence', () => {
    render(<AIResultCard confidence={85} />);
    expect(screen.getByText(/confidence: 85%/i)).toBeInTheDocument();
  });

  it('should render with explanation', () => {
    render(<AIResultCard explanation="This is the explanation" />);
    expect(screen.getByText('Explanation:')).toBeInTheDocument();
    expect(screen.getByText('This is the explanation')).toBeInTheDocument();
  });

  it('should show warning when no explanation', () => {
    render(<AIResultCard result="Result without explanation" />);
    expect(screen.getByText(/explanation required before treating this as reliable output/i)).toBeInTheDocument();
  });

  it('should not show warning when explanation is provided', () => {
    render(<AIResultCard result="Result" explanation="Has explanation" />);
    expect(screen.queryByText(/explanation required/i)).not.toBeInTheDocument();
  });

  it('should render with all props', () => {
    render(
      <AIResultCard
        result="Complete result"
        confidence={90}
        explanation="Full explanation"
      />
    );
    
    expect(screen.getByText('Complete result')).toBeInTheDocument();
    expect(screen.getByText(/confidence: 90%/i)).toBeInTheDocument();
    expect(screen.getByText('Full explanation')).toBeInTheDocument();
  });
});
