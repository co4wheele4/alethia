/**
 * SemanticSearchBox Component
 * Search input with semantic capabilities
 */

'use client';

import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export interface SemanticSearchBoxProps {
  // TODO: Define props
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SemanticSearchBox(props: SemanticSearchBoxProps) {
  const { value = '', onChange, onSearch, placeholder = 'Search...' } = props;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyPress={handleKeyPress}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      variant="outlined"
    />
  );
}
