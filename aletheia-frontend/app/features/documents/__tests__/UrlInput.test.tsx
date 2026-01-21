import { render, screen, fireEvent } from '@testing-library/react';
import { UrlInput } from '../components/UrlInput';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('UrlInput', () => {
  it('renders correctly and handles changes', () => {
    const onUrlChange = vi.fn();
    const onTitleOverrideChange = vi.fn();

    render(
      <TestWrapper>
        <UrlInput
          url="https://example.com"
          titleOverride="Test Title"
          onUrlChange={onUrlChange}
          onTitleOverrideChange={onTitleOverrideChange}
        />
      </TestWrapper>
    );

    const urlInput = screen.getByLabelText(/URL/i);
    const titleInput = screen.getByLabelText(/Title override/i);

    expect(urlInput).toHaveValue('https://example.com');
    expect(titleInput).toHaveValue('Test Title');

    fireEvent.change(urlInput, { target: { value: 'https://new.com' } });
    expect(onUrlChange).toHaveBeenCalledWith('https://new.com');

    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    expect(onTitleOverrideChange).toHaveBeenCalledWith('New Title');
  });

  it('renders error alert when error is provided', () => {
    render(
      <TestWrapper>
        <UrlInput
          url=""
          titleOverride=""
          error="Failed to fetch"
          onUrlChange={vi.fn()}
          onTitleOverrideChange={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
  });
});
