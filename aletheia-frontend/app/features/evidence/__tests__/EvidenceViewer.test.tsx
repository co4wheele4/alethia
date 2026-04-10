import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EvidenceViewer } from '../components/EvidenceViewer';

describe('EvidenceViewer', () => {
  it('renders verbatim content and forbids semantic UI wording in labels', () => {
    const content = 'Line 1\n  spaced\n';
    render(
      <EvidenceViewer
        content={content}
        sourceUrl="https://example.com/x"
        contentSha256="abc"
        sourceTypeLabel="DOCUMENT"
        createdAtLabel="2020-01-01T00:00:00.000Z"
        pageSize={4}
      />,
    );

    const pre = screen.getByTestId('evidence-viewer-content');
    expect(pre.textContent).toBe(content);

    const body = screen.getByTestId('evidence-viewer').textContent ?? '';
    expect(body.toLowerCase()).not.toMatch(/summary|highlight|key points/);
  });

  it('paged mode shows mechanical chunks without dropping bytes', async () => {
    const user = userEvent.setup();
    const content = 'abcdefghij';
    render(
      <EvidenceViewer
        content={content}
        sourceTypeLabel="URL"
        createdAtLabel="2020-01-01T00:00:00.000Z"
        pageSize={4}
      />,
    );

    await user.click(screen.getByRole('button', { name: /view: paged/i }));
    expect(screen.getByTestId('evidence-viewer-content').textContent).toBe('abcd');
    await user.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByTestId('evidence-viewer-content').textContent).toBe('efgh');
    await user.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByTestId('evidence-viewer-content').textContent).toBe('ij');
  });

  it('renders URL snippet HTML verbatim without semantic labels', () => {
    const html = '<html><body>hi</body></html>';
    render(
      <EvidenceViewer
        content={html}
        sourceTypeLabel="URL"
        createdAtLabel="2020-01-01T00:00:00.000Z"
      />,
    );
    expect(screen.getByTestId('evidence-viewer-content').textContent).toBe(html);
    const viewer = screen.getByTestId('evidence-viewer').textContent ?? '';
    expect(viewer.toLowerCase()).not.toMatch(/summary|highlight|relevant|recommended/);
  });

  it('copy puts full content on clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(
      <EvidenceViewer
        content="copy-me"
        sourceTypeLabel="DOCUMENT"
        createdAtLabel="2020-01-01T00:00:00.000Z"
      />,
    );

    await user.click(screen.getByRole('button', { name: /copy raw content/i }));
    expect(writeText).toHaveBeenCalledWith('copy-me');
  });
});
