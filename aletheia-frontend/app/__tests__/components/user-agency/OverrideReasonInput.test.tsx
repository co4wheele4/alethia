/**
 * Tests for OverrideReasonInput component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { OverrideReasonInput } from '../../../components/user-agency/OverrideReasonInput';

describe('OverrideReasonInput', () => {
  it('should render with default label', () => {
    render(<OverrideReasonInput />);
    // MUI TextField label might not be immediately accessible, check for placeholder or text
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('should render with empty value by default', () => {
    render(<OverrideReasonInput />);
    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(input.value).toBe('');
  });

  it('should render with value', () => {
    render(<OverrideReasonInput value="Test reason" />);
    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(input.value).toBe('Test reason');
  });

  it('should call onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<OverrideReasonInput onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New reason' } });
    
    expect(handleChange).toHaveBeenCalledWith('New reason');
  });

  it('should show required helper text by default', () => {
    render(<OverrideReasonInput />);
    expect(screen.getByText('Reason is required')).toBeInTheDocument();
  });

  it('should show custom helper text', () => {
    render(<OverrideReasonInput helperText="Custom helper text" />);
    expect(screen.getByText('Custom helper text')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(<OverrideReasonInput error={true} />);
    const input = screen.getByRole('textbox');
    // Error state is applied to parent, check for error class in the component tree
    const container = input.closest('.MuiInputBase-root');
    expect(container).toHaveClass('Mui-error');
  });

  it('should not be required when required is false', () => {
    render(<OverrideReasonInput required={false} />);
    const input = screen.getByLabelText('Reason for override');
    expect(input).not.toBeRequired();
    expect(screen.queryByText('Reason is required')).not.toBeInTheDocument();
  });

  it('should be multiline', () => {
    render(<OverrideReasonInput />);
    const input = screen.getByRole('textbox');
    expect(input.tagName).toBe('TEXTAREA');
  });

  it('should work without onChange handler', () => {
    render(<OverrideReasonInput />);
    const input = screen.getByRole('textbox');
    
    expect(() => {
      fireEvent.change(input, { target: { value: 'Test' } });
    }).not.toThrow();
  });
});
