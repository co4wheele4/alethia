/**
 * Tests for BeforeAfterView component
 */

import { render, screen } from '@testing-library/react';
import { BeforeAfterView } from '../components/BeforeAfterView';

describe('BeforeAfterView', () => {
  it('should render with default titles', () => {
    render(<BeforeAfterView />);
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('should render with before and after content', () => {
    render(<BeforeAfterView before="Original content" after="Updated content" />);
    expect(screen.getByText('Original content')).toBeInTheDocument();
    expect(screen.getByText('Updated content')).toBeInTheDocument();
  });

  it('should render default content when no props', () => {
    render(<BeforeAfterView />);
    expect(screen.getAllByText('No content')).toHaveLength(2);
  });

  it('should render with different before and after content', () => {
    render(<BeforeAfterView before="Old text" after="New text" />);
    expect(screen.getByText('Old text')).toBeInTheDocument();
    expect(screen.getByText('New text')).toBeInTheDocument();
  });

  it('should render with only before content', () => {
    render(<BeforeAfterView before="Only before" />);
    expect(screen.getByText('Only before')).toBeInTheDocument();
    expect(screen.getByText('No content')).toBeInTheDocument();
  });

  it('should render with only after content', () => {
    render(<BeforeAfterView after="Only after" />);
    expect(screen.getByText('No content')).toBeInTheDocument();
    expect(screen.getByText('Only after')).toBeInTheDocument();
  });
});
