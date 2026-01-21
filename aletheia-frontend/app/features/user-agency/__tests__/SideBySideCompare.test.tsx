/**
 * Tests for SideBySideCompare component
 */

import { render, screen } from '@testing-library/react';
import { SideBySideCompare } from '../components/SideBySideCompare';

describe('SideBySideCompare', () => {
  it('should render with default titles', () => {
    render(<SideBySideCompare />);
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('should render with custom titles', () => {
    render(<SideBySideCompare leftTitle="Original" rightTitle="Modified" />);
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Modified')).toBeInTheDocument();
  });

  it('should render default placeholder content', () => {
    render(<SideBySideCompare />);
    expect(screen.getAllByText(/todo: implement/i)).toHaveLength(2);
  });

  it('should render with left and right content', () => {
    render(
      <SideBySideCompare
        leftContent={<div>Left content</div>}
        rightContent={<div>Right content</div>}
      />
    );
    expect(screen.getByText('Left content')).toBeInTheDocument();
    expect(screen.getByText('Right content')).toBeInTheDocument();
  });

  it('should render with only left content', () => {
    render(<SideBySideCompare leftContent={<div>Left only</div>} />);
    expect(screen.getByText('Left only')).toBeInTheDocument();
    expect(screen.getByText(/todo: implement right content/i)).toBeInTheDocument();
  });

  it('should render with only right content', () => {
    render(<SideBySideCompare rightContent={<div>Right only</div>} />);
    expect(screen.getByText(/todo: implement left content/i)).toBeInTheDocument();
    expect(screen.getByText('Right only')).toBeInTheDocument();
  });
});
