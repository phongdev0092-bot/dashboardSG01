import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Divider,
  Avatar,
  Stack
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FileDownload as DownloadIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  BuildCircle as BuildCircleIcon,
  Router as RouterIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ImagePreviewModal from './ImagePreviewModal';

// Helper for default date calculation: First day of current month -> Today
const getInitialGiaCoDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmt = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  return {
    start: fmt(firstDay),
    end: fmt(now)
  };
};

export default function GiaCoModemDashboard() {
  const initialDates = useMemo(() => getInitialGiaCoDates(), []);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    summary: {
      total_contracts: 0,
      all_time_contracts: 0,
      unique_employees: 0,
      unique_team_leads: 0,
      today_contracts: 0,
      this_month_contracts: 0,
      has_image_contracts: 0
    },
    filter_options: {
      team_leads: [],
      employees: []
    },
    last_sync_time: null,
    rows: []
  });

  // Filter States - Default from day 1 to today
  const [selectedTeamLead, setSelectedTeamLead] = useState('__ALL__');
  const [selectedEmployee, setSelectedEmployee] = useState('__ALL__');
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('this_month');

  // Table pagination & sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [copiedId, setCopiedId] = useState(null);

  // Image Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Fetch Data Function
  const fetchData = async (force = false) => {
    setLoading(true);
    try {
      const params = {};
      if (force) params.force = true;
      if (selectedTeamLead && selectedTeamLead !== '__ALL__') params.team_lead = selectedTeamLead;
      if (selectedEmployee && selectedEmployee !== '__ALL__') params.employee = selectedEmployee;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get('/api/gia-co-modem/data', { params });
      if (res.data && res.data.ok) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Gia Cố Modem:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTeamLead, selectedEmployee, startDate, endDate, searchQuery]);

  // Handle Date Presets
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const fmt = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (preset === 'today') {
      const todayStr = fmt(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'last7') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      setStartDate(fmt(past));
      setEndDate(fmt(now));
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(fmt(firstDay));
      setEndDate(fmt(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleResetFilters = () => {
    setSelectedTeamLead('__ALL__');
    setSelectedEmployee('__ALL__');
    setStartDate(initialDates.start);
    setEndDate(initialDates.end);
    setSearchQuery('');
    setDatePreset('this_month');
    setPage(0);
  };

  // Filter employees dropdown based on selected Team Lead
  const availableEmployees = useMemo(() => {
    const list = data?.filter_options?.employees || [];
    if (!selectedTeamLead || selectedTeamLead === '__ALL__') {
      return list;
    }
    return list.filter((emp) => emp.team_lead === selectedTeamLead);
  }, [data?.filter_options?.employees, selectedTeamLead]);

  // Copy Contract Number to clipboard
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Open Image Modal
  const handleOpenImagePreview = (contract) => {
    setSelectedContract(contract);
    setPreviewModalOpen(true);
  };

  // Export Excel
  const handleExportExcel = () => {
    const rowsToExport = data.rows || [];
    if (rowsToExport.length === 0) {
      alert('Không có dữ liệu để xuất Excel!');
      return;
    }

    const exportData = rowsToExport.map((r, i) => ({
      'STT': i + 1,
      'ID': r.id,
      'Số Hợp Đồng': r.so_hd,
      'MSNV': r.msnv,
      'Họ Tên Nhân Viên': r.name,
      'Inside Account': r.inside_account,
      'Đội Trưởng': r.team_lead,
      'Block': r.block,
      'Email': r.mail,
      'Ngày Cập Nhật': r.formatted_date || r.raw_date,
      'Số Lượng Ảnh': r.image_count,
      'Link Ảnh Gốc': r.raw_image
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gia_Co_Modem');
    XLSX.writeFile(wb, `Bao_Cao_Gia_Co_Modem_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Pagination slice
  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return (data.rows || []).slice(start, start + rowsPerPage);
  }, [data.rows, page, rowsPerPage]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER TITLE & ACTION BAR */}
      {/* ========================================================================= */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          backgroundColor: '#ffffff',
          border: '1px solid #e8eaed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
          <Avatar
            sx={{
              backgroundColor: '#e8f0fe',
              color: '#1a73e8',
              width: 48,
              height: 48,
              borderRadius: 2.5
            }}
          >
            <RouterIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a73e8', letterSpacing: '-0.3px' }}>
                DASHBOARD GIA CỐ MODEM
              </Typography>
              <Chip
                label="Dữ liệu Google Sheet"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 22, fontSize: '11px', fontWeight: 700 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#5f6368', mt: 0.2 }}>
              Theo dõi và quản lý dữ liệu tiến độ gia cố hợp đồng modem kỹ thuật SG01
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {data.last_sync_time && (
            <Typography variant="caption" sx={{ color: '#70757a', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
              🔄 Cập nhật: <strong>{data.last_sync_time}</strong>
            </Typography>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              borderColor: '#dadce0',
              color: '#3c4043'
            }}
          >
            Xuất Excel
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={() => fetchData(true)}
            disabled={loading}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
              backgroundColor: '#1a73e8',
              '&:hover': { backgroundColor: '#1557b0' }
            }}
          >
            {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
          </Button>
        </Stack>
      </Paper>

      {/* ========================================================================= */}
      {/* 2. OVERVIEW METRICS CARDS (TỔNG QUAN) */}
      {/* ========================================================================= */}
      <Grid container spacing={2}>
        {/* Total Contracts */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 3,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderLeft: '5px solid #1a73e8',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(26,115,232,0.12)'
              }
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#5f6368', letterSpacing: '0.5px' }}>
                  HỢP ĐỒNG ĐÃ GIA CỐ
                </Typography>
                <Avatar sx={{ backgroundColor: '#e8f0fe', color: '#1a73e8', width: 34, height: 34 }}>
                  <RouterIcon sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a73e8', lineHeight: 1 }}>
                {data?.summary?.total_contracts?.toLocaleString('vi-VN') || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#70757a', mt: 0.8, display: 'block' }}>
                Tổng toàn bộ: <strong>{data?.summary?.all_time_contracts || 0}</strong> phiếu ghi nhận
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Technicians / Employees */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 3,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderLeft: '5px solid #00897b',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,137,123,0.12)'
              }
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#5f6368', letterSpacing: '0.5px' }}>
                  NHÂN SỰ THỰC HIỆN
                </Typography>
                <Avatar sx={{ backgroundColor: '#e0f2f1', color: '#00897b', width: 34, height: 34 }}>
                  <PersonIcon sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#00897b', lineHeight: 1 }}>
                {data?.summary?.unique_employees?.toLocaleString('vi-VN') || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#70757a', mt: 0.8, display: 'block' }}>
                Kỹ thuật viên đã hoàn tất gia cố
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Leads Involved */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 3,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderLeft: '5px solid #f26522',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(242,101,34,0.12)'
              }
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#5f6368', letterSpacing: '0.5px' }}>
                  ĐỘI TRƯỞNG PHỤ TRÁCH
                </Typography>
                <Avatar sx={{ backgroundColor: '#fff3e0', color: '#f26522', width: 34, height: 34 }}>
                  <GroupIcon sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#f26522', lineHeight: 1 }}>
                {data?.summary?.unique_team_leads?.toLocaleString('vi-VN') || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#70757a', mt: 0.8, display: 'block' }}>
                Đội có phát sinh hợp đồng gia cố
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Time Progress (Today & This Month) */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 3,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderLeft: '5px solid #7c4dff',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(124,77,255,0.12)'
              }
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#5f6368', letterSpacing: '0.5px' }}>
                  TIẾN ĐỘ THÁNG NÀY
                </Typography>
                <Avatar sx={{ backgroundColor: '#ede7f6', color: '#7c4dff', width: 34, height: 34 }}>
                  <CalendarIcon sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#7c4dff', lineHeight: 1 }}>
                {data?.summary?.this_month_contracts?.toLocaleString('vi-VN') || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#70757a', mt: 0.8, display: 'block' }}>
                Hôm nay: <strong>{data?.summary?.today_contracts || 0}</strong> | Có ảnh: <strong>{data?.summary?.has_image_contracts || 0}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ========================================================================= */}
      {/* 3. BỘ LỌC (FILTERS TOOLBAR) */}
      {/* ========================================================================= */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          backgroundColor: '#ffffff',
          border: '1px solid #e8eaed'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterIcon sx={{ color: '#1a73e8', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#202124' }}>
            BỘ LỌC TÌM KIẾM & PHÂN LOẠI
          </Typography>
        </Box>

        {/* Date Presets Chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368', mr: 0.5 }}>
            Khoảng thời gian:
          </Typography>
          {[
            { id: 'all', label: 'Tất cả thời gian' },
            { id: 'today', label: 'Hôm nay' },
            { id: 'last7', label: '7 ngày qua' },
            { id: 'this_month', label: 'Tháng này' }
          ].map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              size="small"
              clickable
              color={datePreset === item.id ? 'primary' : 'default'}
              variant={datePreset === item.id ? 'filled' : 'outlined'}
              onClick={() => handleDatePreset(item.id)}
              sx={{ fontWeight: datePreset === item.id ? 800 : 500, borderRadius: 2 }}
            />
          ))}
        </Box>

        <Grid container spacing={2} alignItems="center">
          {/* 1. Lọc Đội Trưởng */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="select-team-lead-label">Đội trưởng</InputLabel>
              <Select
                labelId="select-team-lead-label"
                value={selectedTeamLead}
                label="Đội trưởng"
                onChange={(e) => {
                  setSelectedTeamLead(e.target.value);
                  setSelectedEmployee('__ALL__');
                  setPage(0);
                }}
              >
                <MenuItem value="__ALL__">
                  <em>Tất cả Đội trưởng</em>
                </MenuItem>
                {(data?.filter_options?.team_leads || []).map((tl) => (
                  <MenuItem key={tl} value={tl}>
                    {tl}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 2. Lọc Nhân Viên */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="select-employee-label">Nhân viên thực hiện</InputLabel>
              <Select
                labelId="select-employee-label"
                value={selectedEmployee}
                label="Nhân viên thực hiện"
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="__ALL__">
                  <em>Tất cả nhân viên</em>
                </MenuItem>
                {availableEmployees.map((emp) => (
                  <MenuItem key={emp.account || emp.msnv} value={emp.account || emp.name}>
                    {emp.name} ({emp.account || emp.msnv})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 3. Từ ngày */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TextField
              label="Từ ngày"
              type="date"
              size="small"
              fullWidth
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* 4. Đến ngày */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TextField
              label="Đến ngày"
              type="date"
              size="small"
              fullWidth
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* 5. Nút Đặt lại */}
          <Grid size={{ xs: 12, sm: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleResetFilters}
              sx={{
                height: 40,
                borderRadius: 2,
                color: '#5f6368',
                borderColor: '#dadce0',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </Grid>

          {/* Search bar (Keyword) */}
          <Grid size={{ xs: 12 }}>
            <TextField
              placeholder="Tìm kiếm nhanh theo Số Hợp Đồng, MSNV, Inside Account, Họ Tên nhân viên, Email..."
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#5f6368' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ backgroundColor: '#fafafa', borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ========================================================================= */}
      {/* 4. TABLE DỮ LIỆU GIA CỐ HỢP ĐỒNG */}
      {/* ========================================================================= */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          backgroundColor: '#ffffff',
          border: '1px solid #e8eaed',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            p: 2,
            px: 2.5,
            borderBottom: '1px solid #e8eaed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#202124' }}>
              DANH SÁCH HỢP ĐỒNG GIA CỐ MODEM
            </Typography>
            <Chip
              label={`${data.rows?.length || 0} kết quả`}
              size="small"
              sx={{ fontWeight: 800, backgroundColor: '#e8f0fe', color: '#1a73e8', height: 22 }}
            />
          </Box>

          <Typography variant="caption" sx={{ color: '#5f6368' }}>
            Hiển thị trang {page + 1} / {Math.max(1, Math.ceil((data.rows?.length || 0) / rowsPerPage))}
          </Typography>
        </Box>

        <TableContainer sx={{ maxHeight: 650 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8f9fa', color: '#3c4043', width: 60, textAlign: 'center' }}>
                  STT
                </TableCell>
                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8f9fa', color: '#3c4043' }}>
                  Số Hợp Đồng
                </TableCell>
                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8f9fa', color: '#3c4043' }}>
                  Nhân Sự Thực Hiện
                </TableCell>
                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8f9fa', color: '#3c4043' }}>
                  Đội Trưởng
                </TableCell>
                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8f9fa', color: '#3c4043' }}>
                  Mail KTV
                </TableCell>
                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8f9fa', color: '#3c4043' }}>
                  Ngày Cập Nhật
                </TableCell>
                <TableCell sx={{ fontWeight: 800, backgroundColor: '#f8f9fa', color: '#3c4043', textAlign: 'center', width: 140 }}>
                  Hình Ảnh Minh Chứng
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && data.rows?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={36} color="primary" />
                    <Typography variant="body2" sx={{ mt: 1.5, color: '#5f6368' }}>
                      Đang đồng bộ dữ liệu từ Google Sheet...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" sx={{ color: '#5f6368', fontWeight: 600 }}>
                      Không tìm thấy hợp đồng nào phù hợp với bộ lọc.
                    </Typography>
                    <Button size="small" variant="text" onClick={handleResetFilters} sx={{ mt: 1 }}>
                      Xóa bộ lọc
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, index) => {
                  const globalIdx = page * rowsPerPage + index + 1;
                  const hasImage = row.image_count > 0;
                  const firstImg = hasImage ? row.images[0] : null;

                  return (
                    <TableRow
                      key={row.id || index}
                      hover
                      sx={{
                        '&:nth-of-type(even)': { backgroundColor: '#fcfcfd' },
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* STT */}
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#5f6368' }}>
                        {globalIdx}
                      </TableCell>

                      {/* Số Hợp Đồng */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Chip
                            label={row.so_hd || '---'}
                            size="small"
                            sx={{
                              backgroundColor: '#e8f0fe',
                              color: '#1a73e8',
                              fontWeight: 800,
                              fontSize: '13px',
                              letterSpacing: '0.3px',
                              borderRadius: '6px'
                            }}
                          />
                          <Tooltip title={copiedId === row.id ? 'Đã sao chép!' : 'Sao chép số HĐ'}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(row.so_hd, row.id)}
                              sx={{ p: 0.4, color: copiedId === row.id ? '#1e8e3e' : '#9aa0a6' }}
                            >
                              {copiedId === row.id ? <CheckCircleIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>

                      {/* Nhân Sự Thực Hiện */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#202124' }}>
                            {row.name || row.inside_account || 'Chưa xác định'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
                            <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 600 }}>
                              {row.inside_account}
                            </Typography>
                            {row.msnv && (
                              <Chip
                                label={`MSNV: ${row.msnv}`}
                                size="small"
                                sx={{ height: 18, fontSize: '10px', fontWeight: 600, backgroundColor: '#f1f3f4' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Đội Trưởng */}
                      <TableCell>
                        <Chip
                          label={row.team_lead || 'Chưa xác nhận'}
                          size="small"
                          sx={{
                            backgroundColor: row.team_lead === 'Chưa xác nhận' ? '#fce8e6' : '#e6f4ea',
                            color: row.team_lead === 'Chưa xác nhận' ? '#d93025' : '#137333',
                            fontWeight: 700,
                            borderRadius: '6px',
                            fontSize: '11px'
                          }}
                        />
                      </TableCell>

                      {/* Mail */}
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500 }}>
                          {row.mail || '---'}
                        </Typography>
                      </TableCell>

                      {/* Ngày Cập Nhật */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: '#5f6368' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#3c4043' }}>
                            {row.formatted_date || row.raw_date || '---'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Hình Ảnh Minh Chứng */}
                      <TableCell sx={{ textAlign: 'center' }}>
                        {hasImage ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <Box
                              component="div"
                              onClick={() => handleOpenImagePreview(row)}
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 1.5,
                                overflow: 'hidden',
                                border: '1px solid #dadce0',
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f8f9fa',
                                '&:hover': {
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  borderColor: '#1a73e8'
                                }
                              }}
                            >
                              <Box
                                component="img"
                                src={firstImg?.thumbnail_url || firstImg?.direct_url || firstImg?.original}
                                alt="Thumb"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  if (firstImg?.direct_url && e.target.src !== firstImg.direct_url) {
                                    e.target.src = firstImg.direct_url;
                                  } else if (firstImg?.original && e.target.src !== firstImg.original) {
                                    e.target.src = firstImg.original;
                                  } else {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'block';
                                    }
                                  }
                                }}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                              <ImageIcon sx={{ display: 'none', color: '#1a73e8', fontSize: 24 }} />
                            </Box>

                            <Tooltip title="Bấm để xem ảnh chi tiết">
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleOpenImagePreview(row)}
                                sx={{
                                  borderRadius: 1.5,
                                  fontSize: '11px',
                                  py: 0.4,
                                  px: 1,
                                  fontWeight: 700,
                                  textTransform: 'none'
                                }}
                              >
                                Xem ({row.image_count})
                              </Button>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Chip
                            label="Chưa có ảnh"
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: '#e0e0e0',
                              color: '#9aa0a6',
                              fontSize: '11px',
                              height: 24
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINATION */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={data.rows?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số dòng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} trên tổng số ${count !== -1 ? count : `hơn ${to}`}`}
          sx={{ borderTop: '1px solid #e8eaed' }}
        />
      </Paper>

      {/* ========================================================================= */}
      {/* 5. IMAGE PREVIEW MODAL */}
      {/* ========================================================================= */}
      <ImagePreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        contract={selectedContract}
      />
    </Box>
  );
}
