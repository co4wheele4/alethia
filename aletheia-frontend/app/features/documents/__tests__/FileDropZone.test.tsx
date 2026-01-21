import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { FileDropZone } from '../components/FileDropZone';
import { ThemeProvider } from '../../../hooks/useTheme';
import { createRef } from 'react';
import { vi } from 'vitest';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('FileDropZone', () => {
  it('renders correctly', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={vi.fn()}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Drag & drop files here/i)).toBeInTheDocument();
  });

  it('handles click to trigger input', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={vi.fn()}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const spy = vi.spyOn(inputRef.current!, 'click');
    fireEvent.click(screen.getByLabelText('file-dropzone'));
    expect(spy).toHaveBeenCalled();
  });

  it('does not trigger input when disabled', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          disabled
          accept=".pdf"
          onAddFiles={vi.fn()}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const spy = vi.spyOn(inputRef.current!, 'click');
    fireEvent.click(screen.getByLabelText('file-dropzone'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('handles drag over', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={vi.fn()}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const dropzone = screen.getByLabelText('file-dropzone');
    const dragOverEvent = createEvent.dragOver(dropzone);
    vi.spyOn(dragOverEvent, 'preventDefault');
    vi.spyOn(dragOverEvent, 'stopPropagation');
    
    fireEvent(dropzone, dragOverEvent);
    
    expect(dragOverEvent.preventDefault).toHaveBeenCalled();
    expect(dragOverEvent.stopPropagation).toHaveBeenCalled();
  });

  it('handles drop', () => {
    const onAddFiles = vi.fn();
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={onAddFiles}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const dropzone = screen.getByLabelText('file-dropzone');
    const file = new File(['hello'], 'test.pdf', { type: 'application/pdf' });
    
    const dropEvent = createEvent.drop(dropzone);
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
      },
    });
    
    fireEvent(dropzone, dropEvent);

    expect(onAddFiles).toHaveBeenCalled();
  });

  it('handles drop when disabled', () => {
    const onAddFiles = vi.fn();
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          disabled
          accept=".pdf"
          onAddFiles={onAddFiles}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const dropzone = screen.getByLabelText('file-dropzone');
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [new File([], 'test.pdf')],
      },
    });

    expect(onAddFiles).not.toHaveBeenCalled();
  });

  it('handles drop with no files', () => {
    const onAddFiles = vi.fn();
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={onAddFiles}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const dropzone = screen.getByLabelText('file-dropzone');
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [],
      },
    });

    expect(onAddFiles).not.toHaveBeenCalled();
  });

  it('handles drop with null dataTransfer', () => {
    const onAddFiles = vi.fn();
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={onAddFiles}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const dropzone = screen.getByLabelText('file-dropzone');
    fireEvent.drop(dropzone, {
      dataTransfer: null,
    });

    expect(onAddFiles).not.toHaveBeenCalled();
  });

  it('handles Enter key to trigger input', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={vi.fn()}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const spy = vi.spyOn(inputRef.current!, 'click');
    fireEvent.keyDown(screen.getByLabelText('file-dropzone'), { key: 'Enter' });
    expect(spy).toHaveBeenCalled();
  });

  it('handles Space key to trigger input', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={vi.fn()}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const spy = vi.spyOn(inputRef.current!, 'click');
    fireEvent.keyDown(screen.getByLabelText('file-dropzone'), { key: ' ' });
    expect(spy).toHaveBeenCalled();
  });

  it('does not handle other keys', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={vi.fn()}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const spy = vi.spyOn(inputRef.current!, 'click');
    fireEvent.keyDown(screen.getByLabelText('file-dropzone'), { key: 'a' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('handles key down when disabled', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <TestWrapper>
        <FileDropZone
          disabled
          accept=".pdf"
          onAddFiles={vi.fn()}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const spy = vi.spyOn(inputRef.current!, 'click');
    fireEvent.keyDown(screen.getByLabelText('file-dropzone'), { key: 'Enter' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('handles input change', () => {
    const onAddFiles = vi.fn();
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={onAddFiles}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input[type="file"]')!;
    const file = new File(['hello'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(onAddFiles).toHaveBeenCalled();
  });

  it('handles input change with no files', () => {
    const onAddFiles = vi.fn();
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(
      <TestWrapper>
        <FileDropZone
          accept=".pdf"
          onAddFiles={onAddFiles}
          inputRef={inputRef}
        />
      </TestWrapper>
    );

    const input = container.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: {
        files: null,
      },
    });

    expect(onAddFiles).not.toHaveBeenCalled();
  });
});
