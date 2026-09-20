import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string | undefined;
  placeholder?: string | undefined;
  /** Spinner in the adornment. Debouncing is the caller's job — this only reflects it. */
  loading?: boolean | undefined;
  helperText?: string | undefined;
  error?: boolean | undefined;
  autoFocus?: boolean | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  fullWidth?: boolean | undefined;
}

/**
 * Controlled search input. Uncontrolled would fight the debounce: the value on screen and
 * the value driving the query change at different times, and only the caller knows both.
 */
export function SearchField({
  value,
  onChange,
  label = 'Search repositories',
  placeholder = 'e.g. facebook/react',
  loading,
  helperText,
  error,
  autoFocus,
  disabled,
  id = 'repo-search',
  fullWidth = true,
}: SearchFieldProps) {
  return (
    <TextField
      id={id}
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      label={label}
      placeholder={placeholder}
      helperText={helperText}
      error={error ?? false}
      autoFocus={autoFocus ?? false}
      disabled={disabled ?? false}
      fullWidth={fullWidth}
      autoComplete="off"
      // type="search" makes WebKit draw its own clear button next to ours.
      sx={{
        '& input[type="search"]::-webkit-search-cancel-button': { display: 'none' },
        '& input[type="search"]::-webkit-search-decoration': { display: 'none' },
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading ? <CircularProgress size={16} aria-label="Searching" /> : null}
              {value && !disabled ? (
                <IconButton
                  size="small"
                  aria-label="Clear search"
                  edge="end"
                  onClick={() => onChange('')}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
