/**
 * Tests for ReadOnlyField component
 */

import { render, screen } from '@testing-library/react';
import { ReadOnlyField } from '../components/ReadOnlyField';

describe('ReadOnlyField', () => {
  it('should render with label', () => {
    render(<ReadOnlyField label="Field Label" />);
    expect(screen.getByLabelText('Field Label')).toBeInTheDocument();
  });

  it('should render with value', () => {
    render(<ReadOnlyField label="Test Field" value="Test Value" />);
    const input = screen.getByLabelText('Test Field') as HTMLInputElement;
    expect(input.value).toBe('Test Value');
  });

  it('should render with empty value by default', () => {
    render(<ReadOnlyField label="Empty Field" />);
    const input = screen.getByLabelText('Empty Field') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('should render as multiline when specified', () => {
    render(<ReadOnlyField label="Multiline Field" multiline value="Line 1\nLine 2" />);
    const input = screen.getByLabelText('Multiline Field');
    expect(input.tagName).toBe('TEXTAREA');
  });

  it('should render as single line by default', () => {
    render(<ReadOnlyField label="Single Line Field" value="Single value" />);
    const input = screen.getByLabelText('Single Line Field');
    expect(input.tagName).toBe('INPUT');
  });

  it('should be read-only', () => {
    render(<ReadOnlyField label="Read Only" value="Cannot edit" />);
    const input = screen.getByLabelText('Read Only') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });

  it('should work without label', () => {
    render(<ReadOnlyField value="No label" />);
    const input = screen.getByDisplayValue('No label');
    expect(input).toBeInTheDocument();
  });
});
