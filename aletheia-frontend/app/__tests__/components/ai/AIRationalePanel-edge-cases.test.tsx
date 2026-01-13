/**
 * Edge case tests for AIRationalePanel component
 * Tests edge cases, boundary conditions, and all code paths
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { AIRationalePanel } from '../../../components/ai/AIRationalePanel';

describe('AIRationalePanel Edge Cases', () => {
  it('should handle empty string title', () => {
    const { container } = render(<AIRationalePanel title="" />);
    // Empty string is not undefined, so it will render as empty (not use default)
    // Component should still render
    expect(container).toBeInTheDocument();
    // Title Typography should exist
    const titleElement = container.querySelector('.MuiTypography-h6') || container.querySelector('h6');
    expect(titleElement).toBeInTheDocument();
  });

  it('should handle rationale with empty reasoning', () => {
    const rationale = [
      { step: 1, reasoning: '' },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('should handle rationale with empty evidence array', () => {
    const rationale = [
      { step: 1, reasoning: 'Reasoning', evidence: [] },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText(/evidence:/i)).not.toBeInTheDocument();
  });

  it('should handle rationale with null evidence', () => {
    const rationale = [
      { step: 1, reasoning: 'Reasoning', evidence: null as unknown as string },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText(/evidence:/i)).not.toBeInTheDocument();
  });

  it('should handle rationale with undefined evidence', () => {
    const rationale = [
      { step: 1, reasoning: 'Reasoning', evidence: undefined },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText(/evidence:/i)).not.toBeInTheDocument();
  });

  it('should handle many rationale steps', () => {
    const rationale = Array.from({ length: 20 }, (_, i) => ({
      step: i + 1,
      reasoning: `Step ${i + 1} reasoning`,
    }));

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 20')).toBeInTheDocument();
  });

  it('should handle rationale with many evidence items', () => {
    const rationale = [
      {
        step: 1,
        reasoning: 'Reasoning',
        evidence: Array.from({ length: 10 }, (_, i) => `Evidence ${i}`),
      },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText(/evidence:.*evidence 0/i)).toBeInTheDocument();
  });

  it('should handle rationale with evidence containing special characters', () => {
    const rationale = [
      {
        step: 1,
        reasoning: 'Reasoning',
        evidence: ['Evidence!@#', 'Evidence$%^'],
      },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText(/evidence:.*evidence!@#/i)).toBeInTheDocument();
  });

  it('should handle non-sequential step numbers', () => {
    const rationale = [
      { step: 5, reasoning: 'Step 5 reasoning' },
      { step: 10, reasoning: 'Step 10 reasoning' },
      { step: 15, reasoning: 'Step 15 reasoning' },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText('Step 5')).toBeInTheDocument();
    expect(screen.getByText('Step 10')).toBeInTheDocument();
    expect(screen.getByText('Step 15')).toBeInTheDocument();
    expect(screen.getByText('Step 5 reasoning')).toBeInTheDocument();
    expect(screen.getByText('Step 10 reasoning')).toBeInTheDocument();
    expect(screen.getByText('Step 15 reasoning')).toBeInTheDocument();
  });
});
