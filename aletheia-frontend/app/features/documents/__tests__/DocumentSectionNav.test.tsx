import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentSectionNav } from '../components/DocumentSectionNav';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockChunks = [
  { id: 'c1', chunkIndex: 0, content: 'chunk 0' },
  { id: 'c2', chunkIndex: 1, content: 'chunk 1' },
];

describe('DocumentSectionNav', () => {
  it('renders chunk buttons and handles selection', () => {
    const onSelect = vi.fn();
    render(
      <TestWrapper>
        <DocumentSectionNav
          chunks={mockChunks as any}
          selectedChunkIndex={0}
          onSelectChunkIndex={onSelect}
        />
      </TestWrapper>
    );

    expect(screen.getByText('0')).toHaveClass('MuiButton-contained');
    expect(screen.getByText('1')).toHaveClass('MuiButton-outlined');

    fireEvent.click(screen.getByText('1'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
