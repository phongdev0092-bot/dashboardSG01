import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const PositionModal = ({ open, onClose, hrList = [] }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 900, color: '#1e40af', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        👔 THỐNG KÊ CHỨC DANH NHÂN SỰ (CỘT O)
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontWeight: 600 }}>
          Tổng số <b>{hrList.length}</b> nhân sự phân loại theo Chức Danh / Vị Trí (Cột O):
        </Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#eff6ff' }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#1e40af', width: 60 }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#1e40af' }}>Tên Chức Danh / Vị Trí (Cột O)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#1e40af' }}>Số Lượng</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#1e40af' }}>Tỷ Lệ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const counts = {};
                hrList.forEach(r => {
                  const title = (r.title || 'Chưa phân loại').trim();
                  if (title) counts[title] = (counts[title] || 0) + 1;
                });
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                const total = hrList.length || 1;
                
                return sorted.map(([pos, cnt], idx) => {
                  const pct = ((cnt / total) * 100).toFixed(1);
                  return (
                    <TableRow key={pos} hover>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{pos}</TableCell>
                      <TableCell align="right">
                        <Chip label={cnt} size="small" sx={{ fontWeight: 900, backgroundColor: '#dbeafe', color: '#1e40af', height: 22 }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#2563eb' }}>
                        {pct}%
                      </TableCell>
                    </TableRow>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PositionModal;
