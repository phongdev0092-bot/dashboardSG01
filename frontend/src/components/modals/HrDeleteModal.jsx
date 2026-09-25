import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button
} from '@mui/material';

export const HrDeleteModal = ({ open, onClose, hrToDelete, onDelete }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#dc2626' }}>⚠️ XÁC NHẬN XÓA NHÂN SỰ</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2">
          Bạn có chắc chắn muốn xóa nhân sự <b>{hrToDelete?.name}</b> (Mã NV: <b>{hrToDelete?.code}</b>) khỏi danh sách HR?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Hủy</Button>
        <Button onClick={onDelete} variant="contained" color="error">Xóa Nhân Sự</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HrDeleteModal;
