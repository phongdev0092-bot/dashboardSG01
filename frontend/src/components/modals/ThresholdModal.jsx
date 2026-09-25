import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  FormLabel,
  TextField,
  Button
} from '@mui/material';

export const ThresholdModal = ({
  open,
  onClose,
  tempTiLeTrucMin,
  setTempTiLeTrucMin,
  tempTonPerNsMax,
  setTempTonPerNsMax,
  onSave
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>⚙️ Cấu Hình Ngưỡng Cảnh Báo Màu</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>
              Tỉ lệ Trực tối thiểu (%) — tô đỏ toàn dòng nếu THẤP HƠN
            </FormLabel>
            <TextField
              type="number"
              fullWidth
              size="small"
              value={tempTiLeTrucMin}
              onChange={(e) => setTempTiLeTrucMin(e.target.value)}
            />
          </Box>

          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>
              Tồn/NS tối đa — tô cam ô Tồn/NS nếu CAO HƠN
            </FormLabel>
            <TextField
              type="number"
              fullWidth
              size="small"
              value={tempTonPerNsMax}
              onChange={(e) => setTempTonPerNsMax(e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Hủy</Button>
        <Button onClick={onSave} variant="contained" color="primary">Lưu Ngưỡng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThresholdModal;
