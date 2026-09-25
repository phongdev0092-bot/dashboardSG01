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

export const Over24hModal = ({
  open,
  onClose,
  countBT24h,
  filteredBtList = [],
  onSelectNote
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#e65100', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>⚠️ CHI TIẾT PHIẾU TỒN BẢO TRÌ &gt;24H</span>
        <Chip label={`${countBT24h || 0} Ca quá hạn`} color="warning" size="small" sx={{ fontWeight: 700, backgroundColor: '#e65100', color: '#fff' }} />
      </DialogTitle>
      <DialogContent dividers>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 800, width: 50 }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Số HĐ (SHD)</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tên Khách Hàng</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tình Trạng</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Thời Gian Tồn</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Đội Trưởng</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Nhân Viên (KTV)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Thông Tin Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBtList
                ?.filter(r => r.isOver24h)
                .map((row, idx) => (
                  <TableRow key={row.id || idx} hover>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#1a73e8' }}>{row.soHd}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.tenKh}</TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>{row.loaiGd}</TableCell>
                    <TableCell align="center">
                      <Chip label={`${row.tonHrs}h`} size="small" sx={{ fontWeight: 800, backgroundColor: '#fff3e0', color: '#e65100' }} />
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
                        {row.hasNote ? '📝 Xem Note' : 'Chưa có TT'}
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

export default Over24hModal;
