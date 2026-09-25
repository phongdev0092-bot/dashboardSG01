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

export const DetailModal = ({ open, onClose, summary }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124' }}>
          CHI TIẾT KHỐI LƯỢNG TỪNG LOẠI GIAO DỊCH (SG01)
        </Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#202124', mb: 1.5 }}>
          Danh Sách Phân Loại Từng Giao Dịch:
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tên / Phân Loại Giao Dịch</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Số Lượng</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Tỷ Lệ / Đánh Giá</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary?.all_tx_type_counts && Object.keys(summary.all_tx_type_counts).length > 0 ? (
                Object.entries(summary.all_tx_type_counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count], idx) => {
                    const totalAll = Object.values(summary.all_tx_type_counts).reduce((a, b) => a + b, 0);
                    const pct = totalAll > 0 ? ((count / totalAll) * 100).toFixed(1) : 0;
                    const isSwap = type.toLowerCase().includes('swap');

                    return (
                      <TableRow key={type} hover>
                        <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#202124' }}>
                          {type}
                          {isSwap && <Chip label="Swap" size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: '10px' }} />}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          {count}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${pct}%`} size="small" sx={{ backgroundColor: '#e8f0fe', color: '#1a73e8', fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#5f6368' }}>
                    Không tìm thấy dữ liệu giao dịch trong khoảng thời gian đang lọc.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ borderRadius: '18px', textTransform: 'none', px: 3 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailModal;
