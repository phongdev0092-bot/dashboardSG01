import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormLabel,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Storage as StorageIcon,
  MonetizationOn as SalaryIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Logout as LogoutIcon,
  FileUpload as FileUploadIcon,
  VpnKey as VpnKeyIcon,
  Speed as SpeedIcon,
  CalendarMonth as CalendarMonthIcon,
  PendingActions as PendingActionsIcon,
  BarChart as BarChartIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutlined as CheckCircleOutlineIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DebouncedSearchInput } from '../common';

export default function AdminView({
  currentUser,
  adminSubTab,
  setAdminSubTab,
  fetchAdminHrList,
  fetchAdminUsers,
  fetchLichTrucChiTiet,
  fetchDbCounts,
  fetchLuongList,
  fetchAdminLoadingSlides,
  handleLogout,
  // HR tab
  hrLoading,
  hrList,
  hrSearch,
  setHrSearch,
  hrTlFilter,
  setHrTlFilter,
  hrBlockFilter,
  setHrBlockFilter,
  options,
  openUnifiedHrModal,
  setHrToDelete,
  setHrDeleteModalOpen,
  // User tab
  adminUsersLoading,
  adminUsers,
  showPasswords,
  toggleShowPassword,
  setUserForm,
  setEditingUser,
  setUserModalOpen,
  setUserToDelete,
  setDeleteConfirmOpen,
  // Lich truc tab
  renderLichTrucChiTiet,
  // DB tab
  dbCounts,
  syncing,
  handleSyncSheetNow,
  handleTriggerSync,
  importTarget,
  setImportTarget,
  importRule,
  setImportRule,
  dbFile,
  setDbFile,
  dbUploading,
  handleImportDbDataset,
  dbResult,
  setDbResult,
  dbInputRef,
  importInputRef,
  setClearTarget,
  setClearModalOpen,
  setClearPassword,
  setClearError,
  clearModalOpen,
  clearTarget,
  clearPassword,
  clearError,
  clearingDb,
  handleClearDbDataset,
  setImportTonModalOpen,
  // Luong tab
  luongLoading,
  luongList,
  luongSearch,
  setLuongSearch,
  luongTlFilter,
  setLuongTlFilter,
  luongBlockFilter,
  setLuongBlockFilter,
  setPositionModalOpen,
  // SOP Slides tab
  adminLoadingSlides,
  setEditingSlide,
  setAdminSlideModalOpen,
  handleToggleSlideActive,
  handleDeleteSlide,
  setPreviewLoadingModalOpen,
  handleResetLoadingSlides,
  isAdmin,
  canImport,
}) {
  return (
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* HEADER USER BAR */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '16px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(30,41,59,0.25)' }}>
                      <AdminPanelSettingsIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                        Trang Quản Trị Hệ Thống (Admin Panel)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                          Đang đăng nhập: <b>{currentUser?.name || currentUser?.mail}</b> ({currentUser?.mail})
                        </Typography>
                        <Chip
                          label={currentUser?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}
                          size="small"
                          color={currentUser?.role === 'admin' ? 'secondary' : 'primary'}
                          sx={{ fontWeight: 800, height: 22, borderRadius: '6px' }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ borderRadius: '12px', fontWeight: 800, px: 2.5 }}
                  >
                    Đăng Xuất
                  </Button>
                </Paper>

                {/* 5 INTERACTIVE TOPIC ICON ACTION CARDS BAR */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
                    gap: 2
                  }}
                >
                  {[
                    {
                      id: 0,
                      title: '1. HR Nhân Sự',
                      subtitle: 'Danh mục & Hồ sơ nhân sự SG01',
                      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
                      gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      activeColor: '#2563eb',
                      badge: `${hrList.length || 'HR'} HS`
                    },
                    {
                      id: 1,
                      title: '2. Phân Quyền DataBase',
                      subtitle: 'Phân quyền & Tài khoản hệ thống',
                      icon: <VpnKeyIcon sx={{ fontSize: 28 }} />,
                      gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      activeColor: '#7c3aed',
                      badge: `${adminUsers.length || 'User'} Acc`
                    },
                    {
                      id: 2,
                      title: '3. Import Data Base',
                      subtitle: 'Nạp dữ liệu Tồn, Lịch trực, Live KPI',
                      icon: <StorageIcon sx={{ fontSize: 28 }} />,
                      gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                      activeColor: '#ea580c',
                      badge: 'Central Hub'
                    },
                    {
                      id: 3,
                      title: '4. Quản Lý Lương',
                      subtitle: 'Tra cứu HĐLĐ & Tính lương',
                      icon: <SalaryIcon sx={{ fontSize: 28 }} />,
                      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      activeColor: '#059669',
                      badge: 'Lương & HĐ'
                    },
                    {
                      id: 4,
                      title: '5. Quản Lý Lịch Trực',
                      subtitle: 'Chi tiết & Sửa lịch trực 31 ngày',
                      icon: <CalendarMonthIcon sx={{ fontSize: 28 }} />,
                      gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      activeColor: '#0284c7',
                      badge: 'Sửa Lịch Trực'
                    },
                    {
                      id: 5,
                      title: '6. Slide Chờ & Quy Trình',
                      subtitle: 'Cấu hình popup SOP & thông điệp loading',
                      icon: <SpeedIcon sx={{ fontSize: 28 }} />,
                      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                      activeColor: '#0ea5e9',
                      badge: `${adminLoadingSlides.length || 0} Slides`
                    }
                  ].filter((topic) => {
                    // [FIX] Phân quyền: User thường chỉ được xem tab Quản Lý Lương (id=3)
                    // Tất cả tab khác yêu cầu quyền admin hoặc quyền đặc biệt
                    if (!isAdmin) {
                      return topic.id === 3; // Chỉ Quản Lý Lương
                    }
                    // Admin thấy tất cả, ngoại trừ tab Import cần quyền ImportDB
                    if (topic.id === 2 && !canImport) return false;
                    return true;
                  }).map((topic) => {
                    const isSelected = adminSubTab === topic.id;

                    return (
                      <Paper
                        key={topic.id}
                        elevation={0}
                        onClick={() => {
                          setAdminSubTab(topic.id);
                          if (topic.id === 0) fetchAdminHrList();
                          if (topic.id === 1) fetchAdminUsers();
                          if (topic.id === 2) fetchDbCounts();
                          if (topic.id === 3) fetchLuongList();
                          if (topic.id === 4) fetchLichTrucChiTiet();
                          if (topic.id === 5) fetchAdminLoadingSlides();
                        }}
                        sx={{
                          p: 2,
                          borderRadius: 3.5,
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                            border: isSelected ? `2px solid ${topic.activeColor}` : '1px solid #e2e8f0',
                            boxShadow: isSelected ? `0 8px 24px ${topic.activeColor}25` : '0 2px 6px rgba(0,0,0,0.02)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 12px 28px ${topic.activeColor}30`,
                              backgroundColor: '#ffffff'
                            }
                          }}
                        >
                          {isSelected && (
                            <Box sx={{ position: 'absolute', top: 12, right: 12, color: topic.activeColor }}>
                              <CheckCircleOutlineIcon sx={{ fontSize: 24 }} />
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '16px',
                                background: topic.gradient,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 4px 14px ${topic.activeColor}40`
                              }}
                            >
                              {topic.icon}
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isSelected ? topic.activeColor : '#1e293b', lineHeight: 1.2 }}>
                                {topic.title}
                              </Typography>
                              <Chip
                                label={topic.badge}
                                size="small"
                                sx={{
                                  mt: 0.5,
                                  height: 20,
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  backgroundColor: isSelected ? `${topic.activeColor}15` : '#f1f5f9',
                                  color: isSelected ? topic.activeColor : '#64748b'
                                }}
                              />
                            </Box>
                          </Box>

                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block' }}>
                            {topic.subtitle}
                          </Typography>
                        </Paper>
                    );
                  })}
                </Box>

                {/* CONTENT AREA FOR SELECTED TOPIC */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e0e0e0', backgroundColor: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                  
                  {/* TOPIC 0: HR NHÂN SỰ (UNIFIED PROFILE & POSITION BREAKDOWN) */}
                  {adminSubTab === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      
                      {/* STAT METRICS BAR WITH POSITION BREAKDOWN */}
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                            <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 800, textTransform: 'uppercase' }}>Tổng Nhân Sự</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1d4ed8', mt: 0.5 }}>{hrList.length}</Typography>
                            <Button
                              size="small"
                              onClick={() => setPositionModalOpen(true)}
                              sx={{
                                mt: 1,
                                p: 0,
                                fontSize: '12px',
                                fontWeight: 800,
                                color: '#2563eb',
                                textTransform: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                              }}
                            >
                              📊 Chi tiết Chức danh (Cột O) &raquo;
                            </Button>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>Hoạt Động (Cột M - NS Đang làm việc)</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#15803d', mt: 0.5 }}>
                              {hrList.filter(r => {
                                const st = String(r.status || '').toUpperCase();
                                return st.includes('ĐANG LÀM VIỆC') || st.includes('ACTIVE') || st.includes('BÌNH THƯỜNG') || st.includes('CHÍNH THỨC');
                              }).length}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              <Chip
                                label={`Active: ${hrList.filter(r => {
                                  const st = String(r.status || '').toUpperCase();
                                  return st.includes('ĐANG LÀM VIỆC') || st.includes('ACTIVE') || st.includes('BÌNH THƯỜNG') || st.includes('CHÍNH THỨC');
                                }).length}`}
                                color="success" size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 800 }}
                              />
                              <Chip
                                label={`Inactive: ${hrList.length - hrList.filter(r => {
                                  const st = String(r.status || '').toUpperCase();
                                  return st.includes('ĐANG LÀM VIỆC') || st.includes('ACTIVE') || st.includes('BÌNH THƯỜNG') || st.includes('CHÍNH THỨC');
                                }).length}`}
                                color="default" size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 800 }}
                              />
                            </Box>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                            <Typography variant="caption" sx={{ color: '#6b21a8', fontWeight: 800, textTransform: 'uppercase' }}>Số Đội Trưởng</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#7e22ce', mt: 0.5 }}>
                              {new Set(hrList.map(r => r.team_lead).filter(Boolean)).size}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#7e22ce', fontWeight: 600, mt: 1, display: 'block' }}>Đội trưởng điều hành</Typography>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                            <Typography variant="caption" sx={{ color: '#9a3412', fontWeight: 800, textTransform: 'uppercase' }}>Số Block Kỹ Thuật</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#c2410c', mt: 0.5 }}>
                              {new Set(hrList.map(r => r.block).filter(Boolean)).size}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 600, mt: 1, display: 'block' }}>Địa bàn phụ trách</Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* TOOLBAR ACTIONS & FILTERS */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flexGrow: 1, maxWidth: 850 }}>
                          <DebouncedSearchInput
                            size="small"
                            placeholder="Tìm Mã NV, Họ Tên, Inside Acc, Mobisale, Mail, Phone..."
                            value={hrSearch}
                            onChange={(val) => setHrSearch(val)}
                            sx={{ minWidth: 280, flexGrow: 1, '& .MuiInputBase-root': { borderRadius: 2 } }}
                            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} /> }}
                          />
                          <TextField select size="small" value={hrBlockFilter} onChange={(e) => setHrBlockFilter(e.target.value)} sx={{ minWidth: 160, '& .MuiInputBase-root': { borderRadius: 2 } }}>
                            <MenuItem value="__ALL__">-- Tất cả Block --</MenuItem>
                            {options.blocks?.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                          </TextField>
                          <TextField select size="small" value={hrTlFilter} onChange={(e) => setHrTlFilter(e.target.value)} sx={{ minWidth: 170, '& .MuiInputBase-root': { borderRadius: 2 } }}>
                            <MenuItem value="__ALL__">-- Tất cả Đội Trưởng --</MenuItem>
                            {options.team_leads?.map(tl => <MenuItem key={tl} value={tl}>{tl}</MenuItem>)}
                          </TextField>
                          <Button variant="outlined" onClick={fetchAdminHrList} startIcon={<RefreshIcon />} sx={{ borderRadius: 2, fontWeight: 700 }}>
                            Tải Lại
                          </Button>
                        </Box>

                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={() => openUnifiedHrModal(null)}
                          sx={{ borderRadius: 2, fontWeight: 800, px: 2.5 }}
                        >
                          ➕ Thêm Nhân Sự Mới
                        </Button>
                      </Box>

                      {/* STYLED HR DATATABLE */}
                      {hrLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
                      ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, maxHeight: 620 }}>
                          <Table stickyHeader size="small">
                            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                              <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 800, width: 50, backgroundColor: '#f8fafc' }}>STT</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>Mã NV</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>Họ và Tên</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#eef2ff', color: '#3730a3' }}>Inside Account</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Mobisale</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>Số Điện Thoại</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>Block</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>Đội Trưởng</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>Chức Danh</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>Loại HĐ</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, width: 140, backgroundColor: '#f8fafc' }}>Thao Tác</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {hrList.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={12} align="center" sx={{ py: 6, color: '#64748b' }}>
                                    Không tìm thấy dữ liệu nhân sự phù hợp bộ lọc.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                hrList.map((row) => {
                                  const isActive = String(row.status || '').toUpperCase().includes('ĐANG LÀM VIỆC') || String(row.status || '').toUpperCase().includes('ACTIVE') || String(row.status || '').toUpperCase().includes('BÌNH THƯỜNG') || String(row.status || '').toUpperCase().includes('CHÍNH THỨC');
                                  return (
                                    <TableRow key={row.code || row.stt} hover sx={{ '&:nth-of-type(even)': { backgroundColor: '#f8fafc' } }}>
                                      <TableCell align="center" sx={{ color: '#64748b' }}>{row.stt}</TableCell>
                                      <TableCell sx={{ fontWeight: 800, color: '#2563eb' }}>{row.code}</TableCell>
                                      <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>{row.name}</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#3730a3', backgroundColor: 'rgba(238, 242, 255, 0.4)' }}>
                                        {row.account || '-'}
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#1d4ed8', backgroundColor: 'rgba(239, 246, 255, 0.4)' }}>
                                        {row.mobisale || '-'}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '12px' }}>{row.mail}</TableCell>
                                      <TableCell sx={{ fontSize: '12px' }}>{row.phone}</TableCell>
                                      <TableCell sx={{ fontSize: '12px' }}>
                                        {row.team_lead === 'Chưa xác nhận' ? (
                                          <Chip label="⚠️ Chưa xác nhận" size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }} />
                                        ) : (
                                          row.team_lead
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '12px' }}>{row.title}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={row.status || 'NS Đang làm việc'}
                                          size="small"
                                          color={isActive ? 'success' : 'default'}
                                          sx={{ height: 20, fontSize: '10px', fontWeight: 800 }}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                          <Tooltip title="Xem & Chỉnh Sửa Hồ Sơ HR (Gộp làm 1)">
                                            <IconButton
                                              size="small"
                                              color="primary"
                                              onClick={() => openUnifiedHrModal(row.code || row.account)}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Xóa Nhân Sự">
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={() => {
                                                setHrToDelete(row);
                                                setHrDeleteModalOpen(true);
                                              }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}

                  {/* TOPIC 1: TRANG QUẢN TRỊ USER (SHEET ADMIN FULL 9 COLUMNS) */}
                  {adminSubTab === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1e293b' }}>
                            🔑 Bảng Quản Lý Tài Khoản User & Phân Quyền (DataBase Admin)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Hệ Thống Quản Trị Dữ Liệu Phân Quyền (DataBase)
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<SaveIcon />}
                            onClick={handleSyncSheetNow}
                            sx={{ borderRadius: 2, fontWeight: 800, px: 2.5, backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' } }}
                          >
                            ☁️ Sao Lưu & Đồng Bộ DataBase
                          </Button>

                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setEditingUser(null);
                              setUserForm({ msnv: '', name: '', mail: '', user: '', password: '', role: 'user', status: 'Active', allowed_apps: ['Salary'] });
                              setUserModalOpen(true);
                            }}
                            sx={{ borderRadius: 2, fontWeight: 800 }}
                          >
                            ➕ Thêm User Mới
                          </Button>
                        </Box>
                      </Box>

                      {adminUsersLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
                      ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, maxHeight: 600 }}>
                          <Table stickyHeader size="small">
                            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                              <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 800, width: 50 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>MSNV</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Họ và Tên</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Mail Login</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>User (Mật danh)</TableCell>
                                <TableCell sx={{ fontWeight: 800, width: 120 }}>Mật Khẩu</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800 }}>Quyền</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Ứng Dụng Được Xem (RBAC)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800 }}>Trạng Thái</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, width: 100 }}>Thao Tác</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {adminUsers.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={10} align="center" sx={{ py: 4, color: '#64748b' }}>Chưa có tài khoản người dùng nào.</TableCell>
                                </TableRow>
                              ) : (
                                adminUsers.map((row) => {
                                  const allowedList = Array.isArray(row.allowed_apps)
                                    ? row.allowed_apps
                                    : (typeof row.allowed_apps === 'string' ? row.allowed_apps.split(/[;,]/) : (row.role === 'admin' ? ['All'] : ['Salary']));
                                  const isUserActive = String(row.status || 'Active').toLowerCase() === 'active';

                                  return (
                                    <TableRow key={row.id || row.mail} hover>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>{row.id}</TableCell>
                                      <TableCell sx={{ fontWeight: 800, color: '#2563eb' }}>{row.msnv || '-'}</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{row.name}</TableCell>
                                      <TableCell sx={{ fontSize: '13px' }}>{row.mail}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{row.user}</TableCell>
                                      <TableCell sx={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <span>{showPasswords[row.id] ? row.password : '••••••••'}</span>
                                          <IconButton size="small" onClick={() => toggleShowPassword(row.id)}>
                                            {showPasswords[row.id] ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <ViewIcon sx={{ fontSize: 16 }} />}
                                          </IconButton>
                                        </Box>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={row.role === 'admin' ? 'ADMIN' : 'USER'}
                                          color={row.role === 'admin' ? 'secondary' : 'default'}
                                          size="small"
                                          sx={{ fontWeight: 800, height: 22 }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {allowedList.map((app) => (
                                            <Chip
                                              key={app}
                                              label={app.toUpperCase()}
                                              size="small"
                                              sx={{ height: 18, fontSize: '9px', fontWeight: 800, backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                                            />
                                          ))}
                                        </Box>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={(row.status || 'Active').toUpperCase()}
                                          color={isUserActive ? 'success' : 'error'}
                                          size="small"
                                          sx={{ fontWeight: 800, height: 22 }}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => {
                                              setEditingUser(row);
                                              setUserForm({
                                                msnv: row.msnv,
                                                name: row.name,
                                                mail: row.mail,
                                                user: row.user,
                                                password: row.password || '',
                                                role: row.role,
                                                status: row.status || 'Active',
                                                allowed_apps: Array.isArray(row.allowed_apps) ? row.allowed_apps : (typeof row.allowed_apps === 'string' ? row.allowed_apps.split(/[;,]/) : ['Salary'])
                                              });
                                              setUserModalOpen(true);
                                            }}
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            color="error"
                                            disabled={row.mail === 'phuongnam.phongnh5@fpt.net'}
                                            onClick={() => {
                                              setUserToDelete(row);
                                              setDeleteConfirmOpen(true);
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}

                  {/* TOPIC 2: IMPORT DATA BASE */}
                  {adminSubTab === 2 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StorageIcon sx={{ color: '#2563eb' }} /> Trung Tâm Quản Trị Import & Đồng Bộ Data Base
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                            Nạp và cập nhật dữ liệu từ file Excel / CSV vào hệ thống. Quy tắc lọc trùng thông minh (không ghi đè data cũ, nạp thêm dòng mới).
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={fetchDbCounts}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                          >
                            Làm mới số lượng DB
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => {
                              setClearTarget(importTarget);
                              setClearPassword('');
                              setClearError(null);
                              setClearModalOpen(true);
                            }}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                          >
                            Xóa Sạch [{importTarget === 'kh_cls' ? 'KH Có Cls' : importTarget === 'cll30n' ? 'CLL30N' : importTarget === 'tk' ? 'Data TK' : importTarget === 'bt' ? 'Data BT' : importTarget === 'ton_tk' ? 'Tồn TK' : 'Tồn BT'}] Để Import Lại
                          </Button>
                        </Box>
                      </Box>

                      {/* 1. SELECT DATASET CARDS */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155' }}>
                        1. ĐỐI TƯỢNG DATASET CẦN IMPORT
                      </Typography>
                      <Grid container spacing={2}>
                        {[
                          {
                            id: 'kh_cls',
                            title: 'KH Có Cls',
                            sheetInfo: 'Kho Data Base: kh_cls',
                            count: dbCounts.kh_cls || 0,
                            color: '#2563eb',
                            bg: '#eff6ff',
                            desc: 'Danh sách KH có chỉ số chất lượng / CLS'
                          },
                          {
                            id: 'cll30n',
                            title: 'CLL30N (CLL30)',
                            sheetInfo: 'Kho Data Base: cll30n',
                            count: dbCounts.cll30n || 0,
                            color: '#7c3aed',
                            bg: '#f5f3ff',
                            desc: 'Danh sách phiếu CLL30N chất lượng kém'
                          },
                          {
                            id: 'tk',
                            title: 'Data Triển Khai',
                            sheetInfo: 'Kho Data Base: tk',
                            count: dbCounts.tk || 0,
                            color: '#0d9488',
                            bg: '#f0fdfa',
                            desc: 'Dữ liệu tổng hợp phiếu PTC Triển Khai'
                          },
                          {
                            id: 'bt',
                            title: 'Data Bảo Trì',
                            sheetInfo: 'Kho Data Base: bt',
                            count: dbCounts.bt || 0,
                            color: '#d97706',
                            bg: '#fffbeb',
                            desc: 'Dữ liệu tổng hợp phiếu PTC Bảo Trì'
                          },
                          {
                            id: 'ton_tk',
                            title: 'Tồn Triển Khai',
                            sheetInfo: 'Kho Data Base: ton_tk',
                            count: dbCounts.ton_tk || 0,
                            color: '#059669',
                            bg: '#ecfdf5',
                            desc: 'Phiếu tồn Triển Khai đang xử lý'
                          },
                          {
                            id: 'ton_bt',
                            title: 'Tồn Bảo Trì',
                            sheetInfo: 'Kho Data Base: ton_bt',
                            count: dbCounts.ton_bt || 0,
                            color: '#ea580c',
                            bg: '#fff7ed',
                            desc: 'Phiếu tồn Bảo Trì đang xử lý'
                          }
                        ].map((item) => {
                          const selected = importTarget === item.id;
                          return (
                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                              <Paper
                                elevation={0}
                                onClick={() => { setImportTarget(item.id); setDbResult(null); }}
                                sx={{
                                  p: 2.5,
                                  borderRadius: 3,
                                  cursor: 'pointer',
                                  border: selected ? `2px solid ${item.color}` : '1px solid #e2e8f0',
                                  backgroundColor: selected ? item.bg : '#ffffff',
                                  transition: 'all 0.2s ease-in-out',
                                  boxShadow: selected ? `0 4px 14px ${item.color}25` : 'none',
                                  '&:hover': {
                                    borderColor: item.color,
                                    transform: 'translateY(-2px)'
                                  }
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: selected ? item.color : '#1e293b' }}>
                                    {item.title}
                                  </Typography>
                                  {selected && (
                                    <Chip label="Đang chọn" size="small" sx={{ backgroundColor: item.color, color: '#fff', fontWeight: 800, height: 20, fontSize: '0.7rem' }} />
                                  )}
                                </Box>
                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5, fontSize: '0.75rem' }}>
                                  {item.desc}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #f1f5f9' }}>
                                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                    {item.sheetInfo}
                                  </Typography>
                                  <Chip
                                    label={`${((item.count ?? 0)).toLocaleString()} dòng`}
                                    size="small"
                                    sx={{
                                      fontWeight: 800,
                                      backgroundColor: selected ? item.color : '#f1f5f9',
                                      color: selected ? '#fff' : '#475569'
                                    }}
                                  />
                                </Box>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>

                      {/* 2. RULE & UPLOAD CARD */}
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 2 }}>
                          2. CẤU HÌNH & TẢI FILE IMPORT [{importTarget === 'kh_cls' ? 'KH Có Cls' : importTarget === 'cll30n' ? 'CLL30N' : importTarget === 'tk' ? 'Data Triển Khai' : importTarget === 'bt' ? 'Data Bảo Trì' : importTarget === 'ton_tk' ? 'Tồn Triển Khai' : 'Tồn Bảo Trì'}]
                        </Typography>

                        <Grid container spacing={3}>
                          {/* Rule Selector */}
                          <Grid item xs={12} md={5}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1 }}>
                              Quy tắc xử lý dữ liệu trùng (Deduplication Rule):
                            </Typography>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                              <FormControl component="fieldset">
                                <RadioGroup
                                  value={importRule}
                                  onChange={(e) => setImportRule(e.target.value)}
                                >
                                  <FormControlLabel
                                    value="MERGE_NO_OVERWRITE"
                                    control={<Radio size="small" color="primary" />}
                                    label={
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                          🛡️ Giữ nguyên data cũ - Chỉ nạp dòng mới (Mặc định)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                          Nếu dòng đã tồn tại trong Data Base thì KHÔNG ghi đè. Nếu chưa có thì import thêm vào.
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </RadioGroup>
                              </FormControl>
                            </Paper>
                            <Alert severity="info" sx={{ mt: 2, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
                              Khóa xác định trùng lặp ({importTarget === 'kh_cls' || importTarget === 'cll30n' || importTarget === 'tk' || importTarget === 'bt' ? 'Số HĐ + Nhân viên + Ngày hoàn tất' : 'Số HĐ'}).
                            </Alert>
                          </Grid>

                          {/* File Drop & Submit */}
                          <Grid item xs={12} md={7}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', mb: 1 }}>
                              Chọn File Excel (.xlsx, .xls) hoặc CSV:
                            </Typography>

                            <input
                              type="file"
                              accept=".xlsx, .xls, .csv"
                              ref={dbInputRef}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setDbFile(e.target.files[0]);
                                  setDbResult(null);
                                }
                              }}
                            />

                            <Box
                              onClick={() => dbInputRef.current && dbInputRef.current.click()}
                              sx={{
                                p: 3,
                                borderRadius: 2.5,
                                border: '2px dashed #93c5fd',
                                backgroundColor: '#eff6ff',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: '#2563eb',
                                  backgroundColor: '#dbeafe'
                                }
                              }}
                            >
                              <FileUploadIcon sx={{ fontSize: 36, color: '#2563eb', mb: 1 }} />
                              {dbFile ? (
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                    📄 {dbFile.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                                    Dung lượng: {(dbFile.size / 1024).toFixed(1)} KB — Nhấn để chọn file khác
                                  </Typography>
                                </Box>
                              ) : (
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                    Nhấp vào đây để chọn file Excel / CSV
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    Hỗ trợ định dạng .xlsx, .xls, .csv
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                              {dbFile && (
                                <Button
                                  variant="outlined"
                                  color="inherit"
                                  size="medium"
                                  onClick={() => {
                                    setDbFile(null);
                                    if (dbInputRef.current) dbInputRef.current.value = '';
                                  }}
                                  sx={{ borderRadius: 2, fontWeight: 700 }}
                                >
                                  Hủy file
                                </Button>
                              )}
                              <Button
                                variant="contained"
                                color="primary"
                                size="medium"
                                disabled={!dbFile || dbUploading}
                                onClick={handleImportDbDataset}
                                startIcon={dbUploading ? <CircularProgress size={20} color="inherit" /> : <FileUploadIcon />}
                                sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
                              >
                                {dbUploading ? 'Đang Xử Lý Import...' : 'Bắt Đầu Import Nạp Data'}
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* 3. RESULT SUMMARY DISPLAY */}
                        {dbResult && (
                          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e2e8f0' }}>
                            {dbResult.success ? (
                              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #a7f3d0', backgroundColor: '#ecfdf5' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#047857', mb: 2 }}>
                                  <CheckCircleIcon sx={{ fontSize: 28 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                    🎉 {dbResult.message}
                                  </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                  <Grid item xs={6} sm={3}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', border: '1px solid #6ee7b7', backgroundColor: '#ffffff' }}>
                                      <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700, display: 'block' }}>
                                        NẠP MỚI THÀNH CÔNG
                                      </Typography>
                                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', mt: 0.5 }}>
                                        +{(dbResult.added ?? 0).toLocaleString()}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>dòng</Typography>
                                    </Paper>
                                  </Grid>

                                  <Grid item xs={6} sm={3}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', border: '1px solid #fde68a', backgroundColor: '#ffffff' }}>
                                      <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 700, display: 'block' }}>
                                        TRÙNG LẶP (GIỮ NGUYÊN)
                                      </Typography>
                                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#d97706', mt: 0.5 }}>
                                        {(dbResult.skipped ?? 0).toLocaleString()}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>dòng không ghi đè</Typography>
                                    </Paper>
                                  </Grid>

                                  <Grid item xs={6} sm={3}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
                                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block' }}>
                                        TỔNG FILE UPLOAD
                                      </Typography>
                                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b', mt: 0.5 }}>
                                        {(dbResult.total ?? 0).toLocaleString()}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>dòng</Typography>
                                    </Paper>
                                  </Grid>

                                  <Grid item xs={6} sm={3}>
                                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', border: '1px solid #bfdbfe', backgroundColor: '#ffffff' }}>
                                      <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, display: 'block' }}>
                                        TỔNG KHO DB HỆ THỐNG
                                      </Typography>
                                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#2563eb', mt: 0.5 }}>
                                        {(dbResult.db_total ?? 0).toLocaleString()}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>dòng hiện tại</Typography>
                                    </Paper>
                                  </Grid>
                                </Grid>
                              </Paper>
                            ) : (
                              <Alert severity="error" sx={{ borderRadius: 2 }}>
                                ❌ {dbResult.message}
                              </Alert>
                            )}
                          </Box>
                        )}
                      </Paper>

                      {/* QUICK ACTIONS TOOLKIT */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mt: 1 }}>
                        3. CÁC CÔNG CỤ ĐỒNG BỘ NẠP DATA KHÁC
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5, '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.06)' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#2563eb' }}>
                              <PendingActionsIcon />
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Tồn TK-BT (Data Base)</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>Import file CSV/Excel danh sách phiếu tồn Triển Khai và Bảo Trì mới nhất.</Typography>
                            <Button variant="contained" size="small" startIcon={<FileUploadIcon />} onClick={() => setImportTonModalOpen(true)} sx={{ borderRadius: 2, fontWeight: 700, mt: 1 }}>
                              Import Tồn TK-BT
                            </Button>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5, '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.06)' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#166534' }}>
                              <CalendarMonthIcon />
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Lịch Trực Ca</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>Import file CSV lịch phân ca kỹ thuật tháng hiện tại để tính tỉ lệ trực.</Typography>
                            <Button variant="contained" color="success" size="small" startIcon={<FileUploadIcon />} onClick={() => importInputRef.current && importInputRef.current.click()} sx={{ borderRadius: 2, fontWeight: 700, mt: 1 }}>
                              Import Lịch Trực
                            </Button>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5, '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.06)' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#7c3aed' }}>
                              <BarChartIcon />
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>KPIs Live Sync</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>Cập nhật lại dữ liệu từ Data Base KPI Triển Khai & Bảo Trì.</Typography>
                            <Button variant="contained" color="secondary" size="small" startIcon={<RefreshIcon />} onClick={handleTriggerSync} disabled={syncing} sx={{ borderRadius: 2, fontWeight: 700, mt: 1 }}>
                              {syncing ? 'Đang Đồng Bộ...' : 'Đồng Bộ Live KPI'}
                            </Button>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5, '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.06)' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ea580c' }}>
                              <PeopleIcon />
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>HR Nhân Sự Data</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>Nạp lại bảng danh mục nhân sự và danh sách Đội trưởng / Block.</Typography>
                            <Button variant="outlined" color="warning" size="small" startIcon={<RefreshIcon />} onClick={fetchAdminHrList} sx={{ borderRadius: 2, fontWeight: 700, mt: 1 }}>
                              Nạp Lại HR Data
                            </Button>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* DIALOG XÁC NHẬN XÓA DATASET */}
                      <Dialog open={clearModalOpen} onClose={() => !clearingDb && setClearModalOpen(false)} maxWidth="xs" fullWidth>
                        <DialogTitle sx={{ fontWeight: 900, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon color="error" /> Xác Nhận Xóa Dữ Liệu Import
                        </DialogTitle>
                        <form onSubmit={handleClearDbDataset}>
                          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                              ⚠️ Bạn đang chọn xóa sạch toàn bộ dữ liệu <strong>[{clearTarget === 'kh_cls' ? 'KH Có Cls' : clearTarget === 'cll30n' ? 'CLL30N' : clearTarget === 'tk' ? 'Data Triển Khai' : clearTarget === 'bt' ? 'Data Bảo Trì' : clearTarget === 'ton_tk' ? 'Tồn Triển Khai' : clearTarget === 'ton_bt' ? 'Tồn Bảo Trì' : 'Tất Cả Dataset'}]</strong> trong Kho Data Base hiện tại để tiến hành nạp lại từ đầu.
                            </Alert>

                            {clearError && (
                              <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {clearError}
                              </Alert>
                            )}

                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                              Nhập mật khẩu xác nhận Quản trị viên để tiến hành xóa:
                            </Typography>

                            <TextField
                              type="password"
                              label="Mật Khẩu Xác Nhận"
                              placeholder="Nhập mật khẩu xác nhận..."
                              fullWidth
                              required
                              value={clearPassword}
                              onChange={(e) => setClearPassword(e.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </DialogContent>
                          <DialogActions sx={{ px: 3, pb: 2.5 }}>
                            <Button onClick={() => setClearModalOpen(false)} disabled={clearingDb} variant="outlined" color="inherit" sx={{ borderRadius: 2, fontWeight: 700 }}>
                              Hủy bỏ
                            </Button>
                            <Button type="submit" disabled={clearingDb || !clearPassword} variant="contained" color="error" sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}>
                              {clearingDb ? 'Đang Xóa Data...' : 'Xác Nhận Xóa Data'}
                            </Button>
                          </DialogActions>
                        </form>
                      </Dialog>
                    </Box>
                  )}

                  {/* TOPIC 3: QUẢN LÝ LƯƠNG & HỢP ĐỒNG LƯƠNG */}
                  {adminSubTab === 3 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#047857' }}>
                          💵 Tra Cứu Quản Lý Lương & Loại Hợp Đồng Nhân Sự (Payroll & Contracts)
                        </Typography>
                        <Chip label={`${luongList.length} Nhân Sự`} color="success" sx={{ fontWeight: 800 }} />
                      </Box>

                      {/* FILTER BAR FOR LƯƠNG */}
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <DebouncedSearchInput
                            fullWidth
                            size="small"
                            placeholder="Tìm kiếm Mã NV, Họ Tên, Inside Acc, Mobisale..."
                            value={luongSearch}
                            onChange={(val) => setLuongSearch(val)}
                            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} /> }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField select fullWidth size="small" value={luongBlockFilter} onChange={(e) => setLuongBlockFilter(e.target.value)} label="Lọc Block">
                            <MenuItem value="__ALL__">-- Tất cả Block --</MenuItem>
                            {options.blocks?.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField select fullWidth size="small" value={luongTlFilter} onChange={(e) => setLuongTlFilter(e.target.value)} label="Lọc Đội Trưởng">
                            <MenuItem value="__ALL__">-- Tất cả Đội Trưởng --</MenuItem>
                            {options.team_leads?.map(tl => <MenuItem key={tl} value={tl}>{tl}</MenuItem>)}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <Button variant="contained" color="success" fullWidth onClick={fetchLuongList} startIcon={<RefreshIcon />} sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}>
                            Tải Lại
                          </Button>
                        </Grid>
                      </Grid>

                      {/* LƯƠNG TABLE */}
                      {luongLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
                      ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, maxHeight: 600 }}>
                          <Table stickyHeader size="small">
                            <TableHead sx={{ backgroundColor: '#f0fdf4' }}>
                              <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 800, width: 50, backgroundColor: '#f0fdf4' }}>STT</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f0fdf4' }}>Mã NV</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f0fdf4' }}>Họ và Tên</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#eef2ff', color: '#3730a3' }}>Inside Account</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Mobisale</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f0fdf4' }}>Block</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f0fdf4' }}>Đội Trưởng</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f0fdf4' }}>Loại HĐLĐ</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d' }}>Tính Lương</TableCell>
                                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f0fdf4' }}>Phân Công</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {luongList.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: '#64748b' }}>Không tìm thấy thông tin lương nhân sự phù hợp.</TableCell>
                                </TableRow>
                              ) : (
                                luongList.map((row) => (
                                  <TableRow key={row.stt} hover sx={{ '&:nth-of-type(even)': { backgroundColor: '#f8fafc' } }}>
                                    <TableCell align="center" sx={{ color: '#64748b' }}>{row.stt}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#059669' }}>{row.code}</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>{row.name}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#3730a3' }}>{row.account || '-'}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1d4ed8' }}>{row.mobisale || '-'}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{row.block}</TableCell>
                                    <TableCell sx={{ fontSize: '12px' }}>{row.team_lead}</TableCell>
                                    <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>{row.contract_type || '-'}</TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={row.calc_salary || 'Có tính'}
                                        size="small"
                                        color={row.calc_salary?.toLowerCase().includes('không') ? 'error' : 'success'}
                                        sx={{ height: 20, fontSize: '10px', fontWeight: 800 }}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '12px' }}>{row.assignment || '-'}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}

                  {/* TOPIC 4: QUẢN LÝ LỊCH TRỰC (FULL EDITABLE & IMPORT) */}
                  {adminSubTab === 4 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0284c7' }}>
                            📅 Quản Lý & Chỉnh Sửa Lịch Trực Kỹ Thuật (Admin Control)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Dành riêng cho Quản trị viên: Cho phép Thêm, Sửa, Xóa, Import CSV lịch trực 31 ngày của kỹ thuật viên.
                          </Typography>
                        </Box>
                      </Box>

                      {renderLichTrucChiTiet(true)}
                    </Box>
                  )}

                  {/* TOPIC 5: QUẢN LÝ SLIDE CHỜ (SOP LOADING BANNER) */}
                  {adminSubTab === 5 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0ea5e9' }}>
                            🚀 Quản Lý Slide Chờ & Quy Trình SOP Kỹ Thuật (Loading Banner)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Các slide này luân phiên hiển thị sinh động trong 20-30 giây đầu khi người dùng mở app và nạp dữ liệu, giúp truyền tải tiêu chuẩn FPT SG01.
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => setPreviewLoadingModalOpen(true)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: '#0ea5e9', color: '#0284c7' }}
                          >
                            👁️ Xem Thử Màn Hình Chờ
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            startIcon={<RefreshIcon />}
                            onClick={handleResetLoadingSlides}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                          >
                            Khôi Phục Mặc Định
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setEditingSlide(null);
                              setAdminSlideModalOpen(true);
                            }}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                              boxShadow: '0 4px 12px rgba(14,165,233,0.35)'
                            }}
                          >
                            ➕ Thêm Slide Mới
                          </Button>
                        </Box>
                      </Box>

                      {/* Slides Grid */}
                      <Grid container spacing={2}>
                        {adminLoadingSlides.map((slide, idx) => (
                          <Grid item xs={12} md={6} key={slide.id || idx}>
                            <Card
                              elevation={0}
                              sx={{
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: slide.is_active === false ? '#e2e8f0' : `${slide.badgeColor || '#0284c7'}50`,
                                opacity: slide.is_active === false ? 0.6 : 1,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <Box sx={{
                                p: 2,
                                background: slide.colorGradient || 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                color: '#fff',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={slide.tag || 'SOP'}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(255,255,255,0.25)',
                                      color: '#fff',
                                      fontWeight: 800,
                                      backdropFilter: 'blur(4px)'
                                    }}
                                  />
                                  <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.9 }}>
                                    {slide.category || ''}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Switch
                                    size="small"
                                    checked={slide.is_active !== false}
                                    onChange={() => handleToggleSlideActive(slide.id)}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#22c55e' },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#22c55e' }
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingSlide(slide);
                                      setAdminSlideModalOpen(true);
                                    }}
                                    sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.15)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteSlide(slide.id)}
                                    sx={{ color: '#fca5a5', backgroundColor: 'rgba(239,68,68,0.2)', '&:hover': { backgroundColor: 'rgba(239,68,68,0.4)' } }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>

                              <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', mb: 0.8 }}>
                                  {slide.title}
                                </Typography>

                                {slide.target && (
                                  <Box sx={{
                                    display: 'inline-block',
                                    backgroundColor: '#f1f5f9',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1.5,
                                    borderLeft: `4px solid ${slide.badgeColor || '#0284c7'}`,
                                    mb: 1.5
                                  }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155' }}>
                                      🎯 {slide.target}
                                    </Typography>
                                  </Box>
                                )}

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mb: 1.5 }}>
                                  {(slide.steps || []).slice(0, 3).map((step, sIdx) => (
                                    <Typography key={sIdx} variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                                      {step}
                                    </Typography>
                                  ))}
                                  {(slide.steps || []).length > 3 && (
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                      + {(slide.steps || []).length - 3} bước khác...
                                    </Typography>
                                  )}
                                </Box>

                                {slide.note && (
                                  <Box sx={{
                                    backgroundColor: '#fffbeb',
                                    border: '1px dashed #fcd34d',
                                    borderRadius: 2,
                                    p: 1.2
                                  }}>
                                    <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600, display: 'block' }}>
                                      {slide.note}
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                </Paper>
              </Box>
  );
}
