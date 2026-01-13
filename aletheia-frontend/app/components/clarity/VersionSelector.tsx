/**
 * VersionSelector Component
 * Version switching without page reload
 */

'use client';

import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

export interface Version {
  id: string;
  label: string;
  timestamp?: string;
}

export interface VersionSelectorProps {
  // TODO: Define props
  versions?: Version[];
  selectedVersion?: string;
  onVersionChange?: (versionId: string) => void;
}

export function VersionSelector(props: VersionSelectorProps) {
  const { versions = [], selectedVersion, onVersionChange } = props;

  return (
    <FormControl fullWidth size="small">
      <InputLabel>Version</InputLabel>
      <Select
        value={selectedVersion || ''}
        onChange={(e) => onVersionChange?.(e.target.value)}
        label="Version"
      >
        {/* TODO: Implement version selector */}
        {versions.length === 0 && (
          <MenuItem value="" disabled>
            No versions available
          </MenuItem>
        )}
        {versions.map((version) => (
          <MenuItem key={version.id} value={version.id}>
            {version.label} {version.timestamp && `(${version.timestamp})`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
