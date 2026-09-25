import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button
} from '@mui/material';

export const Over72hModal = ({
  open,
  onClose,
  countTK72h,
  filteredTkList = [],
  onSelectNote
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#d93025', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🚨 CHI TIẾT PHIẾU TỒN TRIỂN KHAI &gt;72H</span>
        <Chip label={`${countTK72h || 0} Ca vi phạm`} color="error" size="small" sx={{ fontWeight: 700 }} />
      </DialogTitle>
      <DialogContent dividers>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 800, width: 50 }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Số HĐ (SHD)</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tên Khách Hàng</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Loại Giao Dịch</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Thời Gian Tồn</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Đội Trưởng</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Nhân Viên (KTV)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Ghi Chú TIN/PNC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTkList
                ?.filter(r => r.isOver72h)
                .map((row, idx) => (
                  <TableRow key={row.id || idx} hover>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#1a73e8' }}>{row.soHd}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.tenKh}</TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>{row.loaiGd}</TableCell>
                    <TableCell align="center">
                      <Chip label={`${row.tonHrs}h`} size="small" color="error" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>{row.doiTruong}</TableCell>
                    <TableCell sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043' }}>{row.nhanSu || '(chưa phân công)'}</TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        color={row.hasNote ? 'success' : 'warning'}
                        onClick={() => onSelectNote && onSelectNote(row)}
                        sx={{ fontSize: '11px', fontWeight: 700, borderRadius: '6px' }}
                      >
                        {row.hasNote ? '📝 Xem Note' : 'Chưa ghi chú'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default Over72hModal;
