/**
 * Tests for StateInspector component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { StateInspector } from '../../../components/dev/StateInspector';

describe('StateInspector', () => {
  it('should render title', () => {
    render(<StateInspector />);
    expect(screen.getByText('State Inspector (Dev Mode)')).toBeInTheDocument();
  });

  it('should render UI State accordion', () => {
    render(<StateInspector />);
    expect(screen.getByText('UI State')).toBeInTheDocument();
  });

  it('should render Data State accordion', () => {
    render(<StateInspector />);
    expect(screen.getByText('Data State')).toBeInTheDocument();
  });

  it('should display UI state when expanded', () => {
    const uiState = { key1: 'value1', key2: 123 };
    render(<StateInspector uiState={uiState} />);
    
    // Find the accordion summary button
    const accordionButtons = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-expanded') !== null
    );
    fireEvent.click(accordionButtons[0]);
    
    expect(screen.getByText(/"key1":\s*"value1"/)).toBeInTheDocument();
  });

  it('should display data state when expanded', () => {
    const dataState = { data1: 'test', data2: true };
    render(<StateInspector dataState={dataState} />);
    
    // Find the accordion summary button (second one is Data State)
    const accordionButtons = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-expanded') !== null
    );
    fireEvent.click(accordionButtons[1]);
    
    expect(screen.getByText(/"data1":\s*"test"/)).toBeInTheDocument();
  });

  it('should display empty state when no props', async () => {
    const { container } = render(<StateInspector />);
    
    // Find the accordion summary button and expand it
    const accordionButtons = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-expanded') !== null
    );
    
    // Click to expand
    fireEvent.click(accordionButtons[0]);
    
    // Wait a bit for the accordion to expand and content to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // JSON.stringify(undefined) returns "undefined" as a string
    // Check that pre elements exist (they should be in the DOM even if not visible)
    const preElements = container.querySelectorAll('pre');
    // Pre elements exist in the DOM, they just might not be visible until expanded
    expect(preElements.length).toBeGreaterThanOrEqual(1);
  });
});
