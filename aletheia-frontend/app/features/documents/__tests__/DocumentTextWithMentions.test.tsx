import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ThemeProvider } from '../../../hooks/useTheme';
import { DocumentTextWithMentions } from '../components/DocumentTextWithMentions';

const TestWrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe('DocumentTextWithMentions', () => {
  it('renders highlights strictly from offsets and supports click-through', async () => {
    const user = userEvent.setup();
    const onEntityClick = vi.fn();

    render(
      <TestWrapper>
        <DocumentTextWithMentions
          chunks={[
            {
              __typename: 'DocumentChunk',
              id: 'c1',
              chunkIndex: 1,
              content: 'This chunk mentions Test Entity.',
              mentions: [
                {
                  __typename: 'EntityMention',
                  id: 'm1',
                  entityId: 'e1',
                  startOffset: 20,
                  endOffset: 31,
                  excerpt: 'Test Entity',
                  entity: { __typename: 'Entity', id: 'e1', name: 'Test Entity', type: 'Org', mentionCount: 1 },
                },
              ],
            },
          ]}
          onEntityClick={onEntityClick}
        />
      </TestWrapper>
    );

    const mark = screen.getByText('Test Entity');
    expect(mark.tagName.toLowerCase()).toBe('mark');

    await user.click(mark);
    expect(onEntityClick).toHaveBeenCalledWith('e1');
  });

  it('shows a visible warning when offsets cannot be applied', () => {
    render(
      <TestWrapper>
        <DocumentTextWithMentions
          chunks={[
            {
              __typename: 'DocumentChunk',
              id: 'c1',
              chunkIndex: 0,
              content: 'short',
              mentions: [
                {
                  __typename: 'EntityMention',
                  id: 'm-bad',
                  entityId: 'e1',
                  startOffset: 0,
                  endOffset: 999,
                  excerpt: null,
                  entity: { __typename: 'Entity', id: 'e1', name: 'E1', type: 'Org', mentionCount: 1 },
                },
              ],
            },
          ]}
        />
      </TestWrapper>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/offsets could not be rendered/i);
    expect(screen.getByTestId('chunk-text-0')).toHaveTextContent('short');
  });
});

