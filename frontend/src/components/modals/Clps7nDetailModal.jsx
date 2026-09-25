import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  Chip,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const Clps7nDetailModal = ({ open, onClose, summary }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#7b1fa2' }}>
          CHI TIẾT DANH SÁCH CLPS 7N BT (SG01)
        </Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#202124' }}>
            Tỉ Lệ CLPS 7N BT Toàn Đơn Vị: <span style={{ color: summary?.clps7n_status === 'PASS' ? '#2e7d32' : '#d32f2f' }}>{summary?.clps7n_pct || 0}%</span> (Tiêu chuẩn: &le; 3%)
          </Typography>
          <Chip
            label={summary?.clps7n_status === 'PASS' ? "ĐẠT (<= 3%)" : "KHÔNG ĐẠT (> 3%)"}
            color={summary?.clps7n_status === 'PASS' ? 'success' : 'error'}
            sx={{ fontWeight: 800 }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: '#5f6368', mb: 2 }}>
          Phiếu CLPS 7N BT là ca lặp có TG Hoàn Tất (cột G) đến TG Tạo CLPS (cột AB) &le; 7 ngày. 
          Tổng số phiếu: <strong>{summary?.clps7n_count || 0} HĐ</strong> trên tổng <strong>{summary?.kh_cls_count || 0} HĐ KH Có Cls</strong>.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#4a148c' }, borderRadius: '18px', textTransform: 'none', px: 3 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Clps7nDetailModal;
