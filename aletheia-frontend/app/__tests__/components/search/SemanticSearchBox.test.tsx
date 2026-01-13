/**
 * Tests for SemanticSearchBox component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SemanticSearchBox } from '../../../components/search/SemanticSearchBox';

describe('SemanticSearchBox', () => {
  it('should render with default placeholder', () => {
    render(<SemanticSearchBox />);
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    render(<SemanticSearchBox placeholder="Custom search" />);
    const input = screen.getByPlaceholderText('Custom search');
    expect(input).toBeInTheDocument();
  });

  it('should render with value', () => {
    render(<SemanticSearchBox value="Test query" />);
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(input.value).toBe('Test query');
  });

  it('should call onChange when value changes', () => {
    const handleChange = jest.fn();
    render(<SemanticSearchBox onChange={handleChange} />);
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'New query' } });
    
    expect(handleChange).toHaveBeenCalledWith('New query');
  });

  it('should call onSearch when Enter is pressed', () => {
    const handleSearch = jest.fn();
    render(<SemanticSearchBox value="Search term" onSearch={handleSearch} />);
    
    const input = screen.getByPlaceholderText('Search...');
    // The component uses onKeyPress which checks e.key === 'Enter'
    // Create a proper keyboard event
    const enterEvent = new KeyboardEvent('keypress', {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
      keyCode: 13,
      bubbles: true,
    });
    fireEvent(input, enterEvent);
    
    expect(handleSearch).toHaveBeenCalledWith('Search term');
  });

  it('should not call onSearch when other keys are pressed', () => {
    const handleSearch = jest.fn();
    render(<SemanticSearchBox value="Search term" onSearch={handleSearch} />);
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.keyPress(input, { key: 'Space', code: 'Space' });
    
    expect(handleSearch).not.toHaveBeenCalled();
  });

  it('should work without handlers', () => {
    render(<SemanticSearchBox />);
    const input = screen.getByPlaceholderText('Search...');
    
    expect(() => {
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    }).not.toThrow();
  });
});
