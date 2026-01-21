/**
 * Edge case tests for SideBySideCompare component
 * Tests edge cases, boundary conditions, and all code paths
 */

import { render, screen } from '@testing-library/react';
import { SideBySideCompare } from '../components/SideBySideCompare';

describe('SideBySideCompare Edge Cases', () => {
  it('should handle empty string titles', () => {
    const { container } = render(<SideBySideCompare leftTitle="" rightTitle="" />);
    // Empty strings should still render (component handles them)
    const typographyElements = container.querySelectorAll('.MuiTypography-root');
    expect(typographyElements.length).toBeGreaterThan(0);
  });

  it('should handle very long titles', () => {
    const longTitle = 'A'.repeat(200);
    render(<SideBySideCompare leftTitle={longTitle} rightTitle={longTitle} />);
    expect(screen.getAllByText(longTitle)).toHaveLength(2);
  });

  it('should handle titles with special characters', () => {
    const specialTitle = 'Title!@#$%^&*()';
    render(<SideBySideCompare leftTitle={specialTitle} rightTitle={specialTitle} />);
    expect(screen.getAllByText(specialTitle)).toHaveLength(2);
  });

  it('should handle React node content', () => {
    render(
      <SideBySideCompare
        leftContent={<div><span>Nested</span> Content</div>}
        rightContent={<div><strong>Bold</strong> Content</div>}
      />
    );
    
    expect(screen.getByText('Nested')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });

  it('should handle null content', () => {
    render(
      <SideBySideCompare
        leftContent={null}
        rightContent={null}
      />
    );
    
    // Should show placeholder
    expect(screen.getAllByText(/todo: implement/i)).toHaveLength(2);
  });

  it('should handle mixed content types', () => {
    render(
      <SideBySideCompare
        leftContent="String content"
        rightContent={<div>JSX content</div>}
      />
    );
    
    expect(screen.getByText('String content')).toBeInTheDocument();
    expect(screen.getByText('JSX content')).toBeInTheDocument();
  });

  it('should handle very long content', () => {
    const longContent = 'A'.repeat(1000);
    render(
      <SideBySideCompare
        leftContent={longContent}
        rightContent={longContent}
      />
    );
    
    expect(screen.getAllByText(longContent)).toHaveLength(2);
  });
});
