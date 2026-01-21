/**
 * Tests for SearchResultExplanation component
 */

import { render, screen } from '@testing-library/react';
import { SearchResultExplanation } from '../components/SearchResultExplanation';

describe('SearchResultExplanation', () => {
  it('should render without props', () => {
    const { container } = render(<SearchResultExplanation />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with explanation', () => {
    render(<SearchResultExplanation explanation="This result matched because..." />);
    expect(screen.getByText(/why matched:.*this result matched/i)).toBeInTheDocument();
  });

  it('should render with relevance score', () => {
    render(<SearchResultExplanation relevanceScore={85} />);
    expect(screen.getByText(/relevance: 85%/i)).toBeInTheDocument();
  });

  it('should render with matched terms', () => {
    render(<SearchResultExplanation matchedTerms={['term1', 'term2']} />);
    
    expect(screen.getByText('term1')).toBeInTheDocument();
    expect(screen.getByText('term2')).toBeInTheDocument();
  });

  it('should render with all props', () => {
    render(
      <SearchResultExplanation
        explanation="Full explanation"
        relevanceScore={90}
        matchedTerms={['term1', 'term2', 'term3']}
      />
    );
    
    expect(screen.getByText(/why matched:.*full explanation/i)).toBeInTheDocument();
    expect(screen.getByText(/relevance: 90%/i)).toBeInTheDocument();
    expect(screen.getByText('term1')).toBeInTheDocument();
    expect(screen.getByText('term2')).toBeInTheDocument();
    expect(screen.getByText('term3')).toBeInTheDocument();
  });

  it('should not render explanation when not provided', () => {
    render(<SearchResultExplanation relevanceScore={50} />);
    expect(screen.queryByText(/why matched:/i)).not.toBeInTheDocument();
  });

  it('should not render relevance when not provided', () => {
    render(<SearchResultExplanation explanation="Explanation" />);
    expect(screen.queryByText(/relevance:/i)).not.toBeInTheDocument();
  });

  it('should not render matched terms when empty array', () => {
    render(<SearchResultExplanation matchedTerms={[]} />);
    // No chips should be rendered
    expect(screen.queryByRole('chip')).not.toBeInTheDocument();
  });
});
