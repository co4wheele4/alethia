/**
 * Tests for DataShapeInspector component
 */

import { render, screen } from '@testing-library/react';
import { DataShapeInspector } from '../../../components/dev/DataShapeInspector';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('DataShapeInspector', () => {
  it('should render component', () => {
    render(
      <TestWrapper>
        <DataShapeInspector data={{ test: 'value' }} />
      </TestWrapper>
    );

    expect(screen.getByText(/data shape inspector/i)).toBeInTheDocument();
  });

  it('should handle null data', () => {
    render(
      <TestWrapper>
        <DataShapeInspector data={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/data shape inspector/i)).toBeInTheDocument();
  });

  it('should handle undefined data', () => {
    render(
      <TestWrapper>
        <DataShapeInspector data={undefined} />
      </TestWrapper>
    );

    expect(screen.getByText(/data shape inspector/i)).toBeInTheDocument();
  });

  it('should display shape when provided', () => {
    const shape = { name: 'string', age: 'number' };
    render(
      <TestWrapper>
        <DataShapeInspector data={{ name: 'John', age: 30 }} shape={shape} />
      </TestWrapper>
    );

    // Should display expected shape (line 24-30)
    expect(screen.getByText(/expected shape/i)).toBeInTheDocument();
    expect(screen.getByText(/"name":\s*"string"/i)).toBeInTheDocument();
    expect(screen.getByText(/"age":\s*"number"/i)).toBeInTheDocument();
  });

  it('should display string data directly when data is a string', () => {
    const stringData = 'This is a string';
    render(
      <TestWrapper>
        <DataShapeInspector data={stringData} />
      </TestWrapper>
    );

    // Should display string data directly (line 38: typeof data === 'string' ? data : ...)
    expect(screen.getByText(/actual data/i)).toBeInTheDocument();
    expect(screen.getByText(stringData)).toBeInTheDocument();
  });

  it('should stringify non-string data', () => {
    const objectData = { name: 'John', age: 30 };
    render(
      <TestWrapper>
        <DataShapeInspector data={objectData} />
      </TestWrapper>
    );

    // Should stringify object data (line 38: typeof data === 'string' ? ... : JSON.stringify(data, null, 2))
    expect(screen.getByText(/actual data/i)).toBeInTheDocument();
    expect(screen.getByText(/"name":\s*"John"/i)).toBeInTheDocument();
    expect(screen.getByText(/"age":\s*30/i)).toBeInTheDocument();
  });

  it('should handle array data', () => {
    const arrayData = [1, 2, 3];
    render(
      <TestWrapper>
        <DataShapeInspector data={arrayData} />
      </TestWrapper>
    );

    // Should stringify array data
    expect(screen.getByText(/actual data/i)).toBeInTheDocument();
    expect(screen.getByText(/\[/)).toBeInTheDocument();
  });

  it('should handle number data', () => {
    const numberData = 42;
    render(
      <TestWrapper>
        <DataShapeInspector data={numberData} />
      </TestWrapper>
    );

    // Should stringify number data
    expect(screen.getByText(/actual data/i)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should handle boolean data', () => {
    const booleanData = true;
    render(
      <TestWrapper>
        <DataShapeInspector data={booleanData} />
      </TestWrapper>
    );

    // Should stringify boolean data
    expect(screen.getByText(/actual data/i)).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });
});
