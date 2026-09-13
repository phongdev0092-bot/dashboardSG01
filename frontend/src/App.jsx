import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Drawer,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  useMediaQuery,
  useTheme
} from '@mui/material';

import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Download as DownloadIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Engineering as EmployeeIcon,
  Build as MaintenanceIcon,
  SwapHoriz as SwapIcon,
  Analytics as AnalyticsIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Clear as ClearIcon,
  InfoOutlined as InfoIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarMonthIcon,
  PendingActions as PendingActionsIcon,
  BarChart as BarChartIcon,
  Phone as PhoneIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  Error as ErrorOutlineIcon,
  Menu as MenuIcon,
  ChevronRight as ChevronRightIcon,
  LocationOn as LocationIcon,
  NotificationsActive as AlertIcon,
  Person as PersonIcon,
  AssignmentLate as AssignmentLateIcon,
  Settings as SettingsIcon,
  Add as AddIcon
} from '@mui/icons-material';

import axios from 'axios';
import * as XLSX from 'xlsx';
import theme from './theme';

const API_BASE = '/api/kpi';
const LOGO_URL = 'https://management.mypt.vn/images/FPT_Telecom_logo.svg';

// Helper for default date calculation: First day of current month -> Yesterday (Today - 1)
const getInitialDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const fmt = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    start: fmt(firstDay),
    end: fmt(yesterday)
  };
};

export default function App() {
  const initialDates = useMemo(() => getInitialDates(), []);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  // Active Navigation: 'kpis' | 'lich_truc' | 'ton_tk_bt'
  const [currentNav, setCurrentNav] = useState('kpis');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Options & Filters State
  const [options, setOptions] = useState({
    team_leads: [],
    regions: [],
    partners: [],
    blocks: [],
    last_sync_time: null,
    is_syncing: false
  });

  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [selectedTeamLead, setSelectedTeamLead] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('month_to_yesterday');

  // KPI Data State
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Sorting & Pagination
  const [orderBy, setOrderBy] = useState('total_dung_hen_pct');
  const [order, setOrder] = useState('desc');

  // Employee Detail Drawer State
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empDetails, setEmpDetails] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Transaction Details Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // ================= LỊCH TRỰC SYSTEM STATES =================
  const [ltTab, setLtTab] = useState('dashboard'); // 'dashboard' | 'chitiet'
  const [ltDate, setLtDate] = useState(() => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [ltDashDoiTruong, setLtDashDoiTruong] = useState('__ALL__');
  const [ltDashData, setLtDashData] = useState(null);
  const [ltLoading, setLtLoading] = useState(false);

  // Thresholds State
  const [ltThresholds, setLtThresholds] = useState({ tiLeTrucMin: 50, tonPerNsMax: 5 });
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [tempTiLeTrucMin, setTempTiLeTrucMin] = useState(50);
  const [tempTonPerNsMax, setTempTonPerNsMax] = useState(5);

  // Chi Tiết Tab States & CRUD
  const [ltCtMonth, setLtCtMonth] = useState(new Date().getMonth() + 1);
  const [ltCtYear, setLtCtYear] = useState(new Date().getFullYear());
  const [ltCtDoiTruong, setLtCtDoiTruong] = useState('__ALL__');
  const [ltCtData, setLtCtData] = useState(null);
  const [sortBlockEnabled, setSortBlockEnabled] = useState(true);

  // CRUD & Import States
  const [addRowOpen, setAddRowOpen] = useState(false);
  const [addRowData, setAddRowData] = useState({
    mail: '', code: '', name: '', partner: '', block: '', month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });
  const [editingRowNumber, setEditingRowNumber] = useState(null);
  const [editingRowValues, setEditingRowValues] = useState([]);
  const importInputRef = useRef(null);

  // Fetch Filter Options
  const fetchOptions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/options`);
      setOptions(res.data);
    } catch (err) {
      console.error("Failed to fetch options:", err);
    }
  };

  // Fetch KPI Report
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedTeamLead) params.team_lead = selectedTeamLead;
      if (selectedRegion) params.region = selectedRegion;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get(`${API_BASE}/report`, { params });
      setReportData(res.data);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError("Không thể tải dữ liệu báo cáo KPI. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Lịch Trực API Calls
  const fetchLichTrucDashboard = async (targetDate = ltDate) => {
    setLtLoading(true);
    try {
      const res = await axios.get('/api/lich-truc/dashboard', { params: { date: targetDate } });
      setLtDashData(res.data);
    } catch (err) {
      console.error("Failed to fetch Lịch Trực dashboard:", err);
    } finally {
      setLtLoading(false);
    }
  };

  const fetchLichTrucThresholds = async () => {
    try {
      const res = await axios.get('/api/lich-truc/thresholds');
      if (res.data) {
        setLtThresholds(res.data);
        setTempTiLeTrucMin(res.data.tiLeTrucMin || 50);
        setTempTonPerNsMax(res.data.tonPerNsMax || 5);
      }
    } catch (err) {
      console.error("Failed to fetch thresholds:", err);
    }
  };

  const handleSaveThresholds = async () => {
    try {
      const payload = { tiLeTrucMin: Number(tempTiLeTrucMin), tonPerNsMax: Number(tempTonPerNsMax) };
      await axios.post('/api/lich-truc/thresholds', payload);
      setLtThresholds(payload);
      setThresholdModalOpen(false);
      fetchLichTrucDashboard();
    } catch (err) {
      console.error("Failed to save thresholds:", err);
    }
  };

  const fetchLichTrucChiTiet = async () => {
    setLtLoading(true);
    try {
      const params = { month: ltCtMonth, year: ltCtYear, doi_truong: ltCtDoiTruong };
      const res = await axios.get('/api/lich-truc/chitiet', { params });
      setLtCtData(res.data);
    } catch (err) {
      console.error("Failed to fetch Lịch Trực chi tiết:", err);
    } finally {
      setLtLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, selectedTeamLead, selectedRegion, searchQuery]);

  useEffect(() => {
    if (currentNav === 'lich_truc') {
      fetchLichTrucThresholds();
      if (ltTab === 'dashboard') {
        fetchLichTrucDashboard();
      } else {
        fetchLichTrucChiTiet();
      }
    }
  }, [currentNav, ltTab]);

  // Date Preset Buttons Handler
  const handleDatePreset = (presetKey) => {
    setDatePreset(presetKey);
    const now = new Date();
    const fmt = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (presetKey === 'today') {
      const todayStr = fmt(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (presetKey === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = fmt(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (presetKey === 'month_to_yesterday') {
      const init = getInitialDates();
      setStartDate(init.start);
      setEndDate(init.end);
    } else if (presetKey === 'week') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 7);
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      setStartDate(fmt(past7));
      setEndDate(fmt(yest));
    } else if (presetKey === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Trigger Live Data Sync
  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API_BASE}/sync`);
      setTimeout(() => {
        fetchOptions();
        fetchReport();
        if (currentNav === 'lich_truc') {
          fetchLichTrucDashboard();
        }
        setSyncing(false);
      }, 4000);
    } catch (err) {
      console.error("Sync error:", err);
      setSyncing(false);
    }
  };

  // Sort Handler
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Employee Detail Drawer Open
  const handleOpenEmployee = async (emp) => {
    setSelectedEmployee(emp);
    setDrawerOpen(true);
    setLoadingDetails(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await axios.get(`${API_BASE}/employee/${emp.account}`, { params });
      setEmpDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch employee details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Export to Excel for KPI
  const handleExportExcel = () => {
    if (!reportData || !reportData.employees) return;

    const exportRows = reportData.employees.map((emp, idx) => ({
      'STT': idx + 1,
      'Inside Account': emp.account,
      'Mã NV': emp.code,
      'Họ và Tên': emp.name,
      'Đội Trưởng': emp.team_lead,
      'Vùng': emp.region,
      'Triển Khai (Không Swap)': emp.tk_kpi_volume,
      'TK Đúng Hẹn': emp.tk_dung_hen_1,
      'TK Trễ Hẹn': emp.tk_dung_hen_0,
      'Đúng Hẹn TK (%)': emp.tk_dung_hen_pct,
      'RT-TK': emp.rt_tk_fmt,
      'Bảo Trì': emp.bt_volume,
      'BT Đúng Hẹn': emp.bt_dung_hen_1,
      'BT Trễ Hẹn': emp.bt_dung_hen_0,
      'Đúng Hẹn BT (%)': emp.bt_dung_hen_pct,
      'RT-BT': emp.rt_bt_fmt,
      'Khối Lượng Swap': emp.tk_swap_volume,
      'TỔNG ĐÚNG HẸN (%)': emp.total_dung_hen_pct,
      'TỔNG KHỐI LƯỢNG HOÀN TẤT': emp.total_completed_work
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KPI_Report");
    XLSX.writeFile(wb, `KPI_Report_SG01_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export CSV for Lịch Trực with Padded CodeStaff (8 digits)
  const handleExportLichTrucCSV = () => {
    if (!ltCtData || !ltCtData.data) return;
    let exportRows = [...ltCtData.data];
    if (sortBlockEnabled) {
      exportRows.sort((a, b) => {
        const blockA = String(a.values[3] || '');
        const blockB = String(b.values[3] || '');
        const cmp = blockA.localeCompare(blockB, 'vi', { numeric: true, sensitivity: 'base' });
        if (cmp !== 0) return cmp;
        const nameA = String(a.values[1] || '');
        const nameB = String(b.values[1] || '');
        return nameA.localeCompare(nameB, 'vi', { numeric: true, sensitivity: 'base' });
      });
    }

    const csvHeader = ltCtData.header.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
    const csvLines = exportRows.map(r => {
      return r.values.map((v, idx) => {
        let text = String(v == null ? '' : v).trim();
        if (idx === 0) {
          // Format MSNV to always be 8 digits (pad with 00 if 6 digits)
          const digitsOnly = text.replace(/\D/g, '');
          const padded = digitsOnly.length > 0 ? digitsOnly.padStart(8, '0') : text.padStart(8, '0');
          text = `="${padded.replace(/"/g, '')}"`;
        } else if (idx >= 4 && idx <= 34) {
          const up = text.toUpperCase();
          if (up === 'CA1' || up === 'O') text = up;
        }
        return `"${text.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvString = "\uFEFF" + [csvHeader, ...csvLines].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChiTiet_LichTruc_${ltCtMonth}_${ltCtYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // CRUD Handlers for Lịch Trực Chi Tiết
  const handleAddRowSubmit = async () => {
    if (!addRowData.mail) {
      alert("Vui lòng nhập Email!");
      return;
    }
    const days = new Array(31).fill('O');
    const valuesBtoAL = [
      addRowData.code || '',
      addRowData.name || '',
      addRowData.partner || '',
      addRowData.block || '',
      ...days,
      addRowData.month || ltCtMonth || 9,
      addRowData.year || ltCtYear || 2026
    ];
    try {
      await axios.post('/api/lich-truc/add-row', {
        mail: addRowData.mail,
        valuesBtoAL
      });
      setAddRowOpen(false);
      setAddRowData({ mail: '', code: '', name: '', partner: '', block: '', month: ltCtMonth || 9, year: ltCtYear || 2026 });
      fetchLichTrucChiTiet();
    } catch (err) {
      console.error("Failed to add row:", err);
      alert("Có lỗi xảy ra khi thêm dòng!");
    }
  };

  const handleStartEditRow = (rowObj) => {
    setEditingRowNumber(rowObj.row);
    setEditingRowValues([...rowObj.values]);
  };

  const handleSaveEditRow = async () => {
    try {
      await axios.post('/api/lich-truc/update-row', {
        rowNumber: editingRowNumber,
        valuesBtoAL: editingRowValues
      });
      setEditingRowNumber(null);
      setEditingRowValues([]);
      fetchLichTrucChiTiet();
    } catch (err) {
      console.error("Failed to update row:", err);
      alert("Có lỗi khi lưu dòng!");
    }
  };

  const handleCancelEditRow = () => {
    setEditingRowNumber(null);
    setEditingRowValues([]);
  };

  const handleDeleteRow = async (rowNumber) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa dòng này?")) {
      try {
        await axios.post('/api/lich-truc/delete-row', { rowNumber });
        fetchLichTrucChiTiet();
      } catch (err) {
        console.error("Failed to delete row:", err);
        alert("Có lỗi khi xóa dòng!");
      }
    }
  };

  const handleImportCsvFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/);
        const rowsToImport = [];
        for (let line of lines) {
          line = line.trim();
          if (!line) continue;
          const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
          if (cells.length >= 38) {
            if (cells[0].toUpperCase() === 'MAIL' || cells[1].toUpperCase() === 'CODESTAFF') continue;
            const mail = cells[0];
            const valuesBtoAL = cells.slice(1, 38);
            rowsToImport.push({ mail, valuesBtoAL });
          }
        }
        if (rowsToImport.length > 0) {
          await axios.post('/api/lich-truc/import-csv', { rows: rowsToImport });
          alert(`Đã nhập thành công ${rowsToImport.length} dòng dữ liệu Lịch Trực!`);
          fetchLichTrucChiTiet();
        } else {
          alert("Không tìm thấy dòng dữ liệu hợp lệ (cần đủ 38 cột: Mail, CodeStaff, Name, Partner, Block, Day1..31, Months, Years).");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Lỗi khi đọc file CSV!");
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Sort Employees for KPI
  const sortedEmployees = useMemo(() => {
    if (!reportData || !reportData.employees) return [];
    return [...reportData.employees].sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];
      
      if (aVal === null || aVal === undefined) aVal = -999999;
      if (bVal === null || bVal === undefined) bVal = -999999;

      if (typeof aVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [reportData, orderBy, order]);

  const summary = reportData?.overall_summary || {};
  const meta = reportData?.metadata || {};

  // Mock Tồn TK-BT Data for SG01
  const backlogData = useMemo(() => {
    const leads = options.team_leads.length > 0 ? options.team_leads : ['Nguyễn Văn A', 'Trần Văn B', 'Lê Văn C', 'Phạm Văn D'];
    return leads.map((lead, idx) => {
      const ton_tk = Math.floor(2 + Math.random() * 6);
      const ton_bt = Math.floor(3 + Math.random() * 8);
      const ton_qua_24h = Math.floor(Math.random() * 3);
      const ton_qua_48h = Math.floor(Math.random() * 2);

      return {
        id: idx + 1,
        team_lead: lead,
        region: options.regions[idx % options.regions.length] || `Vùng SG0${(idx % 4) + 1}`,
        ton_tk,
        ton_bt,
        ton_tong: ton_tk + ton_bt,
        ton_qua_24h,
        ton_qua_48h,
        risk_level: ton_qua_48h > 0 ? 'Cao' : ton_qua_24h > 0 ? 'Trung bình' : 'An toàn'
      };
    });
  }, [options.team_leads, options.regions]);

  const totalBacklogSummary = useMemo(() => {
    const total_tk = backlogData.reduce((acc, curr) => acc + curr.ton_tk, 0);
    const total_bt = backlogData.reduce((acc, curr) => acc + curr.ton_bt, 0);
    const total_qua_24h = backlogData.reduce((acc, curr) => acc + curr.ton_qua_24h, 0);
    const total_qua_48h = backlogData.reduce((acc, curr) => acc + curr.ton_qua_48h, 0);
    return {
      total: total_tk + total_bt,
      total_tk,
      total_bt,
      total_qua_24h,
      total_qua_48h
    };
  }, [backlogData]);

  // Sidebar Menu Definitions
  const navItems = [
    {
      id: 'kpis',
      label: 'KPIs',
      sublabel: 'Báo cáo hiệu suất kỹ thuật',
      icon: <BarChartIcon />
    },
    {
      id: 'lich_truc',
      label: 'Lịch Trực',
      sublabel: 'Lịch trực kỹ thuật SG01',
      icon: <CalendarMonthIcon />
    },
    {
      id: 'ton_tk_bt',
      label: 'Tồn TK-BT',
      sublabel: 'Tồn triển khai & bảo trì',
      icon: <PendingActionsIcon />,
      badge: totalBacklogSummary.total > 0 ? totalBacklogSummary.total : null
    }
  ];

  // SIDEBAR CONTENT COMPONENT
  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e0e0e0',
        p: 2.5
      }}
    >
      {/* FPT TELECOM LOGO & HEADER */}
      <Box sx={{ pb: 2, borderBottom: '1px solid #f0f0f0', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            component="img"
            src={LOGO_URL}
            alt="FPT Telecom Logo"
            sx={{
              height: 38,
              maxWidth: 160,
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'block';
              }
            }}
          />
          <Typography
            variant="h6"
            sx={{
              display: 'none',
              fontWeight: 900,
              color: '#f26522',
              letterSpacing: '-0.5px'
            }}
          >
            FPT TELECOM
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
          <Chip
            label="CHI NHÁNH SG01"
            size="small"
            sx={{
              backgroundColor: '#fff3e0',
              color: '#e65100',
              fontWeight: 800,
              fontSize: '11px',
              height: 22,
              borderRadius: '6px'
            }}
          />
          <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 600 }}>
            Dashboard Tổng Quan
          </Typography>
        </Box>
      </Box>

      {/* NAVIGATION MENU ITEMS */}
      <Typography
        variant="overline"
        sx={{
          color: '#70757a',
          fontWeight: 800,
          letterSpacing: '0.8px',
          px: 1,
          mb: 1
        }}
      >
        DANH MỤC QUẢN LÝ
      </Typography>

      <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = currentNav === item.id;
          return (
            <ListItem disablePadding key={item.id}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  setCurrentNav(item.id);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 2,
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive ? '#e8f0fe !important' : 'transparent',
                  color: isActive ? '#1a73e8' : '#3c4043',
                  borderLeft: isActive ? '4px solid #1a73e8' : '4px solid transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(26,115,232,0.15)' : 'none',
                  '&:hover': {
                    backgroundColor: isActive ? '#e8f0fe' : '#f8f9fa',
                    transform: 'translateX(3px)'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: isActive ? '#1a73e8' : '#5f6368'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: isActive ? 800 : 600 }}>
                        {item.label}
                      </Typography>
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color="error"
                          sx={{ height: 18, fontSize: '10px', fontWeight: 800 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: isActive ? '#1557b0' : '#70757a', fontSize: '11px' }}>
                      {item.sublabel}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* SYSTEM DATA SYNC & STATUS */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="medium"
          startIcon={syncing ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
          onClick={handleTriggerSync}
          disabled={syncing}
          sx={{
            borderRadius: '20px',
            textTransform: 'none',
            py: 1,
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 3px 8px rgba(26,115,232,0.25)'
          }}
        >
          {syncing ? 'Đang đồng bộ...' : 'Đồng Bộ Data'}
        </Button>

        <Box sx={{ px: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#5f6368', display: 'block' }}>
            📅 Cập nhật: <strong>{options.last_sync_time || 'Hôm nay'}</strong>
          </Typography>
          {meta.execution_time_ms && (
            <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 600, display: 'block', mt: 0.2 }}>
              ⚡ Độ trễ API: {meta.execution_time_ms} ms
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
        
        {/* DESKTOP SIDEBAR */}
        <Box
          component="aside"
          sx={{
            width: { xs: 0, md: 300 },
            flexShrink: 0,
            display: { xs: 'none', md: 'block' }
          }}
        >
          {sidebarContent}
        </Box>

        {/* MOBILE DRAWER SIDEBAR */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 }
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* MAIN CONTENT AREA */}
        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          
          {/* TOP HEADER BAR */}
          <Paper
            square
            elevation={0}
            sx={{
              p: 2,
              px: { xs: 2, md: 3.5 },
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              zIndex: 5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {isMobile && (
                <IconButton color="inherit" onClick={() => setMobileOpen(true)} edge="start">
                  <MenuIcon />
                </IconButton>
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', lineHeight: 1.2 }}>
                  {currentNav === 'kpis' && '📊 Dashboard KPIs Hiệu Suất Kỹ Thuật - Chi Nhánh SG01'}
                  {currentNav === 'lich_truc' && '📋 Dashboard Lịch Trực Kỹ Thuật - Chi Nhánh SG01'}
                  {currentNav === 'ton_tk_bt' && '📦 Quản Lý Tồn Triển Khai & Bảo Trì - Chi Nhánh SG01'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5f6368' }}>
                  FPT Telecom | Đội ngũ Kỹ thuật Phương Nam SG01
                </Typography>
              </Box>
            </Box>

            {/* Quick Header Actions */}
            {currentNav === 'kpis' && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportExcel}
                sx={{ borderRadius: '18px', textTransform: 'none', px: 2, fontWeight: 700, backgroundColor: '#1e8e3e' }}
              >
                Xuất Excel
              </Button>
            )}
          </Paper>

          {/* VIEW CONTENT CONTAINER */}
          <Box sx={{ p: { xs: 2, md: 3.5 }, flexGrow: 1 }}>

            {/* ========================================================================= */}
            {/* VIEW 1: KPIS DASHBOARD                                                   */}
            {/* ========================================================================= */}
            {currentNav === 'kpis' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* OVERALL KPI METRIC CARDS ROW - FULL WIDTH GRID */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2, width: '100%' }}>
                  
                  {/* Card 1: Triển khai */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #d2e3fc', borderLeft: '6px solid #1a73e8', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#1a73e8', fontWeight: 800 }}>
                          TRIỂN KHAI (TK)
                        </Typography>
                        <AssignmentIcon sx={{ color: '#1a73e8', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a73e8', letterSpacing: '-1px' }}>
                        {summary.tk_volume_kpi || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.5 }}>
                        ✅ Đúng: <strong>{summary.tk_dung_hen_1 || 0}</strong> | ❌ Trễ: <strong>{summary.tk_dung_hen_0 || 0}</strong>
                      </Typography>

                      <Button
                        size="small"
                        startIcon={<InfoIcon sx={{ fontSize: '15px !important' }} />}
                        onClick={() => setDetailModalOpen(true)}
                        sx={{
                          mt: 1,
                          p: 0,
                          textTransform: 'none',
                          fontWeight: 700,
                          color: '#1a73e8',
                          fontSize: '12px',
                          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                        }}
                      >
                        Chi tiết loại giao dịch
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Card 2: Bảo trì */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #b2dfdb', borderLeft: '6px solid #00897b', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#00897b', fontWeight: 800 }}>
                          BẢO TRÌ (BT)
                        </Typography>
                        <MaintenanceIcon sx={{ color: '#00897b', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#00897b', letterSpacing: '-1px' }}>
                        {summary.bt_volume || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.5 }}>
                        ✅ Đúng: <strong>{summary.bt_dung_hen_1 || 0}</strong> | ❌ Trễ: <strong>{summary.bt_dung_hen_0 || 0}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#00897b', fontWeight: 700, display: 'block', mt: 1 }}>
                        Đúng hẹn BT: {summary.bt_dung_hen_pct || 0}%
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Card 3: RT-TK */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #d2e3fc', borderLeft: `6px solid ${summary.rt_tk_status === 'PASS' ? '#2e7d32' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#1967d2', fontWeight: 800 }}>
                          {"RT-TK (<= 18H)"}
                        </Typography>
                        <TimerIcon sx={{ color: summary.rt_tk_status === 'PASS' ? '#2e7d32' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.rt_tk_status === 'PASS' ? '#2e7d32' : '#d32f2f', letterSpacing: '-1px' }}>
                        {summary.rt_tk_fmt || '-'}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={summary.rt_tk_status === 'PASS' ? "ĐẠT (<= 18H)" : "KHÔNG ĐẠT (> 18H)"}
                          size="small"
                          color={summary.rt_tk_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Card 4: RT-BT */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #ffe0b2', borderLeft: `6px solid ${summary.rt_bt_status === 'PASS' ? '#2e7d32' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#e65100', fontWeight: 800 }}>
                          {"RT-BT (<= 8H)"}
                        </Typography>
                        <TimerIcon sx={{ color: summary.rt_bt_status === 'PASS' ? '#2e7d32' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.rt_bt_status === 'PASS' ? '#2e7d32' : '#d32f2f', letterSpacing: '-1px' }}>
                        {summary.rt_bt_fmt || '-'}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={summary.rt_bt_status === 'PASS' ? "ĐẠT (<= 8H)" : "KHÔNG ĐẠT (> 8H)"}
                          size="small"
                          color={summary.rt_bt_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Card 5: CLL30N */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${summary.cll30n_status === 'PASS' ? '#e1bee7' : '#ffcdd2'}`, borderLeft: `6px solid ${summary.cll30n_status === 'PASS' ? '#7b1fa2' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#7b1fa2', fontWeight: 800 }}>
                          {"CLL30N (<= 7%)"}
                        </Typography>
                        <TrendingUpIcon sx={{ color: summary.cll30n_status === 'PASS' ? '#7b1fa2' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.cll30n_status === 'PASS' ? '#7b1fa2' : '#d32f2f', letterSpacing: '-1px' }}>
                        {summary.kh_cls_count > 0 ? `${summary.cll30n_pct || 0}%` : `${summary.cll30n_count || 0} HĐ`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.2 }}>
                        {summary.kh_cls_count > 0 ? `HĐ: ${summary.cll30n_count || 0} / ${summary.kh_cls_count}` : `Sheet CLL: ${summary.cll30n_count || 0} HĐ`}
                      </Typography>
                      <Box sx={{ mt: 0.8 }}>
                        <Chip
                          label={summary.cll30n_status === 'PASS' ? "ĐẠT (<= 7%)" : "KHÔNG ĐẠT (> 7%)"}
                          size="small"
                          color={summary.cll30n_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Card 6: TỔNG ĐÚNG HẸN */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${summary.dung_hen_status === 'PASS' ? '#c8e6c9' : '#ffcdd2'}`, borderLeft: `6px solid ${summary.dung_hen_status === 'PASS' ? '#2e7d32' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: summary.dung_hen_status === 'PASS' ? '#1b5e20' : '#b71c1c', fontWeight: 800 }}>
                          TỔNG ĐÚNG HẸN
                        </Typography>
                        <CheckCircleIcon sx={{ color: summary.dung_hen_status === 'PASS' ? '#2e7d32' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.dung_hen_status === 'PASS' ? '#1b5e20' : '#b71c1c', letterSpacing: '-1px' }}>
                        {summary.total_dung_hen_pct || 0}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.2 }}>
                        Tổng Khối Lượng: {summary.total_work_volume || 0} Phiếu
                      </Typography>
                      <Box sx={{ mt: 0.8 }}>
                        <Chip
                          label={summary.dung_hen_status === 'PASS' ? "ĐẠT (>= 97.2%)" : "KHÔNG ĐẠT (< 97.2%)"}
                          size="small"
                          color={summary.dung_hen_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                </Box>

                {/* FILTER BAR PANEL */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  
                  {/* Quick Date Presets Row */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#3c4043', mr: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FilterIcon fontSize="small" color="primary" /> Lọc Nhanh:
                    </Typography>

                    {[
                      { key: 'month_to_yesterday', label: 'Đầu tháng -> Hôm qua (Mặc định)' },
                      { key: 'all', label: 'Tất cả' },
                      { key: 'today', label: 'Hôm nay' },
                      { key: 'yesterday', label: 'Hôm qua' },
                      { key: 'week', label: '7 Ngày qua' }
                    ].map((btn) => (
                      <Button
                        key={btn.key}
                        size="small"
                        variant={datePreset === btn.key ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => handleDatePreset(btn.key)}
                        sx={{ borderRadius: '16px', px: 2, py: 0.4, fontSize: '12.5px', textTransform: 'none', fontWeight: datePreset === btn.key ? 700 : 500 }}
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </Box>

                  {/* Filter Input Grid */}
                  <Grid container spacing={2.5} alignItems="flex-end">
                    
                    <Grid item xs={12} sm={6} md={2.5}>
                      <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                        Từ Ngày (TG Hoàn tất)
                      </FormLabel>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setDatePreset('custom'); }}
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#fafafa' } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.5}>
                      <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                        Đến Ngày (TG Hoàn tất)
                      </FormLabel>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setDatePreset('custom'); }}
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#fafafa' } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.5}>
                      <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                        Lọc Theo Đội Trưởng
                      </FormLabel>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={selectedTeamLead}
                        onChange={(e) => setSelectedTeamLead(e.target.value)}
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#fafafa' } }}
                      >
                        <MenuItem value="">-- Tất cả Đội Trưởng --</MenuItem>
                        {options.team_leads.map((tl) => (
                          <MenuItem key={tl} value={tl}>{tl}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                        Lọc Theo Vùng
                      </FormLabel>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#fafafa' } }}
                      >
                        <MenuItem value="">-- Tất cả Vùng --</MenuItem>
                        {options.regions.map((r) => (
                          <MenuItem key={r} value={r}>{r}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={12} md={2.5}>
                      <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                        Tìm Inside Acc / NV
                      </FormLabel>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Nhập tên, mã hoặc account..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#fafafa' } }}
                        InputProps={{
                          endAdornment: searchQuery ? (
                            <IconButton size="small" onClick={() => setSearchQuery('')}><ClearIcon fontSize="small" /></IconButton>
                          ) : <SearchIcon color="action" fontSize="small" />
                        }}
                      />
                    </Grid>

                  </Grid>
                </Paper>

                {/* MAIN DATATABLE PAPER */}
                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <Box sx={{ p: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <span>BẢNG KPI CHI TIẾT THEO NHÂN VIÊN</span>
                      <Chip label={`${sortedEmployees.length} Nhân viên`} size="small" color="primary" sx={{ fontWeight: 700, borderRadius: '12px' }} />
                    </Typography>
                  </Box>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Box sx={{ p: 5, textAlign: 'center', color: '#d93025' }}>
                      <Typography variant="h6">{error}</Typography>
                    </Box>
                  ) : (
                    <TableContainer sx={{ maxHeight: 720 }}>
                      <Table stickyHeader size="medium">
                        <TableHead>
                          <TableRow>
                            <TableCell rowSpan={2} sx={{ fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderRight: '1px solid #e0e0e0', width: 60, textAlign: 'center' }}>
                              STT
                            </TableCell>
                            
                            <TableCell rowSpan={2} sx={{ fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderRight: '1px solid #e0e0e0', minWidth: 200 }}>
                              <TableSortLabel
                                active={orderBy === 'name' || orderBy === 'account'}
                                direction={orderBy === 'name' || orderBy === 'account' ? order : 'asc'}
                                onClick={() => handleRequestSort('account')}
                              >
                                Nhân Viên (Inside Acc)
                              </TableSortLabel>
                            </TableCell>

                            <TableCell rowSpan={2} sx={{ fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderRight: '1px solid #e0e0e0', minWidth: 160 }}>
                              <TableSortLabel
                                active={orderBy === 'team_lead'}
                                direction={orderBy === 'team_lead' ? order : 'asc'}
                                onClick={() => handleRequestSort('team_lead')}
                              >
                                Đội Trưởng / Vùng
                              </TableSortLabel>
                            </TableCell>

                            <TableCell colSpan={3} align="center" sx={{ fontWeight: 800, backgroundColor: '#e8f0fe', color: '#1a73e8', borderRight: '1px solid #d2e3fc', borderBottom: '1px solid #d2e3fc', fontSize: '13px', py: 1 }}>
                              KHỐI LƯỢNG CÔNG VIỆC
                            </TableCell>

                            <TableCell colSpan={2} align="center" sx={{ fontWeight: 800, backgroundColor: '#fff3e0', color: '#e65100', borderRight: '1px solid #ffe0b2', borderBottom: '1px solid #ffe0b2', fontSize: '13px', py: 1 }}>
                              TIẾN ĐỘ (RT)
                            </TableCell>

                            <TableCell colSpan={1} align="center" sx={{ fontWeight: 800, backgroundColor: '#f3e5f5', color: '#7b1fa2', borderRight: '1px solid #e1bee7', borderBottom: '1px solid #e1bee7', fontSize: '13px', py: 1 }}>
                              CHẤT LƯỢNG LẶP
                            </TableCell>

                            <TableCell colSpan={3} align="center" sx={{ fontWeight: 800, backgroundColor: '#e6f4ea', color: '#1e8e3e', borderRight: '1px solid #ceead6', borderBottom: '1px solid #ceead6', fontSize: '13px', py: 1 }}>
                              CAM KẾT TIẾN ĐỘ
                            </TableCell>

                            <TableCell rowSpan={2} align="center" sx={{ fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', width: 100 }}>
                              Thao Tác
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f4f8fe', color: '#1a73e8' }}>
                              <TableSortLabel
                                active={orderBy === 'tk_kpi_volume'}
                                direction={orderBy === 'tk_kpi_volume' ? order : 'asc'}
                                onClick={() => handleRequestSort('tk_kpi_volume')}
                              >
                                Triển Khai (KPI)
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f4f8fe', color: '#1a73e8' }}>
                              <TableSortLabel
                                active={orderBy === 'bt_volume'}
                                direction={orderBy === 'bt_volume' ? order : 'asc'}
                                onClick={() => handleRequestSort('bt_volume')}
                              >
                                Bảo Trì
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f4f8fe', color: '#1a73e8', borderRight: '1px solid #d2e3fc' }}>
                              <TableSortLabel
                                active={orderBy === 'tk_swap_volume'}
                                direction={orderBy === 'tk_swap_volume' ? order : 'asc'}
                                onClick={() => handleRequestSort('tk_swap_volume')}
                              >
                                Swap
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#fff8e1', color: '#b06000' }}>
                              <TableSortLabel
                                active={orderBy === 'rt_tk_hours'}
                                direction={orderBy === 'rt_tk_hours' ? order : 'asc'}
                                onClick={() => handleRequestSort('rt_tk_hours')}
                              >
                                {"RT-TK (<=18H)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#fff8e1', color: '#b06000', borderRight: '1px solid #ffe0b2' }}>
                              <TableSortLabel
                                active={orderBy === 'rt_bt_hours'}
                                direction={orderBy === 'rt_bt_hours' ? order : 'asc'}
                                onClick={() => handleRequestSort('rt_bt_hours')}
                              >
                                {"RT-BT (<=8H)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#f3e5f5', color: '#7b1fa2', borderRight: '1px solid #e1bee7' }}>
                              <TableSortLabel
                                active={orderBy === 'cll30n_pct'}
                                direction={orderBy === 'cll30n_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('cll30n_pct')}
                              >
                                {"CLL30N (%) (<=7%)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e6f4ea', color: '#1e8e3e' }}>
                              <TableSortLabel
                                active={orderBy === 'total_dung_hen_pct'}
                                direction={orderBy === 'total_dung_hen_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('total_dung_hen_pct')}
                              >
                                {"TỔNG ĐÚNG HẸN (>=97.2%)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#e6f4ea', color: '#1e8e3e' }}>
                              <TableSortLabel
                                active={orderBy === 'tk_dung_hen_pct'}
                                direction={orderBy === 'tk_dung_hen_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('tk_dung_hen_pct')}
                              >
                                Đúng Hẹn TK (%)
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#e6f4ea', color: '#1e8e3e', borderRight: '1px solid #ceead6' }}>
                              <TableSortLabel
                                active={orderBy === 'bt_dung_hen_pct'}
                                direction={orderBy === 'bt_dung_hen_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('bt_dung_hen_pct')}
                              >
                                Đúng Hẹn BT (%)
                              </TableSortLabel>
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {sortedEmployees.map((emp, idx) => (
                            <TableRow key={emp.account} hover sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                              <TableCell align="center" sx={{ color: '#5f6368', borderRight: '1px solid #f0f0f0' }}>{idx + 1}</TableCell>
                              <TableCell sx={{ borderRight: '1px solid #f0f0f0' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#202124' }}>{emp.name}</Typography>
                                <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 600 }}>{emp.account}</Typography>
                                <Typography variant="caption" sx={{ color: '#5f6368', ml: 1 }}>({emp.code})</Typography>
                              </TableCell>

                              <TableCell sx={{ borderRight: '1px solid #f0f0f0' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#3c4043' }}>{emp.team_lead}</Typography>
                                <Chip label={emp.region} size="small" sx={{ height: 18, fontSize: '10px', backgroundColor: '#e8f0fe', color: '#1a73e8' }} />
                              </TableCell>

                              {/* Volume Columns */}
                              <TableCell align="center" sx={{ fontWeight: 700, color: '#1a73e8' }}>{emp.tk_kpi_volume || 0}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: '#00897b' }}>{emp.bt_volume || 0}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600, color: '#5f6368', borderRight: '1px solid #d2e3fc' }}>{emp.tk_swap_volume || 0}</TableCell>

                              {/* Progress RT Columns */}
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: emp.rt_tk_status === 'PASS' ? '#2e7d32' : '#d32f2f' }}>
                                    {emp.rt_tk_fmt || '-'}
                                  </Typography>
                                  {emp.rt_tk_hours && (
                                    <Chip
                                      label={emp.rt_tk_status === 'PASS' ? 'Đạt' : 'Không đạt'}
                                      size="small"
                                      color={emp.rt_tk_status === 'PASS' ? 'success' : 'error'}
                                      sx={{ height: 18, fontSize: '10px', fontWeight: 800 }}
                                    />
                                  )}
                                </Box>
                              </TableCell>

                              <TableCell align="center" sx={{ borderRight: '1px solid #ffe0b2' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: emp.rt_bt_status === 'PASS' ? '#2e7d32' : '#d32f2f' }}>
                                    {emp.rt_bt_fmt || '-'}
                                  </Typography>
                                  {emp.rt_bt_hours && (
                                    <Chip
                                      label={emp.rt_bt_status === 'PASS' ? 'Đạt' : 'Không đạt'}
                                      size="small"
                                      color={emp.rt_bt_status === 'PASS' ? 'success' : 'error'}
                                      sx={{ height: 18, fontSize: '10px', fontWeight: 800 }}
                                    />
                                  )}
                                </Box>
                              </TableCell>

                              {/* CLL30N Column */}
                              <TableCell align="center" sx={{ backgroundColor: '#fcf8fe', borderRight: '1px solid #e1bee7' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: emp.cll30n_status === 'PASS' ? '#2e7d32' : '#d32f2f' }}>
                                    {emp.cll30n_pct || 0}%
                                  </Typography>
                                  <Chip
                                    label={emp.cll30n_status === 'PASS' ? 'Đạt' : 'Không đạt'}
                                    size="small"
                                    color={emp.cll30n_status === 'PASS' ? 'success' : 'error'}
                                    sx={{ height: 18, fontSize: '10px', fontWeight: 800 }}
                                  />
                                </Box>
                              </TableCell>

                              {/* Commit Percentages */}
                              <TableCell align="center" sx={{ backgroundColor: '#f6fbf7' }}>
                                <Chip
                                  label={`${emp.total_dung_hen_pct || 0}% (${emp.dung_hen_status === 'PASS' ? 'Đạt' : 'Không đạt'})`}
                                  size="small"
                                  color={emp.dung_hen_status === 'PASS' ? 'success' : 'error'}
                                  sx={{ fontWeight: 800, borderRadius: '12px' }}
                                />
                              </TableCell>

                              <TableCell align="center" sx={{ color: '#1e8e3e', fontWeight: 700 }}>{emp.tk_dung_hen_pct || 0}%</TableCell>
                              <TableCell align="center" sx={{ color: '#1e8e3e', fontWeight: 700, borderRight: '1px solid #ceead6' }}>{emp.bt_dung_hen_pct || 0}%</TableCell>

                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenEmployee(emp)}
                                  sx={{ borderRadius: '12px', textTransform: 'none', px: 1.5, fontSize: '11px', fontWeight: 700 }}
                                >
                                  Xem Chi Tiết
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>

              </Box>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: LỊCH TRỰC KỸ THUẬT (FULL INTEGRATION FROM APPS SCRIPT CODE & HTML)  */}
            {/* ========================================================================= */}
            {currentNav === 'lich_truc' && (
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

                        <Grid item xs={12} sm={6} md={2}>
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

                        <Grid item xs={12} sm={6} md={2}>
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

                        <Grid item xs={12} sm={6} md={3}>
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

                        <Grid item xs={12} sm={6} md={2}>
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
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, width: '100%' }}>
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
                              Theo sheet Nhân Sự (tình trạng Active)
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
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>Tồn Dự Kiến<br />{ltDashData?.date1 || 'Ngày X+1'}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e0f7fa', color: '#00838f' }}>NS Đi Làm<br />{ltDashData?.date2 || 'Ngày X+2'}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, backgroundColor: '#e0f0fa', color: '#00838f' }}>Tồn Dự Kiến<br />{ltDashData?.date2 || 'Ngày X+2'}</TableCell>
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

                  </Box>
                )}

                {/* ==================== SUB-TAB 2: CHI TIẾT LỊCH TRỰC ==================== */}
                {ltTab === 'chitiet' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    {/* HIDDEN CSV INPUT */}
                    <input
                      type="file"
                      accept=".csv"
                      ref={importInputRef}
                      style={{ display: 'none' }}
                      onChange={handleImportCsvFile}
                    />

                    {/* TOOLBAR */}
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3} md={1.5}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Tháng</FormLabel>
                          <TextField select fullWidth size="small" value={ltCtMonth} onChange={(e) => setLtCtMonth(Number(e.target.value))}>
                            <MenuItem value={0}>Tất cả</MenuItem>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={3} md={1.5}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Năm</FormLabel>
                          <TextField select fullWidth size="small" value={ltCtYear} onChange={(e) => setLtCtYear(Number(e.target.value))}>
                            <MenuItem value={0}>Tất cả</MenuItem>
                            {[2024, 2025, 2026, 2027, 2028].map((y) => (
                              <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2.5}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Đội Trưởng</FormLabel>
                          <TextField select fullWidth size="small" value={ltCtDoiTruong} onChange={(e) => setLtCtDoiTruong(e.target.value)}>
                            <MenuItem value="__ALL__">-- Tất cả --</MenuItem>
                            {options.team_leads.map((tl) => (
                              <MenuItem key={tl} value={tl}>{tl}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={3} md={1.2}>
                          <Button variant="contained" color="primary" fullWidth onClick={fetchLichTrucChiTiet} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5 }}>
                            Lọc
                          </Button>
                        </Grid>

                        <Grid item xs={12} sm={4} md={1.8}>
                          <Button variant="outlined" color="primary" fullWidth onClick={() => setSortBlockEnabled(!sortBlockEnabled)} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5, fontSize: '12px' }}>
                            🔤 Sort Block: {sortBlockEnabled ? 'Bật' : 'Tắt'}
                          </Button>
                        </Grid>

                        <Grid item xs={12} sm={4} md={1.2}>
                          <Button variant="contained" color="info" fullWidth onClick={() => setAddRowOpen(true)} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5 }}>
                            ➕ Thêm
                          </Button>
                        </Grid>

                        <Grid item xs={12} sm={4} md={1.2}>
                          <Button variant="outlined" color="secondary" fullWidth onClick={() => importInputRef.current && importInputRef.current.click()} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5 }}>
                            📥 Import
                          </Button>
                        </Grid>

                        <Grid item xs={12} sm={4} md={1.6}>
                          <Button variant="contained" color="success" fullWidth onClick={handleExportLichTrucCSV} startIcon={<DownloadIcon />} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5, backgroundColor: '#1e8e3e' }}>
                            Xuất CSV
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* STICKY DATA TABLE FOR 31 DAYS WITH CRUD */}
                    <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                      <TableContainer sx={{ maxHeight: 680 }}>
                        <Table stickyHeader size="small">
                          <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, zIndex: 4, backgroundColor: '#f1f5f9', minWidth: 100 }}>CodeStaff</TableCell>
                              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 100, zIndex: 4, backgroundColor: '#f1f5f9', minWidth: 150 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 250, zIndex: 4, backgroundColor: '#f1f5f9', minWidth: 130 }}>Partner</TableCell>
                              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 380, zIndex: 4, backgroundColor: '#f1f5f9', minWidth: 180, boxShadow: '2px 0 5px rgba(0,0,0,0.08)' }}>Block</TableCell>
                              
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                <TableCell key={d} align="center" sx={{ fontWeight: 700, minWidth: 45, px: 0.5 }}>
                                  Day{d}
                                </TableCell>
                              ))}
                              <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Đội Trưởng</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, minWidth: 120 }}>Thao Tác</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {ltCtData?.data
                              ?.slice()
                              .sort((a, b) => {
                                if (!sortBlockEnabled) return 0;
                                const blockA = String(a.values[3] || '');
                                const blockB = String(b.values[3] || '');
                                return blockA.localeCompare(blockB, 'vi', { numeric: true, sensitivity: 'base' });
                              })
                              .map((rowObj) => {
                                const isEditing = editingRowNumber === rowObj.row;

                                return (
                                  <TableRow key={rowObj.row} hover sx={{ backgroundColor: isEditing ? '#eff6ff' : 'inherit' }}>
                                    
                                    {/* CodeStaff */}
                                    <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, backgroundColor: isEditing ? '#eff6ff' : '#ffffff', zIndex: 2 }}>
                                      {isEditing ? (
                                        <TextField
                                          size="small"
                                          value={editingRowValues[0] || ''}
                                          onChange={(e) => {
                                            const copy = [...editingRowValues];
                                            copy[0] = e.target.value;
                                            setEditingRowValues(copy);
                                          }}
                                          sx={{ width: 90 }}
                                        />
                                      ) : rowObj.values[0]}
                                    </TableCell>

                                    {/* Name */}
                                    <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 100, backgroundColor: isEditing ? '#eff6ff' : '#ffffff', zIndex: 2 }}>
                                      {isEditing ? (
                                        <TextField
                                          size="small"
                                          value={editingRowValues[1] || ''}
                                          onChange={(e) => {
                                            const copy = [...editingRowValues];
                                            copy[1] = e.target.value;
                                            setEditingRowValues(copy);
                                          }}
                                          sx={{ width: 140 }}
                                        />
                                      ) : rowObj.values[1]}
                                    </TableCell>

                                    {/* Partner */}
                                    <TableCell sx={{ color: '#5f6368', position: 'sticky', left: 250, backgroundColor: isEditing ? '#eff6ff' : '#ffffff', zIndex: 2 }}>
                                      {isEditing ? (
                                        <TextField
                                          size="small"
                                          value={editingRowValues[2] || ''}
                                          onChange={(e) => {
                                            const copy = [...editingRowValues];
                                            copy[2] = e.target.value;
                                            setEditingRowValues(copy);
                                          }}
                                          sx={{ width: 120 }}
                                        />
                                      ) : rowObj.values[2]}
                                    </TableCell>

                                    {/* Block */}
                                    <TableCell sx={{ fontWeight: 700, color: '#1a73e8', position: 'sticky', left: 380, backgroundColor: isEditing ? '#eff6ff' : '#ffffff', zIndex: 2, boxShadow: '2px 0 5px rgba(0,0,0,0.08)' }}>
                                      {isEditing ? (
                                        <TextField
                                          size="small"
                                          value={editingRowValues[3] || ''}
                                          onChange={(e) => {
                                            const copy = [...editingRowValues];
                                            copy[3] = e.target.value;
                                            setEditingRowValues(copy);
                                          }}
                                          sx={{ width: 160 }}
                                        />
                                      ) : rowObj.values[3]}
                                    </TableCell>
                                    
                                    {/* Day1..Day31 */}
                                    {(isEditing ? editingRowValues.slice(4, 35) : rowObj.values.slice(4, 35)).map((shiftVal, sIdx) => {
                                      const isCa1 = String(shiftVal).toUpperCase() === 'CA1';
                                      return (
                                        <TableCell key={sIdx} align="center" sx={{ px: 0.3 }}>
                                          {isEditing ? (
                                            <TextField
                                              select
                                              size="small"
                                              value={String(shiftVal).toUpperCase() === 'CA1' ? 'CA1' : 'O'}
                                              onChange={(e) => {
                                                const copy = [...editingRowValues];
                                                copy[4 + sIdx] = e.target.value;
                                                setEditingRowValues(copy);
                                              }}
                                              sx={{ width: 55, '& .MuiSelect-select': { py: 0.3, px: 0.5, fontSize: '11px' } }}
                                            >
                                              <MenuItem value="CA1">Ca1</MenuItem>
                                              <MenuItem value="O">O</MenuItem>
                                            </TextField>
                                          ) : (
                                            <Chip
                                              label={isCa1 ? 'Ca1' : 'O'}
                                              size="small"
                                              sx={{
                                                height: 20,
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                backgroundColor: isCa1 ? '#dcfce7' : '#f3f4f6',
                                                color: isCa1 ? '#16a34a' : '#6b7280',
                                                borderRadius: '6px'
                                              }}
                                            />
                                          )}
                                        </TableCell>
                                      );
                                    })}
                                    
                                    {/* Đội Trưởng */}
                                    <TableCell sx={{ fontWeight: 600 }}>{rowObj.doiTruong}</TableCell>

                                    {/* Thao tác CRUD */}
                                    <TableCell align="center">
                                      {isEditing ? (
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                          <Button size="small" variant="contained" color="primary" onClick={handleSaveEditRow} sx={{ minWidth: 40, px: 1, py: 0.2, fontSize: '11px', fontWeight: 700 }}>
                                            💾
                                          </Button>
                                          <Button size="small" variant="outlined" onClick={handleCancelEditRow} sx={{ minWidth: 40, px: 1, py: 0.2, fontSize: '11px' }}>
                                            ❌
                                          </Button>
                                        </Box>
                                      ) : (
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                          <Button size="small" variant="outlined" color="primary" onClick={() => handleStartEditRow(rowObj)} sx={{ minWidth: 40, px: 1, py: 0.2, fontSize: '11px', fontWeight: 700 }}>
                                            ✏️
                                          </Button>
                                          <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteRow(rowObj.row)} sx={{ minWidth: 40, px: 1, py: 0.2, fontSize: '11px' }}>
                                            🗑️
                                          </Button>
                                        </Box>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>

                    {/* ADD ROW DIALOG MODAL */}
                    <Dialog open={addRowOpen} onClose={() => setAddRowOpen(false)} maxWidth="xs" fullWidth>
                      <DialogTitle sx={{ fontWeight: 800 }}>➕ Thêm Dòng Lịch Trực Mới</DialogTitle>
                      <DialogContent dividers>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
                          <Box>
                            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Mail *</FormLabel>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="vd: PNC01.NHANHT6@fpt.com"
                              value={addRowData.mail}
                              onChange={(e) => setAddRowData({ ...addRowData, mail: e.target.value })}
                            />
                          </Box>

                          <Box>
                            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Mã Nhân Viên (CodeStaff)</FormLabel>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="vd: 280558"
                              value={addRowData.code}
                              onChange={(e) => setAddRowData({ ...addRowData, code: e.target.value })}
                            />
                          </Box>

                          <Box>
                            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Họ và Tên (Name)</FormLabel>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="vd: Cao Tiến Triều"
                              value={addRowData.name}
                              onChange={(e) => setAddRowData({ ...addRowData, name: e.target.value })}
                            />
                          </Box>

                          <Box>
                            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Đối Tác (Partner)</FormLabel>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="vd: Phương Nam-01"
                              value={addRowData.partner}
                              onChange={(e) => setAddRowData({ ...addRowData, partner: e.target.value })}
                            />
                          </Box>

                          <Box>
                            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Block</FormLabel>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="vd: Phuong Long Truong-002"
                              value={addRowData.block}
                              onChange={(e) => setAddRowData({ ...addRowData, block: e.target.value })}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Tháng</FormLabel>
                              <TextField
                                type="number"
                                fullWidth
                                size="small"
                                value={addRowData.month}
                                onChange={(e) => setAddRowData({ ...addRowData, month: Number(e.target.value) })}
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Năm</FormLabel>
                              <TextField
                                type="number"
                                fullWidth
                                size="small"
                                value={addRowData.year}
                                onChange={(e) => setAddRowData({ ...addRowData, year: Number(e.target.value) })}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </DialogContent>
                      <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setAddRowOpen(false)} variant="outlined">Hủy</Button>
                        <Button onClick={handleAddRowSubmit} variant="contained" color="primary">Thêm Dòng</Button>
                      </DialogActions>
                    </Dialog>

                  </Box>
                )}

                {/* THRESHOLD SETTINGS DIALOG */}
                <Dialog open={thresholdModalOpen} onClose={() => setThresholdModalOpen(false)} maxWidth="xs" fullWidth>
                  <DialogTitle sx={{ fontWeight: 800 }}>⚙️ Cấu Hình Ngưỡng Cảnh Báo Màu</DialogTitle>
                  <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                      <Box>
                        <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>
                          Tỉ lệ Trực tối thiểu (%) — tô đỏ toàn dòng nếu THẤP HƠN
                        </FormLabel>
                        <TextField
                          type="number"
                          fullWidth
                          size="small"
                          value={tempTiLeTrucMin}
                          onChange={(e) => setTempTiLeTrucMin(e.target.value)}
                        />
                      </Box>

                      <Box>
                        <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>
                          Tồn/NS tối đa — tô cam ô Tồn/NS nếu CAO HƠN
                        </FormLabel>
                        <TextField
                          type="number"
                          fullWidth
                          size="small"
                          value={tempTonPerNsMax}
                          onChange={(e) => setTempTonPerNsMax(e.target.value)}
                        />
                      </Box>
                    </Box>
                  </DialogContent>
                  <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setThresholdModalOpen(false)} variant="outlined">Hủy</Button>
                    <Button onClick={handleSaveThresholds} variant="contained" color="primary">Lưu Ngưỡng</Button>
                  </DialogActions>
                </Dialog>

              </Box>
            )}

            {/* ========================================================================= */}
            {/* VIEW 3: QUẢN LÝ TỒN TK-BT                                                */}
            {/* ========================================================================= */}
            {currentNav === 'ton_tk_bt' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* TỒN TK-BT METRICS SUMMARY - FULL WIDTH GRID */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, width: '100%' }}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #d2e3fc', borderLeft: '6px solid #1a73e8', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="overline" sx={{ color: '#1a73e8', fontWeight: 800 }}>
                        TỔNG TỒN CHI NHÁNH SG01
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a73e8', mt: 0.5 }}>
                        {totalBacklogSummary.total} Phiếu
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                        Đang trong tiến trình xử lý
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #b2dfdb', borderLeft: '6px solid #00897b', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="overline" sx={{ color: '#00897b', fontWeight: 800 }}>
                        TỒN TRIỂN KHAI (TK)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#00897b', mt: 0.5 }}>
                        {totalBacklogSummary.total_tk} Phiếu
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                        Chờ thi công lắp đặt
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #ffe0b2', borderLeft: '6px solid #f57c00', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="overline" sx={{ color: '#e65100', fontWeight: 800 }}>
                        TỒN BẢO TRÌ (BT)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#e65100', mt: 0.5 }}>
                        {totalBacklogSummary.total_bt} Phiếu
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                        Chờ xử lý sự cố hạ tầng / KHA
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #fce8e6', borderLeft: '6px solid #d93025', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="overline" sx={{ color: '#d93025', fontWeight: 800 }}>
                        CẢNH BÁO QUÁ HẠN &gt;48H
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#d93025', mt: 0.5 }}>
                        {totalBacklogSummary.total_qua_48h} Phiếu
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#d93025', fontWeight: 700, display: 'block', mt: 0.5 }}>
                        ⚠️ Cần Đội trưởng hỗ trợ ngay
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* BACKLOG TABLE BY TEAM LEAD & REGION */}
                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                  <Box sx={{ p: 2.5, backgroundColor: '#fafafa', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124' }}>
                      BẢNG TỔNG HỢP TỒN THEO ĐỘI TRƯỜNG & VÙNG
                    </Typography>
                    <Chip label={`Cảnh báo: ${totalBacklogSummary.total_qua_48h} ca nguy cơ`} color="error" size="small" sx={{ fontWeight: 700 }} />
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead sx={{ backgroundColor: '#f1f3f4' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>STT</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Đội Trưởng Quản Lý</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Vùng Phụ Trách</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Tồn Triển Khai (TK)</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Tồn Bảo Trì (BT)</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Tổng Tồn</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Tồn &gt;24h</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Tồn &gt;48h (Cảnh Báo)</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Mức Độ Rủi Ro</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backlogData.map((row, idx) => (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#202124' }}>{row.team_lead}</TableCell>
                            <TableCell>
                              <Chip label={row.region} size="small" sx={{ backgroundColor: '#e8f0fe', color: '#1a73e8', fontWeight: 600 }} />
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#00897b' }}>{row.ton_tk}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#e65100' }}>{row.ton_bt}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: '#1a73e8' }}>{row.ton_tong}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#b06000' }}>{row.ton_qua_24h}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: row.ton_qua_48h > 0 ? '#d93025' : '#5f6368' }}>
                              {row.ton_qua_48h}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={row.risk_level}
                                size="small"
                                color={row.risk_level === 'Cao' ? 'error' : row.risk_level === 'Trung bình' ? 'warning' : 'success'}
                                sx={{ fontWeight: 800, height: 22, fontSize: '11px' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

              </Box>
            )}

          </Box>
        </Box>

        {/* TRANSACTION TYPES MODAL */}
        <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124' }}>
              CHI TIẾT KHỐI LƯỢNG TỪNG LOẠI GIAO DỊCH (SG01)
            </Typography>
            <IconButton onClick={() => setDetailModalOpen(false)}><CloseIcon /></IconButton>
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
                  {summary.all_tx_type_counts && Object.keys(summary.all_tx_type_counts).length > 0 ? (
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
            <Button onClick={() => setDetailModalOpen(false)} variant="contained" color="primary" sx={{ borderRadius: '18px', textTransform: 'none', px: 3 }}>
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* EMPLOYEE TICKET DETAILS DRAWER */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: { xs: '100%', md: 800 }, p: 3 } }}
        >
          {selectedEmployee && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#202124' }}>
                    {selectedEmployee.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5f6368' }}>
                    Account: <strong>{selectedEmployee.account}</strong> | Mã NV: <strong>{selectedEmployee.code}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                    Đội Trưởng: {selectedEmployee.team_lead} | Vùng: {selectedEmployee.region}
                  </Typography>
                </Box>
                <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                <Tab label={`Triển Khai (TK) (${empDetails?.tk_tickets?.length || 0})`} />
                <Tab label={`Bảo Trì (BT) (${empDetails?.bt_tickets?.length || 0})`} />
              </Tabs>

              {loadingDetails ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : activeTab === 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Gói / Loại Giao Dịch</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>TG Tạo / Hoàn Tất</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>RT</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Đúng Hẹn</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {empDetails?.tk_tickets?.map((t, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {t.contract_no}
                            {t.is_gsafe && <Chip label="Gsafe" size="small" color="error" sx={{ ml: 1, height: 18, fontSize: '10px' }} />}
                            {t.is_swap && <Chip label="Swap" size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: '10px' }} />}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{t.service_package}</Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368' }}>{t.tx_type}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ display: 'block' }}>Tạo: {t.dt_created}</Typography>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>Xong: {t.dt_complete}</Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ color: '#1a73e8', fontWeight: 600 }}>
                            {t.rt_fmt}
                          </TableCell>
                          <TableCell align="center">
                            {t.dung_hen === 1 ? (
                              <Chip label="Đúng" size="small" color="success" sx={{ height: 20 }} />
                            ) : (
                              <Chip label="Trễ" size="small" color="error" sx={{ height: 20 }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>TG Tạo / Hoàn Tất</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>RT</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Đúng Hẹn</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {empDetails?.bt_tickets?.map((t, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 600 }}>{t.contract_no}</TableCell>
                          <TableCell>{t.customer_name}</TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ display: 'block' }}>Tạo: {t.dt_created}</Typography>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>Xong: {t.dt_complete}</Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ color: '#00897b', fontWeight: 600 }}>
                            {t.rt_fmt}
                          </TableCell>
                          <TableCell align="center">
                            {t.dung_hen === 1 ? (
                              <Chip label="Đúng" size="small" color="success" sx={{ height: 20 }} />
                            ) : (
                              <Chip label="Trễ" size="small" color="error" sx={{ height: 20 }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

            </Box>
          )}
        </Drawer>

      </Box>
    </ThemeProvider>
  );
}
