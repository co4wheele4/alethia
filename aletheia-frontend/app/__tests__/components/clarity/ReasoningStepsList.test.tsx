/**
 * Tests for ReasoningStepsList component
 */

import { render, screen } from '@testing-library/react';
import { ReasoningStepsList } from '../../../components/clarity/ReasoningStepsList';

describe('ReasoningStepsList', () => {
  it('should render empty state when no steps', () => {
    render(<ReasoningStepsList />);
    expect(screen.getByText('ReasoningStepsList - TODO: Implement')).toBeInTheDocument();
  });

  it('should render steps', () => {
    const steps = [
      { step: 1, description: 'First reasoning step' },
      { step: 2, description: 'Second reasoning step', evidence: ['Evidence 1', 'Evidence 2'] },
    ];

    render(<ReasoningStepsList steps={steps} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('First reasoning step')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Second reasoning step')).toBeInTheDocument();
  });

  it('should render multiple steps', () => {
    const steps = [
      { step: 1, description: 'Step 1 description' },
      { step: 2, description: 'Step 2 description' },
      { step: 3, description: 'Step 3 description' },
    ];

    render(<ReasoningStepsList steps={steps} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('should render steps without evidence', () => {
    const steps = [
      { step: 1, description: 'Step without evidence' },
    ];

    render(<ReasoningStepsList steps={steps} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step without evidence')).toBeInTheDocument();
  });
});
