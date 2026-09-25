import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Paper,
  Button
} from '@mui/material';

export const NoteDetailModal = ({ open, onClose, selectedNoteItem }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#1a73e8', borderBottom: '1px solid #e0e0e0' }}>
        📝 CHI TIẾT GHI CHÚ HỢP ĐỒNG — {selectedNoteItem?.soHd}
      </DialogTitle>
      <DialogContent dividers>
        {selectedNoteItem && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography variant="body2"><b>Số HĐ:</b> {selectedNoteItem.soHd}</Typography>
              <Typography variant="body2"><b>Khách Hàng:</b> {selectedNoteItem.tenKh}</Typography>
              <Typography variant="body2"><b>Phân Loại:</b> {selectedNoteItem.typeLabel} ({selectedNoteItem.loaiGd})</Typography>
              <Typography variant="body2"><b>Block:</b> {selectedNoteItem.block} (Đội trưởng: {selectedNoteItem.doiTruong})</Typography>
              <Typography variant="body2"><b>Nhân Viên (KTV):</b> {selectedNoteItem.nhanSu || '(Chưa phân công)'}</Typography>
              <Typography variant="body2"><b>TG Tạo / Tồn:</b> {selectedNoteItem.createdAt} ({selectedNoteItem.tonHrs} Giờ)</Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mt: 1 }}>
              Nội Dung Ghi Chú Chi Tiết:
            </Typography>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: '#fffbe6', border: '1px solid #ffe58f', minHeight: 100 }}>
              {selectedNoteItem.hasNote ? (
                <Typography variant="body2" sx={{ whitespace: 'pre-wrap', color: '#78350f', fontFamily: 'monospace' }}>
                  {selectedNoteItem.noteContent}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: '#d97706', fontStyle: 'italic' }}>
                  ⚠️ Chưa có nội dung ghi chú được nhập cho phiếu tồn này.
                </Typography>
              )}
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NoteDetailModal;
