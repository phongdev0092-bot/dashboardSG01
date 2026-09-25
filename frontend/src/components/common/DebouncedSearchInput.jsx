import React, { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

// Debounced Search Input for instantaneous typing without App re-render lag
export const DebouncedSearchInput = React.memo(({ value, onChange, delay = 200, ...props }) => {
  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localVal !== value) {
        onChange(localVal);
      }
    }, delay);
    return () => clearTimeout(handler);
  }, [localVal, delay, onChange, value]);

  return (
    <TextField
      {...props}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
    />
  );
});

export default DebouncedSearchInput;
