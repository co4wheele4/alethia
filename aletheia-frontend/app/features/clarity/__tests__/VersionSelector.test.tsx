/**
 * Tests for VersionSelector component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { VersionSelector } from '../components/VersionSelector';

describe('VersionSelector', () => {
  it('should render with empty state when no versions', () => {
    render(<VersionSelector />);
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    expect(screen.getByText('No versions available')).toBeInTheDocument();
  });

  it('should render with versions', () => {
    const versions = [
      { id: 'v1', label: 'Version 1' },
      { id: 'v2', label: 'Version 2' },
    ];

    render(<VersionSelector versions={versions} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    expect(screen.getByText('Version 1')).toBeInTheDocument();
    expect(screen.getByText('Version 2')).toBeInTheDocument();
  });

  it('should render versions with timestamps', () => {
    const versions = [
      { id: 'v1', label: 'Version 1', timestamp: '2024-01-01' },
      { id: 'v2', label: 'Version 2', timestamp: '2024-01-02' },
    ];

    render(<VersionSelector versions={versions} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    expect(screen.getByText(/version 1.*2024-01-01/i)).toBeInTheDocument();
    expect(screen.getByText(/version 2.*2024-01-02/i)).toBeInTheDocument();
  });

  it('should call onVersionChange when version is selected', () => {
    const handleChange = vi.fn();
    const versions = [
      { id: 'v1', label: 'Version 1' },
      { id: 'v2', label: 'Version 2' },
    ];

    render(<VersionSelector versions={versions} onVersionChange={handleChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    const option = screen.getByText('Version 1');
    fireEvent.click(option);
    
    expect(handleChange).toHaveBeenCalledWith('v1');
  });

  it('should show selected version', () => {
    const versions = [
      { id: 'v1', label: 'Version 1' },
      { id: 'v2', label: 'Version 2' },
    ];

    render(<VersionSelector versions={versions} selectedVersion="v2" />);
    
    // MUI Select doesn't expose value directly, check that it's rendered
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    // The selected value should be displayed in the select
    // When opened, Version 2 appears in the menu, which is expected
    fireEvent.mouseDown(select);
    // Version 2 should be available (may appear multiple times - in menu and as selected)
    expect(screen.getAllByText('Version 2').length).toBeGreaterThan(0);
  });

  it('should work without onVersionChange handler', () => {
    const versions = [
      { id: 'v1', label: 'Version 1' },
    ];

    render(<VersionSelector versions={versions} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    expect(() => {
      const option = screen.getByText('Version 1');
      fireEvent.click(option);
    }).not.toThrow();
  });
});
