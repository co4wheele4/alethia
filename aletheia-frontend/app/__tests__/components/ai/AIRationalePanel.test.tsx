/**
 * Tests for AIRationalePanel component
 */

import { render, screen } from '@testing-library/react';
import { AIRationalePanel } from '../../../components/ai/AIRationalePanel';

describe('AIRationalePanel', () => {
  it('should render with default title', () => {
    render(<AIRationalePanel />);
    expect(screen.getByText('AI Reasoning')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<AIRationalePanel title="Custom Reasoning Title" />);
    expect(screen.getByText('Custom Reasoning Title')).toBeInTheDocument();
  });

  it('should render empty state when no rationale', () => {
    render(<AIRationalePanel />);
    expect(screen.getByText('No rationale provided')).toBeInTheDocument();
  });

  it('should render rationale steps', () => {
    const rationale = [
      { step: 1, reasoning: 'First reasoning step' },
      { step: 2, reasoning: 'Second reasoning step', evidence: ['Evidence 1'] },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('First reasoning step')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Second reasoning step')).toBeInTheDocument();
  });

  it('should render steps with evidence', () => {
    const rationale = [
      { step: 1, reasoning: 'Step with evidence', evidence: ['E1', 'E2'] },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText(/evidence:.*e1.*e2/i)).toBeInTheDocument();
  });

  it('should render steps without evidence', () => {
    const rationale = [
      { step: 1, reasoning: 'Step without evidence' },
    ];

    render(<AIRationalePanel rationale={rationale} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step without evidence')).toBeInTheDocument();
    expect(screen.queryByText(/evidence:/i)).not.toBeInTheDocument();
  });
});
