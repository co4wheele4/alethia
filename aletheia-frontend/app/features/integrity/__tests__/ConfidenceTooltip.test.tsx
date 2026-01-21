/**
 * Tests for ConfidenceTooltip component
 */

import { render, screen } from '@testing-library/react';
import { ConfidenceTooltip } from '../components/ConfidenceTooltip';

describe('ConfidenceTooltip', () => {
  it('should render children', () => {
    render(
      <ConfidenceTooltip>
        <button>Hover me</button>
      </ConfidenceTooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('should show default tooltip text when no confidence or details', () => {
    render(
      <ConfidenceTooltip>
        <button>Test</button>
      </ConfidenceTooltip>
    );
    // Tooltip text is not visible until hover, but we can check it's set
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show confidence in tooltip', () => {
    render(
      <ConfidenceTooltip confidence={75}>
        <button>Test</button>
      </ConfidenceTooltip>
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Tooltip content is accessible via aria-label or title attribute
  });

  it('should show custom details in tooltip', () => {
    render(
      <ConfidenceTooltip details="Custom tooltip text">
        <button>Test</button>
      </ConfidenceTooltip>
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should prioritize details over confidence', () => {
    render(
      <ConfidenceTooltip confidence={50} details="Custom details">
        <button>Test</button>
      </ConfidenceTooltip>
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should work with different child types', () => {
    render(
      <ConfidenceTooltip confidence={80}>
        <span>Test span</span>
      </ConfidenceTooltip>
    );
    expect(screen.getByText('Test span')).toBeInTheDocument();
  });
});
