/**
 * Tests for DiffViewer component
 */

import { render, screen } from '@testing-library/react';
import { DiffViewer } from '../components/DiffViewer';

describe('DiffViewer', () => {
  it('should render with default text when no props', () => {
    render(<DiffViewer />);
    expect(screen.getByText('- Old text')).toBeInTheDocument();
    expect(screen.getByText('+ New text')).toBeInTheDocument();
  });

  it('should render with custom old and new text', () => {
    render(<DiffViewer oldText="Original content" newText="Updated content" />);
    expect(screen.getByText('- Original content')).toBeInTheDocument();
    expect(screen.getByText('+ Updated content')).toBeInTheDocument();
  });

  it('should render with only old text', () => {
    render(<DiffViewer oldText="Only old" />);
    expect(screen.getByText('- Only old')).toBeInTheDocument();
    expect(screen.getByText('+ New text')).toBeInTheDocument();
  });

  it('should render with only new text', () => {
    render(<DiffViewer newText="Only new" />);
    expect(screen.getByText('- Old text')).toBeInTheDocument();
    expect(screen.getByText('+ Only new')).toBeInTheDocument();
  });
});
