import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';

// Isolated Admin User Edit / Add Modal (Local State Buffering)
export const UserEditModal = React.memo(({
  open,
  onClose,
  initialData,
  isEditMode,
  onSave
}) => {
  const [formData, setFormData] = useState({
    msnv: '', name: '', mail: '', user: '', password: '', role: 'user', status: 'Active', allowed_apps: []
  });

  useEffect(() => {
    if (open) {
      setFormData(initialData || {
        msnv: '', name: '', mail: '', user: '', password: '', role: 'user', status: 'Active', allowed_apps: []
      });
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#1a73e8' }}>
        {isEditMode ? '✏️ SỬA TÀI KHOẢN NGƯỜI DÙNG & PHÂN QUYỀN' : '➕ THÊM USER MỚI (QUẢN TRỊ USER)'}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="MSNV" value={formData.msnv || ''} onChange={(e) => handleChange('msnv', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Họ và Tên" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Email" value={formData.mail || ''} onChange={(e) => handleChange('mail', e.target.value)} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="User (Mật danh)" value={formData.user || ''} onChange={(e) => handleChange('user', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="password" label={isEditMode ? "Mật khẩu mới (Tùy chọn)" : "Mật khẩu"} value={formData.password || ''} onChange={(e) => handleChange('password', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Quyền Mặc Định" value={formData.role || 'user'} onChange={(e) => handleChange('role', e.target.value)}>
                <MenuItem value="user">User (Người dùng thường)</MenuItem>
                <MenuItem value="admin">Admin (Quản trị viên)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Trạng Thái Tài Khoản" value={formData.status || 'Active'} onChange={(e) => handleChange('status', e.target.value)}>
                <MenuItem value="Active">Active (Hoạt động)</MenuItem>
                <MenuItem value="Inactive">Inactive (Khóa / Không hoạt động)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
            🔒 Phân Quyền Ứng Dụng Được Xem (RBAC Phân Quyền):
          </Typography>

          <Grid container spacing={1}>
            {[
              { key: 'Salary', label: '💵 Salary (Quản Lý Lương)' },
              { key: 'HR', label: '👥 HR (HR Nhân Sự)' },
              { key: 'KPIs', label: '📊 KPIs (Dashboard KPIs)' },
              { key: 'LichTruc', label: '📋 LichTruc (Lịch Trực)' },
              { key: 'TonTKBT', label: '📦 TonTKBT (Tồn TK-BT)' },
              { key: 'UserMgmt', label: '🔑 UserMgmt (Quản Trị User)' },
              { key: 'ImportDB', label: '📦 ImportDB (Import Data)' },
              { key: 'Admin', label: '⚙️ Admin (Trang Admin)' }
            ].map((item) => {
              const appsList = Array.isArray(formData.allowed_apps)
                ? formData.allowed_apps.map(x => String(x).trim().toLowerCase())
                : (typeof formData.allowed_apps === 'string' ? formData.allowed_apps.toLowerCase().split(/[;,]/) : []);
              const isChecked = appsList.includes(item.key.toLowerCase());

              return (
                <Grid item xs={12} sm={6} key={item.key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          let newApps = Array.isArray(formData.allowed_apps) ? [...formData.allowed_apps] : [];
                          if (checked) {
                            if (!newApps.some(a => a.toLowerCase() === item.key.toLowerCase())) {
                              newApps.push(item.key);
                            }
                          } else {
                            newApps = newApps.filter(a => a.toLowerCase() !== item.key.toLowerCase());
                          }
                          setFormData(prev => ({ ...prev, allowed_apps: newApps }));
                        }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Hủy</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Lưu Phân Quyền</Button>
      </DialogActions>
    </Dialog>
  );
});

export default UserEditModal;
