import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const BtDetailModal = ({ open, onClose, summary }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124' }}>
          CHI TIẾT KHỐI LƯỢNG TỪNG LOẠI PHIẾU BẢO TRÌ (SG01)
        </Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#202124', mb: 1.5 }}>
          Danh Sách Phân Loại Tình Trạng Lên Phiếu Bảo Trì:
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 60 }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tình Trạng Lên Phiếu Bảo Trì</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Số Lượng</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Tỷ Lệ / Đánh Giá</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary?.all_bt_type_counts && Object.keys(summary.all_bt_type_counts).length > 0 ? (
                Object.entries(summary.all_bt_type_counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count], idx) => {
                    const totalAll = Object.values(summary.all_bt_type_counts).reduce((a, b) => a + b, 0);
                    const pct = totalAll > 0 ? ((count / totalAll) * 100).toFixed(1) : 0;

                    return (
                      <TableRow key={type} hover>
                        <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>
                          {type || '(Trống / Không xác định)'}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#00897b' }}>
                          {count}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${pct}%`} size="small" sx={{ backgroundColor: '#e0f2f1', color: '#00897b', fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#5f6368' }}>
                    Không tìm thấy dữ liệu phiếu bảo trì trong khoảng thời gian đang lọc.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ backgroundColor: '#00897b', '&:hover': { backgroundColor: '#00695c' }, borderRadius: '18px', textTransform: 'none', px: 3 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BtDetailModal;
