import React from 'react';
import {
  Box,
  Paper,
  Button,
  Grid,
  FormLabel,
  TextField,
  MenuItem,
  CircularProgress,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  CalendarToday as CalendarTodayIcon,
  Visibility as VisibilityIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { TimelineModal, ThresholdModal } from '../modals';

const pad = (n) => String(n).padStart(2, '0');

export default function LichTrucView({
  ltTab,
  setLtTab,
  fetchLichTrucDashboard,
  fetchLichTrucChiTiet,
  fetchLichTrucHistory,
  ltDate,
  setLtDate,
  ltDashDoiTruong,
  setLtDashDoiTruong,
  options,
  ltLoading,
  ltDashData,
  ltOffStaffSearch,
  setLtOffStaffSearch,
  thresholdModalOpen,
  setThresholdModalOpen,
  tempTiLeTrucMin,
  setTempTiLeTrucMin,
  tempTonPerNsMax,
  setTempTonPerNsMax,
  handleSaveThresholds,
  ltThresholds,
  renderLichTrucChiTiet,
  ltHistMonth,
  setLtHistMonth,
  ltHistYear,
  setLtHistYear,
  ltHistDoiTruong,
  setLtHistDoiTruong,
  ltHistSearch,
  setLtHistSearch,
  ltHistLimit2Only,
  setLtHistLimit2Only,
  ltHistLoading,
  ltHistData,
  handleExportHistoryCSV,
  timelineModalOpen,
  setTimelineModalOpen,
  selectedStaffTimeline,
  setSelectedStaffTimeline,
  exportCaOStaffCsv,
}) {
  return (
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* SUB TABS NAVIGATION */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', p: 0.8, backgroundColor: '#ffffff', display: 'flex', gap: 1 }}>
                  <Button
                    variant={ltTab === 'dashboard' ? 'contained' : 'text'}
                    color="primary"
                    onClick={() => { setLtTab('dashboard'); fetchLichTrucDashboard(); }}
                    sx={{ borderRadius: '12px', fontWeight: 700, px: 3, py: 1 }}
                  >
                    📋 Dashboard Tra Cứu Theo Ngày
                  </Button>
                  <Button
                    variant={ltTab === 'chitiet' ? 'contained' : 'text'}
                    color="primary"
                    onClick={() => { setLtTab('chitiet'); fetchLichTrucChiTiet(); }}
                    sx={{ borderRadius: '12px', fontWeight: 700, px: 3, py: 1 }}
                  >
                    📑 Chi Tiết Lịch Trực (31 Ngày)
                  </Button>
                  <Button
                    variant={ltTab === 'history' ? 'contained' : 'text'}
                    color="primary"
                    onClick={() => { setLtTab('history'); fetchLichTrucHistory(); }}
                    sx={{ borderRadius: '12px', fontWeight: 700, px: 3, py: 1 }}
                  >
                    📜 Lịch Sử Thay Đổi & Timeline Đối Soát
                  </Button>
                </Paper>

                {/* ==================== SUB-TAB 1: DASHBOARD TRA CỨU THEO NGÀY ==================== */}
                {ltTab === 'dashboard' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    {/* TOOLBAR SEARCH & FILTER */}
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                      <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} sm={6} md={3}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                            Ngày tra cứu
                          </FormLabel>
                          <TextField
                            type="date"
                            fullWidth
                            size="small"
                            value={ltDate}
                            onChange={(e) => setLtDate(e.target.value)}
                            sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                          />
                        </Grid>

                        <Grid item xs={6} sm={3} md={1.5}>
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={() => fetchLichTrucDashboard(ltDate)}
                            sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}
                          >
                            🔍 Tra cứu
                          </Button>
                        </Grid>

                        <Grid item xs={6} sm={3} md={1.5}>
                          <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            onClick={() => {
                              const d = new Date();
                              const pad = n => String(n).padStart(2, '0');
                              const tStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                              setLtDate(tStr);
                              fetchLichTrucDashboard(tStr);
                            }}
                            sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}
                          >
                            Hôm nay
                          </Button>
                        </Grid>

                        <Grid item xs={6} sm={3} md={1.5}>
                          <Button
                            variant="outlined"
                            color="info"
                            fullWidth
                            onClick={() => fetchLichTrucDashboard(ltDate, true)}
                            disabled={ltLoading}
                            sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}
                          >
                            🔄 Làm mới
                          </Button>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2.5}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                            Lọc Theo Đội Trưởng
                          </FormLabel>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={ltDashDoiTruong}
                            onChange={(e) => setLtDashDoiTruong(e.target.value)}
                            sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                          >
                            <MenuItem value="__ALL__">-- Tất cả Đội Trưởng --</MenuItem>
                            {options.team_leads.map((tl) => (
                              <MenuItem key={tl} value={tl}>{tl}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            onClick={() => setThresholdModalOpen(true)}
                            startIcon={<SettingsIcon />}
                            sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}
                          >
                            ⚙️ Ngưỡng màu
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* SUMMARY CARDS ROW */}
                    {ltDashData && (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, width: '100%' }}>
                        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #d2e3fc', borderLeft: '6px solid #1a73e8', backgroundColor: '#ffffff' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="overline" sx={{ color: '#1a73e8', fontWeight: 800 }}>
                              NS ĐI LÀM - {ltDashData.date0}
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a73e8', mt: 0.5 }}>
                              {ltDashData.summaryTable
                                ?.filter(r => ltDashDoiTruong === '__ALL__' || r.doiTruong === ltDashDoiTruong)
                                .reduce((a, b) => a + b.ca1Ngay0, 0)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                              Tổng CA1 {ltDashDoiTruong !== '__ALL__' ? `(${ltDashDoiTruong})` : 'toàn hệ thống'} ngày tra cứu
                            </Typography>
                          </CardContent>
                        </Card>

                        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #b2dfdb', borderLeft: '6px solid #00897b', backgroundColor: '#ffffff' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="overline" sx={{ color: '#00897b', fontWeight: 800 }}>
                              TỔNG NS ACTIVE
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 800, color: '#00897b', mt: 0.5 }}>
                              {ltDashData.summaryTable
                                ?.filter(r => ltDashDoiTruong === '__ALL__' || r.doiTruong === ltDashDoiTruong)
                                .reduce((a, b) => a + b.slActive, 0)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                              Theo danh mục Nhân Sự (tình trạng Active)
                            </Typography>
                          </CardContent>
                        </Card>

                        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #ffe0b2', borderLeft: '6px solid #f57c00', backgroundColor: '#ffffff' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="overline" sx={{ color: '#e65100', fontWeight: 800 }}>
                              TỔNG TỒN (TK + BT)
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 800, color: '#e65100', mt: 0.5 }}>
                              {ltDashData.summaryTable
                                ?.filter(r => ltDashDoiTruong === '__ALL__' || r.doiTruong === ltDashDoiTruong)
                                .reduce((a, b) => a + (b.totTK || 0) + (b.totBT || 0), 0)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                              Tổng tồn Triển Khai + Bảo Trì {ltDashDoiTruong !== '__ALL__' ? '(đã lọc)' : 'toàn hệ thống'}
                            </Typography>
                          </CardContent>
                        </Card>

                        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #fbcfe8', borderLeft: '6px solid #db2777', backgroundColor: '#ffffff' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="overline" sx={{ color: '#db2777', fontWeight: 800 }}>
                              NS NGHỈ (CA O) - {ltDashData.date0}
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 800, color: '#db2777', mt: 0.5 }}>
                              {ltDashData.offStaffList
                                ?.filter(s => ltDashDoiTruong === '__ALL__' || s.doiTruong === ltDashDoiTruong)
                                ?.length || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                              Nhân sự ca O {ltDashDoiTruong !== '__ALL__' ? `(${ltDashDoiTruong})` : 'toàn hệ thống'} ngày tra cứu
                            </Typography>
                          </CardContent>
                        </Card>
                      </Box>
                    )}

                    {/* LEGEND BAR */}
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', px: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 14, height: 14, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '3px' }} />
                        <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 600 }}>
                          Tỉ lệ Trực &lt; {ltThresholds.tiLeTrucMin}% (Tô đỏ toàn dòng)
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 14, height: 14, backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '3px' }} />
                        <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 600 }}>
                          Tồn/NS &gt; {ltThresholds.tonPerNsMax} (Tô cam ô Tồn/NS)
                        </Typography>
                      </Box>
                    </Box>

                    {/* SUMMARY TABLE PER BLOCK */}
                    <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                      <Box sx={{ p: 2, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124' }}>
                          BẢNG TỔNG HỢP LỊCH TRỰC THEO BLOCK
                        </Typography>
                        {ltDashData && (
                          <Typography variant="caption" sx={{ color: '#5f6368' }}>
                            Cập nhật: {ltDashData.generatedAt}
                          </Typography>
                        )}
                      </Box>

                      {ltLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                      ) : (
                        <TableContainer sx={{ maxHeight: 680 }}>
                          <Table stickyHeader size="small">
                            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Block</TableCell>
                                <TableCell sx={{ fontWeight: 800, minWidth: 140 }}>Đội Trưởng</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e8f0fe', color: '#1a73e8' }}>SL NS<br />Active</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#fff3e0', color: '#e65100' }}>Tổng Tồn<br />Triển Khai</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#fff3e0', color: '#e65100' }}>Tổng Tồn<br />Bảo Trì</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#ffe0b2', color: '#d84315' }}>Tổng Tồn<br />(TK + BT)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e8f0fe', color: '#1a73e8' }}>NS Đi Làm<br />{ltDashData?.date0 || 'Ngày X'}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e8f0fe', color: '#1a73e8' }}>Tỉ lệ<br />Trực (%)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#fff3e0', color: '#e65100' }}>Tồn/NS<br />{ltDashData?.date0 || 'Ngày X'}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#f3e5f5', color: '#6a1b9a' }}>Tồn Dự Kiến<br />(Tổng/Active)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>NS Đi Làm<br />{ltDashData?.date1 || 'Ngày X+1'}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>Tồn/NS<br />{ltDashData?.date1 || 'Ngày X+1'}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e0f7fa', color: '#00838f' }}>NS Đi Làm<br />{ltDashData?.date2 || 'Ngày X+2'}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e0f0fa', color: '#00838f' }}>Tồn/NS<br />{ltDashData?.date2 || 'Ngày X+2'}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ltDashData?.summaryTable
                                ?.filter(r => ltDashDoiTruong === '__ALL__' || r.doiTruong === ltDashDoiTruong)
                                .map((row) => {
                                  const lowAttendance = typeof row.tiLeTruc === 'number' && row.tiLeTruc < ltThresholds.tiLeTrucMin;
                                  const tonHigh = typeof row.tonPerNs === 'number' && row.tonPerNs > ltThresholds.tonPerNsMax;

                                  return (
                                    <TableRow
                                      key={row.block}
                                      hover
                                      sx={{
                                        backgroundColor: lowAttendance ? '#fef2f2 !important' : 'inherit'
                                      }}
                                    >
                                      <TableCell sx={{ fontWeight: 700, color: '#202124' }}>{row.block}</TableCell>
                                      <TableCell sx={{ fontSize: '12px' }}>{row.doiTruong}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: 'rgba(232,240,254,0.4)' }}>{row.slActive}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 600 }}>{row.totTK}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 600 }}>{row.totBT}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 700, color: '#d84315', backgroundColor: 'rgba(255,224,178,0.3)' }}>{row.totAll}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: '#1a73e8' }}>{row.ca1Ngay0}</TableCell>
                                      <TableCell align="center" sx={{ color: lowAttendance ? '#dc2626' : 'inherit', fontWeight: lowAttendance ? 800 : 700 }}>
                                        {typeof row.tiLeTruc === 'number' ? `${row.tiLeTruc}%` : row.tiLeTruc}
                                      </TableCell>
                                      <TableCell
                                        align="center"
                                        sx={{
                                          backgroundColor: tonHigh ? '#fff7ed !important' : 'inherit',
                                          color: tonHigh ? '#c2410c' : 'inherit',
                                          fontWeight: tonHigh ? 800 : 600
                                        }}
                                      >
                                        {row.tonPerNs}
                                      </TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 700, color: '#6a1b9a', backgroundColor: 'rgba(243,229,245,0.4)' }}>{row.tonDuKien}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 700, color: '#2e7d32' }}>{row.ca1Ngay1}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 600, color: '#2e7d32' }}>{row.tonDuKien1}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 700, color: '#00838f' }}>{row.ca1Ngay2}</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 600, color: '#00838f' }}>{row.tonDuKien2}</TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Paper>

                    {/* DANH SÁCH NHÂN SỰ NGHỈ (CA O) TRONG NGÀY */}
                    <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', mt: 1 }}>
                      <Box sx={{ p: 2.5, backgroundColor: '#fff7ed', borderBottom: '1px solid #fed7aa', display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 1 }}>
                            🏖️ DANH SÁCH NHÂN SỰ NGHỈ (CA O) - NGÀY {ltDashData?.date0 || '...'}
                          </Typography>
                          <Chip 
                            label={`${
                              (ltDashData?.offStaffList || [])
                                .filter(s => ltDashDoiTruong === '__ALL__' || s.doiTruong === ltDashDoiTruong)
                                .filter(s => {
                                  if (!ltOffStaffSearch) return true;
                                  const q = ltOffStaffSearch.toLowerCase().trim();
                                  return (
                                    (s.code || '').toLowerCase().includes(q) ||
                                    (s.name || '').toLowerCase().includes(q) ||
                                    (s.mail || '').toLowerCase().includes(q) ||
                                    (s.block || '').toLowerCase().includes(q) ||
                                    (s.doiTruong || '').toLowerCase().includes(q)
                                  );
                                }).length
                            } nhân sự`}
                            size="small"
                            sx={{ fontWeight: 700, backgroundColor: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <TextField
                            size="small"
                            placeholder="🔍 Tìm Mã NV, Tên, Block, ĐT..."
                            value={ltOffStaffSearch}
                            onChange={(e) => setLtOffStaffSearch(e.target.value)}
                            sx={{ width: 280, backgroundColor: '#ffffff', '& .MuiInputBase-root': { borderRadius: 2 } }}
                          />
                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            onClick={exportCaOStaffCsv}
                            sx={{ borderRadius: 2, height: 40, fontWeight: 700, px: 2, textTransform: 'none' }}
                          >
                            📥 Xuất File CSV
                          </Button>
                        </Box>
                      </Box>

                      {ltLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
                      ) : (
                        (() => {
                          const offList = (ltDashData?.offStaffList || [])
                            .filter(s => ltDashDoiTruong === '__ALL__' || s.doiTruong === ltDashDoiTruong)
                            .filter(s => {
                              if (!ltOffStaffSearch) return true;
                              const q = ltOffStaffSearch.toLowerCase().trim();
                              return (
                                (s.code || '').toLowerCase().includes(q) ||
                                (s.name || '').toLowerCase().includes(q) ||
                                (s.mail || '').toLowerCase().includes(q) ||
                                (s.block || '').toLowerCase().includes(q) ||
                                (s.doiTruong || '').toLowerCase().includes(q)
                              );
                            });

                          if (offList.length === 0) {
                            return (
                              <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="body1" sx={{ color: '#6b7280', fontStyle: 'italic' }}>
                                  🎉 Không có nhân sự nào có ca trực là O (nghỉ trực) {ltDashDoiTruong !== '__ALL__' ? `thuộc ${ltDashDoiTruong}` : ''} trong ngày {ltDashData?.date0 || 'này'}.
                                </Typography>
                              </Box>
                            );
                          }

                          return (
                            <TableContainer sx={{ maxHeight: 480 }}>
                              <Table stickyHeader size="small">
                                <TableHead sx={{ backgroundColor: '#fff7ed' }}>
                                  <TableRow>
                                    <TableCell align="center" sx={{ fontWeight: 800, width: 60 }}>STT</TableCell>
                                    <TableCell sx={{ fontWeight: 800, minWidth: 100 }}>Mã NV</TableCell>
                                    <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Họ và Tên</TableCell>
                                    <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Email / Account</TableCell>
                                    <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Block</TableCell>
                                    <TableCell sx={{ fontWeight: 800, minWidth: 140 }}>Đội Trưởng</TableCell>
                                    <TableCell sx={{ fontWeight: 800, minWidth: 120 }}>Đối Tác</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, width: 110 }}>Ca Trực</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, width: 110 }}>Trạng Thái</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {offList.map((st, sIdx) => (
                                    <TableRow key={st.code || sIdx} hover sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                                      <TableCell align="center" sx={{ color: '#6b7280', fontSize: '13px' }}>{sIdx + 1}</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{st.code || '-'}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{st.name}</TableCell>
                                      <TableCell sx={{ fontSize: '12px', color: '#475569' }}>{st.mail || '-'}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{st.block}</TableCell>
                                      <TableCell sx={{ fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>{st.doiTruong}</TableCell>
                                      <TableCell sx={{ fontSize: '12px', color: '#64748b' }}>{st.partner || '-'}</TableCell>
                                      <TableCell align="center">
                                        <Chip label="Ca O" size="small" sx={{ fontWeight: 800, backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }} />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={st.status || 'Active'}
                                          size="small"
                                          variant="outlined"
                                          color={st.status === 'Active' ? 'success' : 'default'}
                                          sx={{ fontWeight: 600, fontSize: '11px', height: 22 }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );
                        })()
                      )}
                    </Paper>

                  </Box>
                )}

                {/* ==================== SUB-TAB 2: CHI TIẾT LỊCH TRỰC ==================== */}
                {ltTab === 'chitiet' && renderLichTrucChiTiet(false)}

                {/* ==================== SUB-TAB 3: LỊCH SỬ THAY ĐỔI & ĐỐI SOÁT ==================== */}
                {ltTab === 'history' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    {/* ANNOUNCEMENT BANNER */}
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#f0f7ff', border: '1px solid #bae0ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#e6f4ff', color: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                          📜
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#002c8c' }}>
                            Nhật Ký Thay Đổi & Timeline Đối Soát Ca Trực (Full Audit Log)
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#003eb3' }}>
                            Tự động lưu vết lịch sử tại 4 mốc giờ <b>08:00 - 14:00 - 19:00 - 23:00</b> hàng ngày và mọi thao tác chỉnh sửa. Lưu vết 100% minh bạch phục vụ đối soát khi có tranh chấp ca làm việc.
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportHistoryCSV}
                        sx={{ borderRadius: 2, height: 40, fontWeight: 700, whiteSpace: 'nowrap' }}
                      >
                        Xuất File Đối Soát (CSV)
                      </Button>
                    </Paper>

                    {/* TOOLBAR SEARCH & FILTER */}
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3} md={1.5}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Tháng</FormLabel>
                          <TextField select fullWidth size="small" value={ltHistMonth} onChange={(e) => setLtHistMonth(Number(e.target.value))}>
                            <MenuItem value={0}>Tất cả</MenuItem>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={3} md={1.5}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Năm</FormLabel>
                          <TextField select fullWidth size="small" value={ltHistYear} onChange={(e) => setLtHistYear(Number(e.target.value))}>
                            <MenuItem value={0}>Tất cả</MenuItem>
                            {[2024, 2025, 2026, 2027].map((y) => (
                              <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2.5}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Đội Trưởng</FormLabel>
                          <TextField select fullWidth size="small" value={ltHistDoiTruong} onChange={(e) => setLtHistDoiTruong(e.target.value)}>
                            <MenuItem value="__ALL__">-- Tất cả Đội Trưởng --</MenuItem>
                            {options.team_leads.map((tl) => (
                              <MenuItem key={tl} value={tl}>{tl}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Tìm Nhân Viên / Block</FormLabel>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Nhập tên, mã NV, email hoặc block..."
                            value={ltHistSearch}
                            onChange={(e) => setLtHistSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchLichTrucHistory()}
                          />
                        </Grid>

                        <Grid item xs={12} sm={3} md={1.5}>
                          <Button variant="contained" color="primary" fullWidth onClick={fetchLichTrucHistory} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5 }}>
                            🔍 Lọc
                          </Button>
                        </Grid>

                        <Grid item xs={12} sm={3} md={2}>
                          <Button
                            variant={ltHistLimit2Only ? 'contained' : 'outlined'}
                            color={ltHistLimit2Only ? 'warning' : 'secondary'}
                            fullWidth
                            onClick={() => setLtHistLimit2Only(!ltHistLimit2Only)}
                            sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5, fontSize: '12px' }}
                          >
                            ⚡ {ltHistLimit2Only ? 'Chỉ 2 lần gần nhất' : 'Xem Full Nhật Ký'}
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* HISTORY LOG DATA TABLE */}
                    <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                      <Box sx={{ p: 2, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>DANH SÁCH LỊCH SỬ BIẾN ĐỘNG CA TRỰC</span>
                          <Chip label={`${ltHistData?.totalCount || 0} Bản ghi`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                        </Typography>

                        <Typography variant="caption" sx={{ color: '#5f6368' }}>
                          Chế độ xem: <b>{ltHistLimit2Only ? 'Lọc 2 thay đổi gần nhất / nhân sự' : 'Tất cả nhật ký làm sở cứ'}</b>
                        </Typography>
                      </Box>

                      {ltHistLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                      ) : (!ltHistData || !ltHistData.data || ltHistData.data.length === 0) ? (
                        <Box sx={{ p: 6, textAlign: 'center', color: '#5f6368' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>Chưa có biến động ca trực nào được ghi nhận.</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                            Hệ thống tự động so sánh tại các mốc giờ (08:00, 14:00, 19:00, 23:00) hoặc khi có thao tác chỉnh sửa Lịch Trực.
                          </Typography>
                        </Box>
                      ) : (
                        <TableContainer sx={{ maxHeight: 680 }}>
                          <Table stickyHeader size="small">
                            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                              <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 800, width: 60 }}>STT</TableCell>
                                <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Thời Gian Ghi Nhận</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, minWidth: 120 }}>Mốc Quét / Nguồn</TableCell>
                                <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Nhân Viên (Code / Name / Mail)</TableCell>
                                <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Block / Đội Trưởng</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, minWidth: 120 }}>Ngày Lịch Trực</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, minWidth: 160 }}>Biến Động Trạng Thái</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, minWidth: 120 }}>Thao Tác</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ltHistData.data.map((row, idx) => {
                                const isCa1ToOff = row.changeType === 'CA1 ➔ OFF';
                                return (
                                  <TableRow key={row.id || idx} hover sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                                    <TableCell align="center" sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#202124' }}>
                                      {row.timeDisplay || row.timestamp}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={row.milestone || 'Tự động'}
                                        size="small"
                                        sx={{
                                          fontWeight: 700,
                                          backgroundColor: row.milestone?.includes(':') ? '#e8f0fe' : '#f3e5f5',
                                          color: row.milestone?.includes(':') ? '#1a73e8' : '#7b1fa2'
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#202124' }}>{row.name}</Typography>
                                      <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 600, display: 'block' }}>
                                        {row.mail} ({row.codeStaff})
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#3c4043' }}>{row.block}</Typography>
                                      <Typography variant="caption" sx={{ color: '#5f6368', display: 'block' }}>
                                        Đội trưởng: {row.doiTruong || 'Chưa rõ'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, color: '#d84315' }}>
                                      {row.dateStr}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={`${row.oldVal || 'O'} ➔ ${row.newVal || 'O'}`}
                                        size="small"
                                        sx={{
                                          fontWeight: 800,
                                          fontSize: '12px',
                                          px: 1,
                                          backgroundColor: isCa1ToOff ? '#fff3e0' : '#e8f5e9',
                                          color: isCa1ToOff ? '#e65100' : '#2e7d32',
                                          border: isCa1ToOff ? '1px solid #ffe0b2' : '1px solid #c8e6c9'
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => {
                                          setSelectedStaffTimeline(row);
                                          setTimelineModalOpen(true);
                                        }}
                                        sx={{ fontSize: '11px', fontWeight: 700, borderRadius: '8px' }}
                                      >
                                        ⏱ Timeline
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Paper>

                    {/* TIMELINE MODAL DIALOG */}
                    <TimelineModal
                      open={timelineModalOpen}
                      onClose={() => setTimelineModalOpen(false)}
                      selectedStaffTimeline={selectedStaffTimeline}
                      ltHistData={ltHistData}
                    />

                  </Box>
                )}

                {/* THRESHOLD SETTINGS DIALOG */}
                <ThresholdModal
                  open={thresholdModalOpen}
                  onClose={() => setThresholdModalOpen(false)}
                  tempTiLeTrucMin={tempTiLeTrucMin}
                  setTempTiLeTrucMin={setTempTiLeTrucMin}
                  tempTonPerNsMax={tempTonPerNsMax}
                  setTempTonPerNsMax={setTempTonPerNsMax}
                  onSave={handleSaveThresholds}
                />

              </Box>
  );
}
