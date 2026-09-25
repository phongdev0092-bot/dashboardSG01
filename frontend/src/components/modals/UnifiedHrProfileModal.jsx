import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Grid,
  Chip,
  Paper,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import SearchableAddableSelect from '../common/SearchableAddableSelect';

// Isolated Unified HR Profile Modal (Local State Buffering)
export const UnifiedHrProfileModal = React.memo(({
  open,
  onClose,
  initialData,
  isNew,
  loading,
  options,
  hrList,
  onSave
}) => {
  const [formData, setFormData] = useState({});
  const [searchKw, setSearchKw] = useState('');

  useEffect(() => {
    if (open) {
      setFormData(initialData || {});
      setSearchKw('');
    }
  }, [open, initialData]);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', position: 'relative' }}>
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>

          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              position: 'absolute',
              top: 14,
              right: 54,
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2,
              px: 2.5,
              '&:hover': { backgroundColor: '#15803d' }
            }}
          >
            💾 Lưu Hồ Sơ HR
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
              <PeopleIcon sx={{ fontSize: 36 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
                {isNew ? '➕ Thêm Mới Hồ Sơ Nhân Sự HR' : (formData?.['Họ Tên NV'] || formData?.['Mã NV'] || 'Hồ Sơ Nhân Sự')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip label={`Mã NV: ${formData?.['Mã NV'] || '-'}`} size="small" sx={{ backgroundColor: '#334155', color: '#f8fafc', fontWeight: 800 }} />
                <Chip label={`Inside: ${formData?.['Inside Account'] || '-'}`} size="small" sx={{ backgroundColor: '#312e81', color: '#c7d2fe', fontWeight: 800 }} />
                <Chip label={`Mobisale: ${formData?.['Mobisale'] || '-'}`} size="small" sx={{ backgroundColor: '#1e3a8a', color: '#bfdbfe', fontWeight: 800 }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <TextField
              fullWidth
              size="small"
              placeholder="🔍 Lọc các trường trong hồ sơ để tìm & chỉnh sửa nhanh..."
              value={searchKw}
              onChange={(e) => setSearchKw(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} /> }}
              sx={{ '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
            />

            {/* SECTION 1: PERSONAL & CONTACT */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#2563eb', mb: 2 }}>
                👤 1. Thông Tin Cá Nhân & Tài Khoản Liên Hệ
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Mã Nhân Viên (Code) *"
                    value={formData['Mã NV'] || ''}
                    disabled={!isNew}
                    onChange={(e) => handleChange('Mã NV', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Họ và Tên NV *"
                    value={formData['Họ Tên NV'] || ''}
                    onChange={(e) => handleChange('Họ Tên NV', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Inside Account"
                    value={formData['Inside Account'] || ''}
                    onChange={(e) => handleChange('Inside Account', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Mobisale Account"
                    value={formData['Mobisale'] || ''}
                    onChange={(e) => handleChange('Mobisale', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Email Công Việc"
                    value={formData['Email'] || ''}
                    onChange={(e) => handleChange('Email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Số Điện Thoại"
                    value={formData['Số điện thoại'] || ''}
                    onChange={(e) => handleChange('Số điện thoại', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Tình Trạng Tài Khoản"
                    value={formData['Tình trạng Tài khoản'] || 'Active'}
                    options={['Active', 'Inactive', 'Bình thường', 'Khóa']}
                    onChange={(val) => handleChange('Tình trạng Tài khoản', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Số CMND/CCCD"
                    value={formData['Số CMND'] || ''}
                    onChange={(e) => handleChange('Số CMND', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Ngày Cấp CMND"
                    value={formData['Ngày cấp'] || ''}
                    onChange={(e) => handleChange('Ngày cấp', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SECTION 2: WORKPLACE & BLOCK */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#7c3aed', mb: 2 }}>
                🏢 2. Đơn Vị & Block Công Tác
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Block Kỹ Thuật"
                    value={formData['Block'] || ''}
                    options={options?.blocks || []}
                    onChange={(val) => handleChange('Block', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Họ tên Đội Trưởng"
                    value={formData['Họ tên Đội trưởng'] || ''}
                    options={options?.team_leads || []}
                    onChange={(val) => handleChange('Họ tên Đội trưởng', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Chức Danh / Vị Trí"
                    value={formData['Chức danh'] || ''}
                    options={Array.from(new Set((hrList || []).map(r => r.title).filter(Boolean)))}
                    onChange={(val) => handleChange('Chức danh', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Tên Đối Tác"
                    value={formData['Tên Đối Tác'] || ''}
                    options={options?.partners || []}
                    onChange={(val) => handleChange('Tên Đối Tác', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Vùng Phụ Trách"
                    value={formData['Vùng'] || ''}
                    options={options?.regions || []}
                    onChange={(val) => handleChange('Vùng', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Chi Nhánh"
                    value={formData['Chi nhánh'] || ''}
                    onChange={(e) => handleChange('Chi nhánh', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SECTION 3: CONTRACT & SALARY ASSIGNMENT */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#059669', mb: 2 }}>
                📜 3. Hợp Đồng & Phân Công Tính Lương
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Tình Trạng Hợp Đồng (Cột M)"
                    value={formData['Tình trạng Hợp đồng'] || 'NS Đang làm việc'}
                    options={['NS Đang làm việc', 'NS đã thôi việc', 'Thử việc', 'Chính thức', 'Active', 'Inactive']}
                    onChange={(val) => handleChange('Tình trạng Hợp đồng', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Loại HĐLĐ"
                    value={formData['Loại HĐLĐ'] || ''}
                    options={['HĐLĐ Xác định thời hạn', 'HĐLĐ Không xác định thời hạn', 'Hợp đồng khoán', 'Thử việc']}
                    onChange={(val) => handleChange('Loại HĐLĐ', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Ngày Vào Công Ty"
                    value={formData['Ngày vào công ty'] || ''}
                    onChange={(e) => handleChange('Ngày vào công ty', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Phân Công Tính Lương"
                    value={formData['Phân công'] || ''}
                    onChange={(e) => handleChange('Phân công', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Hình Thức Tính Lương"
                    value={formData['Tính lương'] || ''}
                    onChange={(e) => handleChange('Tính lương', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SECTION 4: REMAINING DYNAMIC COLUMNS (NO HIDDEN DATA) */}
            {(() => {
              const usedKeys = [
                'Mã NV', 'Họ Tên NV', 'Inside Account', 'Mobisale', 'Email', 'Số điện thoại', 'Tình trạng Tài khoản', 'Số CMND', 'Ngày cấp', 'Block', 'Họ tên Đội trưởng', 'Chức danh', 'Tên Đối Tác', 'Vùng', 'Chi nhánh', 'Tình trạng Hợp đồng', 'Loại HĐLĐ', 'Ngày vào công ty', 'Phân công', 'Tính lương'
              ];
              const remainingEntries = Object.entries(formData).filter(([k, v]) => {
                const isUsed = usedKeys.some(uk => k.toLowerCase() === uk.toLowerCase());
                if (isUsed) return false;
                if (!searchKw) return true;
                const kw = searchKw.toLowerCase();
                return k.toLowerCase().includes(kw) || String(v).toLowerCase().includes(kw);
              });

              if (remainingEntries.length === 0) return null;

              return (
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#475569', mb: 2 }}>
                    📌 4. Tất Cả Cột Thông Tin Bổ Sung Khác
                  </Typography>
                  <Grid container spacing={2}>
                    {remainingEntries.map(([key, val]) => (
                      <Grid item xs={12} sm={6} md={4} key={key}>
                        <TextField
                          fullWidth
                          size="small"
                          label={key}
                          value={val || ''}
                          onChange={(e) => handleChange(key, e.target.value)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              );
            })()}

          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
          Hủy Bỏ
        </Button>
        <Button onClick={handleSave} variant="contained" color="success" startIcon={<SaveIcon />} sx={{ borderRadius: 2, px: 3, fontWeight: 800 }}>
          💾 Lưu Thay Đổi Hồ Sơ HR
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default UnifiedHrProfileModal;
