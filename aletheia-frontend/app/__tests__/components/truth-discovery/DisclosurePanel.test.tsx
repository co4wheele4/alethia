/**
 * Tests for DisclosurePanel component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { DisclosurePanel } from '../../../components/truth-discovery/DisclosurePanel';

describe('DisclosurePanel', () => {
  it('should render with default title', () => {
    render(<DisclosurePanel />);
    expect(screen.getByText('More context')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<DisclosurePanel title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render with summary', () => {
    render(<DisclosurePanel summary="This is a summary" />);
    expect(screen.getByText('This is a summary')).toBeInTheDocument();
  });

  it('should render children when provided', () => {
    render(
      <DisclosurePanel>
        <div>Panel Content</div>
      </DisclosurePanel>
    );
    
    // Expand the accordion to see content
    const accordionButtons = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-expanded') !== null
    );
    fireEvent.click(accordionButtons[0]);
    
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('should render placeholder when no children', () => {
    render(<DisclosurePanel />);
    
    // Expand the accordion
    const accordionButtons = screen.getAllByRole('button').filter(btn => 
      btn.getAttribute('aria-expanded') !== null
    );
    fireEvent.click(accordionButtons[0]);
    
    expect(screen.getByText('DisclosurePanel - TODO: Implement')).toBeInTheDocument();
  });

  it('should be expanded by default when defaultExpanded is true', () => {
    render(<DisclosurePanel defaultExpanded={true}>Content</DisclosurePanel>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
