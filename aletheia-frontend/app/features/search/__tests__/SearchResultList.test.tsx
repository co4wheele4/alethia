/**
 * Tests for SearchResultList component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResultList } from '../components/SearchResultList';

describe('SearchResultList', () => {
  it('should render empty state when no results', () => {
    render(<SearchResultList />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('should render search results', () => {
    const results = [
      {
        id: '1',
        title: 'Result 1',
        snippet: 'Snippet 1',
      },
      {
        id: '2',
        title: 'Result 2',
        snippet: 'Snippet 2',
        explanation: 'Explanation 2',
      },
    ];

    render(<SearchResultList results={results} />);
    
    expect(screen.getByText('Result 1')).toBeInTheDocument();
    expect(screen.getByText('Snippet 1')).toBeInTheDocument();
    expect(screen.getByText('Result 2')).toBeInTheDocument();
    expect(screen.getByText('Snippet 2')).toBeInTheDocument();
  });

  it('should call onResultClick when result is clicked', () => {
    const handleClick = vi.fn();
    const results = [
      { id: '1', title: 'Result 1' },
    ];

    render(<SearchResultList results={results} onResultClick={handleClick} />);
    
    const result = screen.getByText('Result 1');
    fireEvent.click(result);
    
    expect(handleClick).toHaveBeenCalledWith('1');
  });

  it('should work without onResultClick handler', () => {
    const results = [
      { id: '1', title: 'Result 1' },
    ];

    render(<SearchResultList results={results} />);
    
    expect(() => {
      const result = screen.getByText('Result 1');
      fireEvent.click(result);
    }).not.toThrow();
  });

  it('should render results with match coverage percent', () => {
    const results = [
      { id: '1', title: 'Result 1', matchCoveragePercent: 85 },
    ];

    render(<SearchResultList results={results} />);
    
    expect(screen.getByText('Result 1')).toBeInTheDocument();
    // Match coverage is shown in SearchResultExplanation component
  });

  it('should render results with matched terms', () => {
    const results = [
      { id: '1', title: 'Result 1', matchedTerms: ['term1', 'term2'] },
    ];

    render(<SearchResultList results={results} />);
    
    expect(screen.getByText('Result 1')).toBeInTheDocument();
    // Matched terms are shown in SearchResultExplanation component
  });
});
