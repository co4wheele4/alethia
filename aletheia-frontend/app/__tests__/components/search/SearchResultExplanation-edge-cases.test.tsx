/**
 * Edge case tests for SearchResultExplanation component
 * Tests edge cases, boundary conditions, and all code paths
 */

import { render, screen } from '@testing-library/react';
import { SearchResultExplanation } from '../../../components/search/SearchResultExplanation';

describe('SearchResultExplanation Edge Cases', () => {
  it('should handle empty explanation string', () => {
    render(<SearchResultExplanation explanation="" />);
    // Empty string is falsy, so explanation should not render
    expect(screen.queryByText(/why matched:/i)).not.toBeInTheDocument();
  });

  it('should handle relevance score of 0', () => {
    render(<SearchResultExplanation relevanceScore={0} />);
    expect(screen.getByText(/relevance: 0%/i)).toBeInTheDocument();
  });

  it('should handle relevance score of 100', () => {
    render(<SearchResultExplanation relevanceScore={100} />);
    expect(screen.getByText(/relevance: 100%/i)).toBeInTheDocument();
  });

  it('should handle relevance score outside 0-100 range', () => {
    render(<SearchResultExplanation relevanceScore={150} />);
    expect(screen.getByText(/relevance: 150%/i)).toBeInTheDocument();
  });

  it('should handle negative relevance score', () => {
    render(<SearchResultExplanation relevanceScore={-10} />);
    expect(screen.getByText(/relevance: -10%/i)).toBeInTheDocument();
  });

  it('should handle empty matched terms array', () => {
    render(<SearchResultExplanation matchedTerms={[]} />);
    expect(screen.queryByRole('chip')).not.toBeInTheDocument();
  });

  it('should handle single matched term', () => {
    render(<SearchResultExplanation matchedTerms={['single']} />);
    expect(screen.getByText('single')).toBeInTheDocument();
  });

  it('should handle many matched terms', () => {
    const manyTerms = Array.from({ length: 20 }, (_, i) => `term${i}`);
    render(<SearchResultExplanation matchedTerms={manyTerms} />);
    
    manyTerms.forEach((term) => {
      expect(screen.getByText(term)).toBeInTheDocument();
    });
  });

  it('should handle matched terms with special characters', () => {
    render(<SearchResultExplanation matchedTerms={['term!@#', 'term$%^']} />);
    expect(screen.getByText('term!@#')).toBeInTheDocument();
    expect(screen.getByText('term$%^')).toBeInTheDocument();
  });

  it('should handle all props together', () => {
    render(
      <SearchResultExplanation
        explanation="Full explanation"
        relevanceScore={95}
        matchedTerms={['term1', 'term2']}
      />
    );
    
    expect(screen.getByText(/why matched:.*full explanation/i)).toBeInTheDocument();
    expect(screen.getByText(/relevance: 95%/i)).toBeInTheDocument();
    expect(screen.getByText('term1')).toBeInTheDocument();
    expect(screen.getByText('term2')).toBeInTheDocument();
  });

  it('should handle undefined relevance score', () => {
    render(<SearchResultExplanation explanation="Test" />);
    expect(screen.queryByText(/relevance:/i)).not.toBeInTheDocument();
  });
});
