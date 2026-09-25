import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button
} from '@mui/material';

export const UserDeleteModal = ({ open, onClose, userToDelete, onDelete }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#d93025' }}>⚠️ XÁC NHẬN XÓA TÀI KHOẢN</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2">
          Bạn có chắc chắn muốn xóa tài khoản <b>{userToDelete?.name}</b> ({userToDelete?.mail}) khỏi hệ thống?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Hủy</Button>
        <Button onClick={onDelete} variant="contained" color="error">Xóa Tài Khoản</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDeleteModal;
