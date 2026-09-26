import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Grid,
  FormLabel,
  TextField,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  FileUpload as FileUploadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Over72hModal,
  Over24hModal,
  NoteDetailModal,
  ImportTonModal,
} from '../modals';

export default function TonTkBtView({
  tonTkBtDoiTruong,
  setTonTkBtDoiTruong,
  dynamicTonTkBtMetrics,
  setOver72hModalOpen,
  setOver24hModalOpen,
  tonTkBtSubTab,
  setTonTkBtSubTab,
  tonSyncing,
  handleSyncTonTkBt,
  setImportTonModalOpen,
  setImportTonResult,
  handleExportBacklogCSV,
  tonTkBtLoading,
  tonTkBtData,
  options,
  setTonTkBtBlockFilter,
  tonTkBtTypeFilter,
  setTonTkBtTypeFilter,
  tonTkBtCondFilter,
  setTonTkBtCondFilter,
  tonTkBtNoteFilter,
  setTonTkBtNoteFilter,
  tonTkBtSearch,
  setTonTkBtSearch,
  setSelectedNoteItem,
  setNoteDetailModalOpen,
  over72hModalOpen,
  over24hModalOpen,
  noteDetailModalOpen,
  selectedNoteItem,
  importTonModalOpen,
  importingTon,
  importTonMode,
  setImportTonMode,
  importTonResult,
  tonImportInputRef,
  handleImportTonFileSelect,
  filteredBacklogDetails = [],
}) {
  return (
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* TỒN TK-BT METRICS SUMMARY - FULL WIDTH GRID */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, width: '100%' }}>
                  
                  {/* CARD 1: TỔNG TỒN */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #d2e3fc', borderLeft: '6px solid #1a73e8', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="overline" sx={{ color: '#1a73e8', fontWeight: 800 }}>
                        {tonTkBtDoiTruong !== '__ALL__' ? `TỔNG TỒN (${tonTkBtDoiTruong})` : 'TỔNG TỒN CHI NHÁNH SG01'}
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a73e8', mt: 0.5 }}>
                        {dynamicTonTkBtMetrics.totalAll} Phiếu
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                        Gồm {dynamicTonTkBtMetrics.totalTK} Triển Khai & {dynamicTonTkBtMetrics.totalBT} Bảo Trì
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* CARD 2: TỒN TRIỂN KHAI >72H */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #b2dfdb', borderLeft: '6px solid #00897b', backgroundColor: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="overline" sx={{ color: '#00897b', fontWeight: 800 }}>
                          TỒN TRIỂN KHAI (&gt;72H)
                        </Typography>
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: dynamicTonTkBtMetrics.countTK72h > 0 ? '#d93025' : '#00897b', mt: 0.5 }}>
                        {dynamicTonTkBtMetrics.countTK72h} Phiếu
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => setOver72hModalOpen(true)}
                        sx={{ mt: 1.5, borderRadius: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'none' }}
                      >
                        Show chi tiết &gt;72H
                      </Button>
                    </CardContent>
                  </Card>

                  {/* CARD 3: TỒN BẢO TRÌ >24H */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #ffe0b2', borderLeft: '6px solid #f57c00', backgroundColor: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="overline" sx={{ color: '#e65100', fontWeight: 800 }}>
                          TỒN BẢO TRÌ (&gt;24H)
                        </Typography>
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: dynamicTonTkBtMetrics.countBT24h > 0 ? '#d93025' : '#e65100', mt: 0.5 }}>
                        {dynamicTonTkBtMetrics.countBT24h} Phiếu
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => setOver24hModalOpen(true)}
                        sx={{ mt: 1.5, borderRadius: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'none', backgroundColor: '#e65100' }}
                      >
                        Show chi tiết &gt;24H
                      </Button>
                    </CardContent>
                  </Card>

                  {/* CARD 4: TỶ LỆ CÓ GHI CHÚ / THÔNG TIN */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e1bee7', borderLeft: '6px solid #7b1fa2', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="overline" sx={{ color: '#7b1fa2', fontWeight: 800 }}>
                        TỶ LỆ CÓ GHI CHÚ / THÔNG TIN
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#7b1fa2', mt: 0.5 }}>
                        {dynamicTonTkBtMetrics.notePct}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                        Đã có Note: {dynamicTonTkBtMetrics.hasNoteCount} / {dynamicTonTkBtMetrics.totalAll} ca
                      </Typography>
                    </CardContent>
                  </Card>

                </Box>

                {/* SUB TABS NAVIGATION */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', p: 0.8, backgroundColor: '#ffffff', display: 'flex', gap: 1 }}>
                  <Button
                    variant={tonTkBtSubTab === 'summary' ? 'contained' : 'text'}
                    color="primary"
                    onClick={() => setTonTkBtSubTab('summary')}
                    sx={{ borderRadius: '12px', fontWeight: 700, px: 3, py: 1 }}
                  >
                    📊 Bảng Tổng Hợp Theo Block & Đội Trưởng
                  </Button>
                  <Button
                    variant={tonTkBtSubTab === 'details' ? 'contained' : 'text'}
                    color="primary"
                    onClick={() => setTonTkBtSubTab('details')}
                    sx={{ borderRadius: '12px', fontWeight: 700, px: 3, py: 1 }}
                  >
                    📋 Danh Sách Phiếu Tồn Chi Tiết (TK & BT)
                  </Button>
                </Paper>

                {/* SUB-TAB 1: BẢNG TỔNG HỢP THEO BLOCK */}
                {tonTkBtSubTab === 'summary' && (
                  <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                    <Box sx={{ p: 2.5, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124' }}>
                        BẢNG TỔNG HỢP TỒN THEO BLOCK & ĐỘI TRƯỜNG
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          startIcon={tonSyncing ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: '16px' }} />}
                          onClick={handleSyncTonTkBt}
                          disabled={tonSyncing}
                          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 1.5, py: 0.5, fontSize: '12px' }}
                          title="Kéo data tồn mới nhất từ Supabase Cloud / Vercel"
                        >
                          {tonSyncing ? 'Đang kéo...' : 'Đồng bộ Tồn'}
                        </Button>
                        <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043' }}>Đội Trưởng:</FormLabel>
                        <TextField
                          select
                          size="small"
                          value={tonTkBtDoiTruong}
                          onChange={(e) => setTonTkBtDoiTruong(e.target.value)}
                          sx={{ width: 220 }}
                        >
                          <MenuItem value="__ALL__">-- Tất cả Đội Trưởng --</MenuItem>
                          {options.team_leads.map((tl) => (
                            <MenuItem key={tl} value={tl}>{tl}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Box>

                    {tonTkBtLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                    ) : (
                      <TableContainer sx={{ maxHeight: 680 }}>
                        <Table stickyHeader size="small">
                          <TableHead sx={{ backgroundColor: '#f1f3f4' }}>
                            <TableRow>
                              <TableCell align="center" sx={{ fontWeight: 800, width: 60 }}>STT</TableCell>
                              <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Block</TableCell>
                              <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Đội Trưởng Quản Lý</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#fde8e8', color: '#d93025' }}>Tồn TK &gt;72H</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#fff3e0', color: '#e65100' }}>Tồn BT &gt;24H</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e8f0fe', color: '#1a73e8' }}>Tổng Tồn TK</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e8f0fe', color: '#1a73e8' }}>Tổng Tồn BT</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#ffe0b2', color: '#d84315' }}>Tổng Tồn (TK + BT)</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#f3e5f5', color: '#7b1fa2' }}>Tỷ Lệ Đã Ghi Chú (%)</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, minWidth: 120 }}>Thao Tác</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {tonTkBtData?.summaryTable
                              ?.filter(r => tonTkBtDoiTruong === '__ALL__' || r.doiTruong === tonTkBtDoiTruong)
                              .map((row, idx) => (
                                <TableRow key={row.block} hover sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                                  <TableCell align="center" sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: '#202124' }}>{row.block}</TableCell>
                                  <TableCell sx={{ fontSize: '13px' }}>{row.doiTruong}</TableCell>
                                  
                                  {/* TK >72H */}
                                  <TableCell align="center" sx={{ backgroundColor: row.tk72h > 0 ? '#fef2f2 !important' : 'inherit' }}>
                                    <Chip
                                      label={row.tk72h}
                                      size="small"
                                      color={row.tk72h > 0 ? 'error' : 'default'}
                                      sx={{ fontWeight: 800, height: 22 }}
                                    />
                                  </TableCell>

                                  {/* BT >24H */}
                                  <TableCell align="center" sx={{ backgroundColor: row.bt24h > 0 ? '#fff7ed !important' : 'inherit' }}>
                                    <Chip
                                      label={row.bt24h}
                                      size="small"
                                      color={row.bt24h > 0 ? 'warning' : 'default'}
                                      sx={{ fontWeight: 800, height: 22, backgroundColor: row.bt24h > 0 ? '#e65100' : undefined, color: row.bt24h > 0 ? '#fff' : undefined }}
                                    />
                                  </TableCell>

                                  <TableCell align="center" sx={{ fontWeight: 700, color: '#00897b' }}>{row.totTK}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: '#e65100' }}>{row.totBT}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, color: '#d84315', backgroundColor: 'rgba(255,224,178,0.3)' }}>{row.totAll}</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: '#7b1fa2' }}>{row.bNotePct}%</TableCell>
                                  <TableCell align="center">
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      onClick={() => {
                                        setTonTkBtBlockFilter(row.block);
                                        setTonTkBtSubTab('details');
                                      }}
                                      sx={{ fontSize: '11px', fontWeight: 700, borderRadius: '8px' }}
                                    >
                                      👁️ Chi Tiết HĐ
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Paper>
                )}

                {/* SUB-TAB 2: DANH SÁCH PHIẾU TỒN CHI TIẾT */}
                {tonTkBtSubTab === 'details' && (
                  <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                    
                    {/* TOOLBAR FILTERS */}
                    <Box sx={{ p: 2.5, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3} md={2}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Đội Trưởng</FormLabel>
                          <TextField select fullWidth size="small" value={tonTkBtDoiTruong} onChange={(e) => setTonTkBtDoiTruong(e.target.value)}>
                            <MenuItem value="__ALL__">-- Tất cả --</MenuItem>
                            {options.team_leads.map((tl) => (
                              <MenuItem key={tl} value={tl}>{tl}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={3} md={2}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Phân Loại Tồn</FormLabel>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={tonTkBtTypeFilter}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTonTkBtTypeFilter(val);
                              if (val === 'TK' && tonTkBtCondFilter === 'BT_24H') {
                                setTonTkBtCondFilter('ALL');
                              } else if (val === 'BT' && tonTkBtCondFilter === 'TK_72H') {
                                setTonTkBtCondFilter('ALL');
                              }
                            }}
                          >
                            <MenuItem value="ALL">Tất cả (TK + BT)</MenuItem>
                            <MenuItem value="TK">Triển Khai (TK)</MenuItem>
                            <MenuItem value="BT">Bảo Trì (BT)</MenuItem>
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={3} md={2}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Điều Kiện Tồn</FormLabel>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={tonTkBtCondFilter}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTonTkBtCondFilter(val);
                              if (val === 'TK_72H') {
                                setTonTkBtTypeFilter('TK');
                              } else if (val === 'BT_24H') {
                                setTonTkBtTypeFilter('BT');
                              }
                            }}
                          >
                            <MenuItem value="ALL">Tất cả thời gian</MenuItem>
                            {tonTkBtTypeFilter !== 'BT' && <MenuItem value="TK_72H">Tồn Triển Khai &gt;72H</MenuItem>}
                            {tonTkBtTypeFilter !== 'TK' && <MenuItem value="BT_24H">Tồn Bảo Trì &gt;24H</MenuItem>}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={3} md={2}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Trạng Thái Ghi Chú</FormLabel>
                          <TextField select fullWidth size="small" value={tonTkBtNoteFilter} onChange={(e) => setTonTkBtNoteFilter(e.target.value)}>
                            <MenuItem value="ALL">Tất cả</MenuItem>
                            <MenuItem value="HAS_NOTE">Có Ghi Chú / Thông Tin</MenuItem>
                            <MenuItem value="NO_NOTE">Chưa Ghi Chú / Rỗng</MenuItem>
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Tìm Kiếm</FormLabel>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Nhập SHD, Tên KH..."
                            value={tonTkBtSearch}
                            onChange={(e) => setTonTkBtSearch(e.target.value)}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3.5} sx={{ display: 'flex', gap: 1, mt: 2.5 }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={tonSyncing ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: '18px' }} />}
                            onClick={handleSyncTonTkBt}
                            disabled={tonSyncing}
                            sx={{ borderRadius: 2, height: 40, fontWeight: 700, minWidth: '105px', px: 1.5, textTransform: 'none' }}
                            title="Kéo data tồn mới nhất từ Supabase Cloud / Vercel"
                          >
                            {tonSyncing ? 'Đang kéo...' : 'Đồng bộ'}
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            startIcon={<FileUploadIcon />}
                            onClick={() => {
                              setImportTonResult(null);
                              setImportTonModalOpen(true);
                            }}
                            sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}
                          >
                            Import Data
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            startIcon={<DownloadIcon />}
                            onClick={handleExportBacklogCSV}
                            sx={{ borderRadius: 2, height: 40, fontWeight: 700, backgroundColor: '#1e8e3e' }}
                          >
                            Xuất CSV
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* DETAILS TABLE */}
                    <TableContainer sx={{ maxHeight: 680 }}>
                      <Table stickyHeader size="small">
                        <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                          <TableRow>
                            <TableCell align="center" sx={{ fontWeight: 800, width: 50 }}>STT</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, width: 110 }}>Loại</TableCell>
                            <TableCell sx={{ fontWeight: 800, minWidth: 130 }}>Số HĐ (SHD)</TableCell>
                            <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Tên Khách Hàng</TableCell>
                            <TableCell sx={{ fontWeight: 800, minWidth: 160 }}>Block / Đội Trưởng</TableCell>
                            <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Loại Giao Dịch / Tình Trạng</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, minWidth: 140 }}>Thời Gian Tồn</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, minWidth: 150 }}>Trạng Thái Ghi Chú</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, minWidth: 120 }}>Thao Tác</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredBacklogDetails.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#5f6368' }}>
                                Không tìm thấy phiếu tồn nào phù hợp với bộ lọc.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredBacklogDetails.map((row, idx) => {
                              const isDanger = (row.type === 'TK' && row.isOver72h) || (row.type === 'BT' && row.isOver24h);

                              return (
                                <TableRow key={row.id || `${row.type}_${row.soHd}_${idx}`} hover sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                                  <TableCell align="center" sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={row.typeLabel}
                                      size="small"
                                      sx={{
                                        fontWeight: 800,
                                        backgroundColor: row.type === 'TK' ? '#e8f0fe' : '#fff3e0',
                                        color: row.type === 'TK' ? '#1a73e8' : '#e65100'
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: '#1a73e8' }}>{row.soHd}</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: '#202124' }}>{row.tenKh}</TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#3c4043' }}>{row.block}</Typography>
                                    <Typography variant="caption" sx={{ color: '#5f6368', display: 'block' }}>
                                      {row.doiTruong} {row.nhanSu ? `(${row.nhanSu})` : ''}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '12px' }}>{row.loaiGd}</TableCell>
                                  
                                  {/* TỒN GIỜ */}
                                  <TableCell align="center">
                                    <Chip
                                      label={`${row.tonHrs} Giờ`}
                                      size="small"
                                      sx={{
                                        fontWeight: 800,
                                        backgroundColor: isDanger ? '#fef2f2' : '#f1f5f9',
                                        color: isDanger ? '#d93025' : '#334155',
                                        border: isDanger ? '1px solid #fecaca' : undefined
                                      }}
                                    />
                                  </TableCell>

                                  {/* TRẠNG THÁI GHI CHÚ */}
                                  <TableCell align="center">
                                    <Chip
                                      label={row.noteStatus}
                                      size="small"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: '11px',
                                        backgroundColor: row.hasNote ? '#e8f5e9' : '#fff7ed',
                                        color: row.hasNote ? '#2e7d32' : '#c2410c',
                                        border: row.hasNote ? '1px solid #c8e6c9' : '1px solid #fed7aa'
                                      }}
                                    />
                                  </TableCell>

                                  <TableCell align="center">
                                    <Button
                                      size="small"
                                      variant={row.hasNote ? 'contained' : 'outlined'}
                                      color={row.hasNote ? 'primary' : 'inherit'}
                                      onClick={() => {
                                        setSelectedNoteItem(row);
                                        setNoteDetailModalOpen(true);
                                      }}
                                      sx={{ fontSize: '11px', fontWeight: 700, borderRadius: '8px' }}
                                    >
                                      {row.hasNote ? '📝 Xem Note' : '👁️ Chi Tiết'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}

                {/* MODAL 1: SHOW CHI TIẾT TỒN TRIỂN KHAI >72H */}
                <Over72hModal
                  open={over72hModalOpen}
                  onClose={() => setOver72hModalOpen(false)}
                  countTK72h={dynamicTonTkBtMetrics.countTK72h}
                  filteredTkList={dynamicTonTkBtMetrics.filteredTkList}
                  onSelectNote={(row) => {
                    setSelectedNoteItem(row);
                    setNoteDetailModalOpen(true);
                  }}
                />

                {/* MODAL 2: SHOW CHI TIẾT TỒN BẢO TRÌ >24H */}
                <Over24hModal
                  open={over24hModalOpen}
                  onClose={() => setOver24hModalOpen(false)}
                  countBT24h={dynamicTonTkBtMetrics.countBT24h}
                  filteredBtList={dynamicTonTkBtMetrics.filteredBtList}
                  onSelectNote={(row) => {
                    setSelectedNoteItem(row);
                    setNoteDetailModalOpen(true);
                  }}
                />

                {/* MODAL 3: XEM CHI TIẾT NỘI DUNG GHI CHÚ HỢP ĐỒNG */}
                <NoteDetailModal
                  open={noteDetailModalOpen}
                  onClose={() => setNoteDetailModalOpen(false)}
                  selectedNoteItem={selectedNoteItem}
                />

                {/* MODAL 4: IMPORT DATA TỒN TK-BT */}
                <ImportTonModal
                  open={importTonModalOpen}
                  onClose={() => setImportTonModalOpen(false)}
                  importingTon={importingTon}
                  importTonMode={importTonMode}
                  setImportTonMode={setImportTonMode}
                  importTonResult={importTonResult}
                  tonImportInputRef={tonImportInputRef}
                  handleImportTonFileSelect={handleImportTonFileSelect}
                />

              </Box>
  );
}
