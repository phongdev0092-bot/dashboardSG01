import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  FormLabel
} from '@mui/material';

// Isolated Add Schedule Row Modal (Local State Buffering)
export const AddLichTrucRowModal = React.memo(({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    mail: '', code: '', name: '', partner: '', block: '', month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });

  useEffect(() => {
    if (open) {
      setFormData({
        mail: '', code: '', name: '', partner: '', block: '', month: new Date().getMonth() + 1, year: new Date().getFullYear()
      });
    }
  }, [open]);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>➕ Thêm Dòng Lịch Trực Mới</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Mail *</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: PNC01.NHANHT6@fpt.com"
              value={formData.mail}
              onChange={(e) => handleChange('mail', e.target.value)}
            />
          </Box>

          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Mã Nhân Viên (CodeStaff)</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: 280558"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
            />
          </Box>

          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Họ và Tên (Name)</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: Cao Tiến Triều"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Box>

          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Đối Tác (Partner)</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: Phương Nam-01"
              value={formData.partner}
              onChange={(e) => handleChange('partner', e.target.value)}
            />
          </Box>

          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Block</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: Phuong Long Truong-002"
              value={formData.block}
              onChange={(e) => handleChange('block', e.target.value)}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Tháng</FormLabel>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={formData.month}
                onChange={(e) => handleChange('month', Number(e.target.value))}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Năm</FormLabel>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={formData.year}
                onChange={(e) => handleChange('year', Number(e.target.value))}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Hủy</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Thêm Dòng</Button>
      </DialogActions>
    </Dialog>
  );
});

export default AddLichTrucRowModal;
