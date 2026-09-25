import React, { useState, useMemo } from 'react';
import { Box, TextField, IconButton, Menu, MenuItem, Button } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Custom Dropdown Component with Quick Search & Add Option
export const SearchableAddableSelect = ({ label, value, options = [], onChange, onAddOption, placeholder = "Chọn hoặc thêm..." }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchKw, setSearchKw] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newVal, setNewVal] = useState('');
  const [extraOptions, setExtraOptions] = useState([]);

  const open = Boolean(anchorEl);

  const combinedOptions = useMemo(() => {
    const set = new Set([...(options || []), ...extraOptions]);
    if (value && !set.has(value)) set.add(value);
    return Array.from(set).filter(Boolean);
  }, [options, extraOptions, value]);

  const filtered = useMemo(() => {
    if (!searchKw.trim()) return combinedOptions;
    return combinedOptions.filter(opt => String(opt).toLowerCase().includes(searchKw.toLowerCase()));
  }, [combinedOptions, searchKw]);

  const handleAddSubmit = () => {
    const trimmed = newVal.trim();
    if (trimmed) {
      if (!extraOptions.includes(trimmed)) {
        setExtraOptions(prev => [...prev, trimmed]);
      }
      if (onAddOption) onAddOption(trimmed);
      onChange(trimmed);
      setNewVal('');
      setIsAdding(false);
      setAnchorEl(null);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        label={label}
        value={value || ''}
        placeholder={placeholder}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        InputProps={{
          readOnly: false,
          endAdornment: (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
              <ChevronRightIcon sx={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }} />
            </IconButton>
          )
        }}
        onChange={(e) => onChange(e.target.value)}
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => { setAnchorEl(null); setIsAdding(false); setSearchKw(''); }}
        PaperProps={{ sx: { width: anchorEl?.clientWidth || 280, maxHeight: 340, p: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', borderRadius: 2 } }}
      >
        <Box sx={{ p: 1, pb: 1, borderBottom: '1px solid #e2e8f0', mb: 1 }}>
          <TextField
            autoFocus
            size="small"
            fullWidth
            placeholder="🔍 Tìm kiếm nhanh..."
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            sx={{ '& .MuiInputBase-root': { fontSize: '13px', borderRadius: 1.5 } }}
          />
        </Box>

        {!isAdding ? (
          <MenuItem
            onClick={() => setIsAdding(true)}
            sx={{ fontWeight: 800, color: '#2563eb', backgroundColor: '#eff6ff', borderRadius: 1.5, mb: 1, fontSize: '13px' }}
          >
            ➕ Thêm giá trị mới vào danh sách...
          </MenuItem>
        ) : (
          <Box sx={{ p: 1, backgroundColor: '#f8fafc', borderRadius: 1.5, mb: 1, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Nhập giá trị mới..."
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubmit(); }}
            />
            <Button size="small" variant="contained" onClick={handleAddSubmit} sx={{ minWidth: 50, fontWeight: 800 }}>Lưu</Button>
          </Box>
        )}

        {filtered.length === 0 ? (
          <MenuItem disabled sx={{ fontSize: '13px', color: '#94a3b8' }}>
            Không có kết quả khớp
          </MenuItem>
        ) : (
          filtered.map((opt) => (
            <MenuItem
              key={opt}
              selected={opt === value}
              onClick={() => {
                onChange(opt);
                setAnchorEl(null);
                setSearchKw('');
              }}
              sx={{ fontSize: '13px', fontWeight: opt === value ? 800 : 500, borderRadius: 1 }}
            >
              {opt}
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
};

export default SearchableAddableSelect;
