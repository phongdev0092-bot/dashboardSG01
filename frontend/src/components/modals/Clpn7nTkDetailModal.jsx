import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  Chip,
  Button,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

export const Clpn7nTkDetailModal = ({ open, onClose, summary, startDate, endDate }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    fetch(`/api/kpi/clpn7n-tk?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load CLPN 7N TK tickets:', err);
        setLoading(false);
      });
  }, [open, startDate, endDate]);

  const filtered = tickets.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.so_hd && t.so_hd.toLowerCase().includes(q)) ||
      (t.khach_hang && t.khach_hang.toLowerCase().includes(q)) ||
      (t.nv_trien_khai && t.nv_trien_khai.toLowerCase().includes(q)) ||
      (t.ten_nv_tk && t.ten_nv_tk.toLowerCase().includes(q)) ||
      (t.nv_bao_tri && t.nv_bao_tri.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#7b1fa2' }}>
            DANH SÁCH CLPN 7N TK (BẢO TRÌ PHÁT SINH TRONG 7 NGÀY SAU TRIỂN KHAI)
          </Typography>
          <Typography variant="caption" sx={{ color: '#5f6368' }}>
            Điều kiện: 0 ≤ (TG Tạo của BT − Ngày hoàn tất PTC của TK) ≤ 7 ngày | Gán trách nhiệm cho KTV Triển Khai
          </Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#202124' }}>
              Tỉ lệ toàn đơn vị: <span style={{ color: summary?.clpn7n_tk_status === 'PASS' ? '#2e7d32' : '#d32f2f', fontWeight: 800 }}>{summary?.clpn7n_tk_pct || 0}%</span> (Tiêu chuẩn: &le; 3%)
            </Typography>
            <Chip
              label={summary?.clpn7n_tk_status === 'PASS' ? "ĐẠT (<= 3%)" : "KHÔNG ĐẠT (> 3%)"}
              color={summary?.clpn7n_tk_status === 'PASS' ? 'success' : 'error'}
              size="small"
              sx={{ fontWeight: 800 }}
            />
            <Chip
              label={`${tickets.length} Phiếu`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <TextField
            size="small"
            placeholder="Tìm theo HĐ, KTV, Khách hàng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#757575' }} />
                </InputAdornment>
              )
            }}
            sx={{ width: 280 }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 40 }}>STT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>KTV Triển Khai</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Đội Trưởng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hoàn Tất TK</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>TG Tạo BT</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Cách (Ngày)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>KTV Bảo Trì</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lý Do / Nguyên Nhân</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((t, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1a73e8' }}>{t.so_hd}</TableCell>
                    <TableCell>{t.khach_hang || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#7b1fa2' }}>{t.nv_trien_khai}</Typography>
                      {t.ten_nv_tk && t.ten_nv_tk !== t.nv_trien_khai && (
                        <Typography variant="caption" sx={{ color: '#5f6368' }}>{t.ten_nv_tk}</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#5f6368', fontSize: '11px' }}>{t.team_lead || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '11px' }}>{t.tk_hoan_tat || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '11px' }}>{t.tg_tao_bt || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={t.so_ngay !== null && t.so_ngay !== undefined ? `${t.so_ngay} ngày` : '-'}
                        size="small"
                        sx={{ height: 20, fontSize: '10px', fontWeight: 800, backgroundColor: '#ffebee', color: '#c62828' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#00897b', fontWeight: 600 }}>{t.nv_bao_tri || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{t.ly_do || t.mo_ta || t.tinh_trang || '-'}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: '#5f6368' }}>
                      {search ? 'Không tìm thấy phiếu nào phù hợp' : 'Không có phiếu CLPN 7N TK trong kỳ này'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#4a148c' }, borderRadius: '18px', textTransform: 'none', px: 3 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Clpn7nTkDetailModal;
