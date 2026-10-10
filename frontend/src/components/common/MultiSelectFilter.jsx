import React, { useState, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Popover,
  Checkbox,
  TextField,
  Button,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  SelectAll as SelectAllIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';

/**
 * MultiSelectFilter
 * Component bộ lọc đa chọn hiện đại, chuẩn chỉnh cho Dashboard KPI:
 * - Hỗ trợ chọn nhiều hoặc 1 mục với Checkbox
 * - Bấm vào 1 lần để bỏ tích và quay lại mặc định là "Tất cả"
 * - Nút (X) xoá nhanh ngay trên ô input mà không cần mở dropdown
 * - Tìm kiếm nhanh theo từ khoá
 * - Style đồng đều, cân đối, bo góc hiện đại, không bị xô lệch
 */
export default function MultiSelectFilter({
  label,
  icon,
  options = [],
  value = [],
  onChange,
  placeholder = '-- Tất cả --',
  unit = 'mục',
  disabled = false,
  singleSelect = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const open = Boolean(anchorEl);

  // Chuẩn hoá value thành array
  const selectedValues = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  // Lọc options theo tìm kiếm
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter((opt) => String(opt).toLowerCase().includes(term));
  }, [options, searchTerm]);

  const handleOpen = (e) => {
    if (disabled) return;
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm('');
  };

  // Xoá tất cả về mặc định (Tất cả)
  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    onChange(singleSelect ? '' : []);
  };

  // Toggle 1 item
  const handleToggleItem = (item) => {
    if (singleSelect) {
      if (selectedValues.includes(item)) {
        // Bấm lại mục đang chọn thì bỏ chọn và về mặc định là Tất cả
        onChange('');
      } else {
        onChange(item);
      }
      handleClose();
      return;
    }

    // Multi-select
    if (selectedValues.includes(item)) {
      // Bỏ tích mục này
      const next = selectedValues.filter((v) => v !== item);
      onChange(next);
    } else {
      // Thêm mục này
      const next = [...selectedValues, item];
      onChange(next);
    }
  };

  // Chọn tất cả các mục đang hiển thị
  const handleSelectAllVisible = () => {
    if (singleSelect) return;
    const set = new Set([...selectedValues, ...filteredOptions]);
    onChange(Array.from(set));
  };

  const isAllDefault = selectedValues.length === 0;

  return (
    <Box sx={{ width: '100%', minWidth: 0, position: 'relative' }}>
      {/* Label phía trên */}
      {label && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6 }}>
          {icon && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#1a73e8' }}>
              {icon}
            </Box>
          )}
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#374151',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </Typography>
        </Box>
      )}

      {/* Trigger Box Input */}
      <Box
        onClick={handleOpen}
        sx={{
          height: 40,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          borderRadius: '10px',
          border: selectedValues.length > 0 ? '1.5px solid #1a73e8' : '1px solid #d1d5db',
          backgroundColor: selectedValues.length > 0 ? '#f0f7ff' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s ease-in-out',
          boxSizing: 'border-box',
          '&:hover': {
            borderColor: '#1a73e8',
            backgroundColor: selectedValues.length > 0 ? '#e8f0fe' : '#f8fafc',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          },
        }}
      >
        {/* Nội dung hiển thị */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, overflow: 'hidden', flex: 1, mr: 0.5 }}>
          {isAllDefault ? (
            <Typography
              sx={{
                fontSize: '13px',
                color: '#64748b',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {placeholder}
            </Typography>
          ) : selectedValues.length === 1 ? (
            <Chip
              size="small"
              label={selectedValues[0]}
              onDelete={handleClearAll}
              deleteIcon={<ClearIcon sx={{ fontSize: '14px !important' }} />}
              sx={{
                maxWidth: '100%',
                fontWeight: 700,
                fontSize: '12px',
                height: 26,
                borderRadius: '8px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                '& .MuiChip-deleteIcon': { color: '#3b82f6', '&:hover': { color: '#ef4444' } },
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Chip
                size="small"
                label={`${selectedValues.length} ${unit} đã chọn`}
                color="primary"
                sx={{
                  fontWeight: 700,
                  fontSize: '11.5px',
                  height: 24,
                  borderRadius: '8px',
                }}
              />
            </Box>
          )}
        </Box>

        {/* Nút hành động phải: Xoá nhanh (X) và Mũi tên */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, flexShrink: 0 }}>
          {selectedValues.length > 0 && (
            <IconButton
              size="small"
              onClick={handleClearAll}
              title="Xoá chọn (Về Tất cả)"
              sx={{
                p: 0.4,
                color: '#64748b',
                borderRadius: '6px',
                '&:hover': {
                  color: '#ef4444',
                  backgroundColor: '#fee2e2',
                },
              }}
            >
              <ClearIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          <ArrowDownIcon
            sx={{
              fontSize: 18,
              color: '#64748b',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </Box>
      </Box>

      {/* Popover Menu Dropdown */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 0.8,
            width: Math.max(anchorEl?.clientWidth || 280, 280),
            maxWidth: 420,
            maxHeight: 460,
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header thông tin */}
        <Box
          sx={{
            p: 1.5,
            pb: 1,
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
            {label || 'Tuỳ chọn'}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            {selectedValues.length > 0
              ? `Đã chọn: ${selectedValues.length}/${options.length}`
              : `Tất cả (${options.length})`}
          </Typography>
        </Box>

        {/* Ô tìm kiếm nhanh (khi có nhiều hơn 5 options) */}
        {options.length > 5 && (
          <Box sx={{ p: 1, borderBottom: '1px solid #f1f5f9' }}>
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="🔍 Tìm nhanh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.2 }}>
                      <ClearIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '12.5px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                },
              }}
            />
          </Box>
        )}

        {/* Thanh thao tác nhanh: Tất cả / Chọn tất cả / Bỏ chọn */}
        <Box
          sx={{
            px: 1.5,
            py: 0.8,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Tuỳ chọn "-- Tất cả (Mặc định) --" */}
          <Box
            onClick={handleClearAll}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              cursor: 'pointer',
              py: 0.3,
              px: 0.8,
              borderRadius: '6px',
              backgroundColor: isAllDefault ? '#eff6ff' : 'transparent',
              '&:hover': { backgroundColor: '#f1f5f9' },
            }}
          >
            <Checkbox
              size="small"
              checked={isAllDefault}
              sx={{ p: 0, color: '#94a3b8', '&.Mui-checked': { color: '#1a73e8' }, pointerEvents: 'none' }}
            />
            <Typography
              sx={{
                fontSize: '12.5px',
                fontWeight: isAllDefault ? 800 : 600,
                color: isAllDefault ? '#1a73e8' : '#475569',
              }}
            >
              -- Tất cả (Mặc định) --
            </Typography>
          </Box>

          {!singleSelect && options.length > 1 && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                size="small"
                onClick={handleSelectAllVisible}
                sx={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'none',
                  p: '2px 6px',
                  minWidth: 0,
                  color: '#1a73e8',
                }}
              >
                Chọn hết
              </Button>
              {selectedValues.length > 0 && (
                <Button
                  size="small"
                  onClick={handleClearAll}
                  sx={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'none',
                    p: '2px 6px',
                    minWidth: 0,
                    color: '#ef4444',
                  }}
                >
                  Bỏ chọn
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Danh sách các Options cuộn */}
        <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 280, p: 0.5 }}>
          {filteredOptions.length === 0 ? (
            <Box sx={{ p: 2.5, textAlign: 'center', color: '#94a3b8' }}>
              <Typography sx={{ fontSize: '12.5px' }}>Không tìm thấy kết quả phù hợp</Typography>
            </Box>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selectedValues.includes(opt);
              return (
                <Box
                  key={opt}
                  onClick={() => handleToggleItem(opt)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.2,
                    py: 0.8,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f0f7ff' : 'transparent',
                    transition: 'background-color 0.1s',
                    '&:hover': {
                      backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                    },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    sx={{
                      p: 0,
                      color: '#cbd5e1',
                      '&.Mui-checked': { color: '#1a73e8' },
                      pointerEvents: 'none', // Tránh click riêng rẽ vào checkbox gây lệch event
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '12.5px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#1e40af' : '#1e293b',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {opt}
                  </Typography>
                  {isSelected && (
                    <CheckIcon sx={{ fontSize: 16, color: '#1a73e8', flexShrink: 0 }} />
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {/* Footer đóng */}
        <Box
          sx={{
            p: 1,
            px: 1.5,
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography sx={{ fontSize: '11.5px', color: '#64748b' }}>
            {selectedValues.length === 0
              ? 'Đang xem tất cả'
              : `Đang chọn ${selectedValues.length} ${unit}`}
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={handleClose}
            sx={{
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'none',
              px: 2,
              py: 0.3,
            }}
          >
            Áp dụng
          </Button>
        </Box>
      </Popover>
    </Box>
  );
}
