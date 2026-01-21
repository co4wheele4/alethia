/**
 * Tests for ActionSummaryFooter component
 */

import { render, screen } from '@testing-library/react';
import { ActionSummaryFooter } from '../components/ActionSummaryFooter';

describe('ActionSummaryFooter', () => {
  it('should render without summary or consequences', () => {
    const { container } = render(<ActionSummaryFooter />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with summary', () => {
    render(<ActionSummaryFooter summary="This action will update the record" />);
    expect(screen.getByText('This action will update the record')).toBeInTheDocument();
  });

  it('should render with consequences', () => {
    const consequences = ['Consequence 1', 'Consequence 2'];
    render(<ActionSummaryFooter consequences={consequences} />);
    
    expect(screen.getByText('Consequences:')).toBeInTheDocument();
    expect(screen.getByText('Consequence 1')).toBeInTheDocument();
    expect(screen.getByText('Consequence 2')).toBeInTheDocument();
  });

  it('should render with both summary and consequences', () => {
    const consequences = ['Impact 1', 'Impact 2'];
    render(
      <ActionSummaryFooter
        summary="Action summary"
        consequences={consequences}
      />
    );
    
    expect(screen.getByText('Action summary')).toBeInTheDocument();
    expect(screen.getByText('Consequences:')).toBeInTheDocument();
    expect(screen.getByText('Impact 1')).toBeInTheDocument();
    expect(screen.getByText('Impact 2')).toBeInTheDocument();
  });

  it('should render empty consequences list', () => {
    render(<ActionSummaryFooter consequences={[]} />);
    expect(screen.queryByText('Consequences:')).not.toBeInTheDocument();
  });
});
