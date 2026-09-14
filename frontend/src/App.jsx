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
  LinearProgress,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';

import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Download as DownloadIcon,
  FileUpload as FileUploadIcon,
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
  Add as AddIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Lock as LockIcon,
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Badge as BadgeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  VpnKey as VpnKeyIcon
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
  const [btDetailModalOpen, setBtDetailModalOpen] = useState(false);

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

  // Lịch Sử Thay Đổi Tab States
  const [ltHistMonth, setLtHistMonth] = useState(new Date().getMonth() + 1);
  const [ltHistYear, setLtHistYear] = useState(new Date().getFullYear());
  const [ltHistDoiTruong, setLtHistDoiTruong] = useState('__ALL__');
  const [ltHistSearch, setLtHistSearch] = useState('');
  const [ltHistLimit2Only, setLtHistLimit2Only] = useState(false);
  const [ltHistData, setLtHistData] = useState(null);
  const [ltHistLoading, setLtHistLoading] = useState(false);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedStaffTimeline, setSelectedStaffTimeline] = useState(null);

  // Tồn TK-BT System States
  const [tonTkBtData, setTonTkBtData] = useState(null);
  const [tonTkBtLoading, setTonTkBtLoading] = useState(false);
  const [tonTkBtSubTab, setTonTkBtSubTab] = useState('summary'); // 'summary' | 'details'
  const [tonTkBtDoiTruong, setTonTkBtDoiTruong] = useState('__ALL__');
  const [tonTkBtBlockFilter, setTonTkBtBlockFilter] = useState('__ALL__');
  const [tonTkBtTypeFilter, setTonTkBtTypeFilter] = useState('ALL'); // 'ALL' | 'TK' | 'BT'
  const [tonTkBtCondFilter, setTonTkBtCondFilter] = useState('ALL'); // 'ALL' | 'TK_72H' | 'BT_24H'
  const [tonTkBtNoteFilter, setTonTkBtNoteFilter] = useState('ALL'); // 'ALL' | 'HAS_NOTE' | 'NO_NOTE'
  const [tonTkBtSearch, setTonTkBtSearch] = useState('');
  
  // Modals for Tồn TK-BT
  const [over72hModalOpen, setOver72hModalOpen] = useState(false);
  const [over24hModalOpen, setOver24hModalOpen] = useState(false);
  const [noteDetailModalOpen, setNoteDetailModalOpen] = useState(false);
  const [selectedNoteItem, setSelectedNoteItem] = useState(null);

  // Import Tồn TK-BT States
  const [importTonModalOpen, setImportTonModalOpen] = useState(false);
  const [importTonMode, setImportTonMode] = useState('AUTO'); // 'AUTO' | 'TK' | 'BT'
  const [importingTon, setImportingTon] = useState(false);
  const [importTonResult, setImportTonResult] = useState(null);
  const tonImportInputRef = useRef(null);

  // ================= ADMIN & AUTH SYSTEM STATES =================
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('kpi_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState(0); // 0: Login, 1: Register, 2: Setup Pass
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regMail, setRegMail] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [hrCheckResult, setHrCheckResult] = useState(null);

  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');

  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Admin Page States
  const [adminSubTab, setAdminSubTab] = useState(0); // 0: HR List, 1: Admin Users Table, 2: Import DB

  // Topic 1: HR List States
  const [hrList, setHrList] = useState([]);
  const [hrLoading, setHrLoading] = useState(false);
  const [hrSearch, setHrSearch] = useState('');
  const [hrBlockFilter, setHrBlockFilter] = useState('__ALL__');
  const [hrTlFilter, setHrTlFilter] = useState('__ALL__');

  // Topic 2: Admin Users Table States
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null for Add, user object for Edit
  const [userForm, setUserForm] = useState({
    msnv: '', name: '', mail: '', user: '', password: '', role: 'user'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await axios.post('/api/admin/login', { login_id: loginId, password: loginPassword });
      if (res.data && res.data.ok) {
        const u = res.data.user;
        localStorage.setItem('kpi_current_user', JSON.stringify(u));
        setCurrentUser(u);
        setAuthModalOpen(false);
        setCurrentNav('admin');
        fetchAdminUsers();
      } else {
        setAuthError(res.data?.error || 'Đăng nhập thất bại!');
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || err.message || 'Lỗi kết nối tới máy chủ!');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSetupInitialAdminPassword = async (e) => {
    if (e) e.preventDefault();
    if (!setupPassword || setupPassword.length < 4) {
      setAuthError('Mật khẩu mới phải có ít nhất 4 ký tự!');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setAuthError('Xác nhận mật khẩu không khớp!');
      return;
    }
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await axios.post('/api/admin/setup-initial-password', {
        login_id: 'phuongnam.phongnh5@fpt.net',
        password: setupPassword
      });
      if (res.data && res.data.ok) {
        alert("Đã cài đặt mật khẩu admin thành công! Vui lòng đăng nhập với mật khẩu mới.");
        setLoginId('phuongnam.phongnh5@fpt.net');
        setLoginPassword(setupPassword);
        setAuthTab(0);
      } else {
        setAuthError(res.data?.error || 'Cài đặt mật khẩu thất bại!');
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || err.message || 'Lỗi kết nối!');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckHrEmail = async (email) => {
    if (!email || !email.includes('@')) return;
    try {
      const res = await axios.post('/api/admin/check-hr-email', { email });
      if (res.data && res.data.ok && res.data.found) {
        setHrCheckResult(res.data);
      } else {
        setHrCheckResult(null);
      }
    } catch {
      setHrCheckResult(null);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!regMail || !regPassword) {
      setAuthError('Vui lòng nhập Email và Mật khẩu!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError('Xác nhận mật khẩu không khớp!');
      return;
    }
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await axios.post('/api/admin/register', {
        mail: regMail,
        user: regUser,
        password: regPassword
      });
      if (res.data && res.data.ok) {
        const u = res.data.user;
        alert(res.data.message || 'Đăng ký tài khoản thành công!');
        localStorage.setItem('kpi_current_user', JSON.stringify(u));
        setCurrentUser(u);
        setAuthModalOpen(false);
        setCurrentNav('admin');
        fetchAdminUsers();
      } else {
        setAuthError(res.data?.error || 'Đăng ký tài khoản thất bại!');
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || err.message || 'Lỗi kết nối!');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kpi_current_user');
    setCurrentUser(null);
    setCurrentNav('kpis');
  };

  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data) setAdminUsers(res.data);
    } catch (err) {
      console.error("Fetch admin users error:", err);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const fetchAdminHrList = async () => {
    setHrLoading(true);
    try {
      const res = await axios.get('/api/admin/hr-list', {
        params: { search: hrSearch, block: hrBlockFilter, team_lead: hrTlFilter }
      });
      if (res.data) setHrList(res.data);
    } catch (err) {
      console.error("Fetch HR list error:", err);
    } finally {
      setHrLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.mail || (!editingUser && !userForm.password)) {
      alert("Vui lòng điền đầy đủ Email và Mật khẩu!");
      return;
    }
    try {
      if (editingUser) {
        const res = await axios.post('/api/admin/users/update', {
          user_id: editingUser.id,
          msnv: userForm.msnv,
          name: userForm.name,
          mail: userForm.mail,
          user: userForm.user,
          password: userForm.password,
          role: userForm.role
        });
        if (res.data && res.data.ok) {
          alert(res.data.message);
          setUserModalOpen(false);
          fetchAdminUsers();
        } else alert(res.data?.error || "Lỗi cập nhật!");
      } else {
        const res = await axios.post('/api/admin/users/add', userForm);
        if (res.data && res.data.ok) {
          alert(res.data.message);
          setUserModalOpen(false);
          fetchAdminUsers();
        } else alert(res.data?.error || "Lỗi thêm user!");
      }
    } catch (err) {
      alert("Lỗi khi lưu tài khoản!");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await axios.post('/api/admin/users/delete', { user_id: userToDelete.id });
      if (res.data && res.data.ok) {
        alert(res.data.message);
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
        fetchAdminUsers();
      } else alert(res.data?.error || "Lỗi xóa user!");
    } catch {
      alert("Lỗi kết nối khi xóa!");
    }
  };

  const handleImportTonFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setImportingTon(true);
    setImportTonResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', importTonMode);

    try {
      const res = await axios.post('/api/kpi/ton-tk-bt/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.ok) {
        setImportTonResult({ ok: true, msg: res.data.message });
        fetchTonTkBtDashboard();
      } else {
        setImportTonResult({ ok: false, msg: res.data.error || 'Có lỗi xảy ra khi xử lý file!' });
      }
    } catch (err) {
      console.error("Import Tồn TK-BT error:", err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message || "Lỗi kết nối tới máy chủ khi tải file!";
      setImportTonResult({ ok: false, msg: `Lỗi gửi dữ liệu: ${errMsg}` });
    } finally {
      setImportingTon(false);
      e.target.value = '';
    }
  };

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
    fetchTonTkBtDashboard();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, selectedTeamLead, selectedRegion, searchQuery]);

  useEffect(() => {
    if (currentNav === 'lich_truc') {
      fetchLichTrucThresholds();
      if (ltTab === 'dashboard') {
        fetchLichTrucDashboard();
      } else if (ltTab === 'chitiet') {
        fetchLichTrucChiTiet();
      } else if (ltTab === 'history') {
        fetchLichTrucHistory();
      }
    } else if (currentNav === 'ton_tk_bt') {
      fetchTonTkBtDashboard();
    } else if (currentNav === 'admin') {
      fetchAdminUsers();
      fetchAdminHrList();
    }
  }, [currentNav, ltTab, adminSubTab]);

  useEffect(() => {
    if (currentNav === 'admin' && adminSubTab === 0) {
      fetchAdminHrList();
    }
  }, [hrSearch, hrBlockFilter, hrTlFilter, currentNav, adminSubTab]);

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

  // Fetch Lịch Trực History
  const fetchLichTrucHistory = async () => {
    setLtHistLoading(true);
    try {
      const res = await axios.get('/api/lich-truc/history', {
        params: {
          month: ltHistMonth,
          year: ltHistYear,
          doi_truong: ltHistDoiTruong,
          search: ltHistSearch,
          limit_latest: ltHistLimit2Only
        }
      });
      setLtHistData(res.data);
    } catch (err) {
      console.error("Failed to fetch Lịch Trực history:", err);
    } finally {
      setLtHistLoading(false);
    }
  };

  const handleExportHistoryCSV = () => {
    if (!ltHistData || !ltHistData.data || ltHistData.data.length === 0) {
      alert("Không có dữ liệu lịch sử để xuất!");
      return;
    }
    const headers = ["STT", "Thời Gian Ghi Nhận", "Mốc Quét", "Mã NV", "Họ Tên", "Email", "Block", "Đội Trưởng", "Ngày Đổi", "Trạng Thái Cũ", "Trạng Thái Mới", "Biến Động"];
    const rows = ltHistData.data.map((r, i) => [
      i + 1,
      r.timeDisplay || r.timestamp,
      r.milestone || 'Tự động',
      r.codeStaff,
      r.name,
      r.mail,
      r.block,
      r.doiTruong,
      r.dateStr,
      r.oldVal,
      r.newVal,
      r.changeType
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Lich_Su_Thay_Doi_Lich_Truc_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch Tồn TK-BT Dashboard Data
  const fetchTonTkBtDashboard = async () => {
    setTonTkBtLoading(true);
    try {
      const res = await axios.get('/api/kpi/ton-tk-bt/dashboard');
      setTonTkBtData(res.data);
    } catch (err) {
      console.error("Failed to fetch Tồn TK-BT dashboard:", err);
    } finally {
      setTonTkBtLoading(false);
    }
  };

  useEffect(() => {
    if (currentNav === 'ton_tk_bt' && !tonTkBtData) {
      fetchTonTkBtDashboard();
    }
  }, [currentNav]);

  // Dynamic Top Stat Cards Metrics based on Active Filters (Đội Trưởng & Block)
  const dynamicTonTkBtMetrics = useMemo(() => {
    if (!tonTkBtData) {
      return {
        totalAll: 0,
        totalTK: 0,
        totalBT: 0,
        countTK72h: 0,
        countBT24h: 0,
        hasNoteCount: 0,
        notePct: 0,
        filteredTkList: [],
        filteredBtList: []
      };
    }

    const tkList = tonTkBtData.tkList || [];
    const btList = tonTkBtData.btList || [];

    const norm = (s) => (s || '').toString().normalize('NFC').trim();

    const filterItem = (item) => {
      if (tonTkBtDoiTruong !== '__ALL__' && norm(item.doiTruong) !== norm(tonTkBtDoiTruong)) return false;
      if (tonTkBtBlockFilter !== '__ALL__' && item.block !== tonTkBtBlockFilter) return false;
      return true;
    };

    const filteredTk = tkList.filter(filterItem);
    const filteredBt = btList.filter(filterItem);

    const totalTK = filteredTk.length;
    const totalBT = filteredBt.length;
    const totalAll = totalTK + totalBT;

    const countTK72h = filteredTk.filter(r => r.isOver72h).length;
    const countBT24h = filteredBt.filter(r => r.isOver24h).length;

    const hasNoteCount = filteredTk.filter(r => r.hasNote).length + filteredBt.filter(r => r.hasNote).length;
    const notePct = totalAll > 0 ? Math.round((hasNoteCount / totalAll) * 1000) / 10 : 0;

    return {
      totalAll,
      totalTK,
      totalBT,
      countTK72h,
      countBT24h,
      hasNoteCount,
      notePct,
      filteredTkList: filteredTk,
      filteredBtList: filteredBt
    };
  }, [tonTkBtData, tonTkBtDoiTruong, tonTkBtBlockFilter]);

  // Combined Backlog Tickets & Filtering
  const filteredBacklogDetails = useMemo(() => {
    if (!tonTkBtData) return [];
    const tkList = tonTkBtData.tkList || [];
    const btList = tonTkBtData.btList || [];
    let combined = [];

    if (tonTkBtTypeFilter === 'ALL') {
      combined = [...tkList, ...btList];
    } else if (tonTkBtTypeFilter === 'TK') {
      combined = [...tkList];
    } else if (tonTkBtTypeFilter === 'BT') {
      combined = [...btList];
    }

    const searchKw = tonTkBtSearch.trim().toUpperCase();
    const norm = (s) => (s || '').toString().normalize('NFC').trim();

    return combined.filter(item => {
      if (tonTkBtTypeFilter === 'TK' && item.type !== 'TK') return false;
      if (tonTkBtTypeFilter === 'BT' && item.type !== 'BT') return false;

      if (tonTkBtDoiTruong !== '__ALL__' && norm(item.doiTruong) !== norm(tonTkBtDoiTruong)) return false;
      if (tonTkBtBlockFilter !== '__ALL__' && item.block !== tonTkBtBlockFilter) return false;

      if (tonTkBtCondFilter === 'TK_72H') {
        if (item.type !== 'TK' || !item.isOver72h) return false;
      } else if (tonTkBtCondFilter === 'BT_24H') {
        if (item.type !== 'BT' || !item.isOver24h) return false;
      }

      if (tonTkBtNoteFilter === 'HAS_NOTE' && !item.hasNote) return false;
      if (tonTkBtNoteFilter === 'NO_NOTE' && item.hasNote) return false;

      if (searchKw) {
        const text = `${item.soHd} ${item.tenKh} ${item.block} ${item.nhanSu} ${item.loaiGd}`.toUpperCase();
        if (!text.includes(searchKw)) return false;
      }

      return true;
    });
  }, [tonTkBtData, tonTkBtDoiTruong, tonTkBtBlockFilter, tonTkBtTypeFilter, tonTkBtCondFilter, tonTkBtNoteFilter, tonTkBtSearch]);

  const handleExportBacklogCSV = () => {
    if (!filteredBacklogDetails || filteredBacklogDetails.length === 0) {
      alert("Không có dữ liệu phiếu tồn để xuất!");
      return;
    }
    const headers = ["STT", "Phân Loại", "Số HĐ", "Tên Khách Hàng", "Block", "Đội Trưởng", "Nhân Sự", "Loại Giao Dịch / Tình Trạng", "Thời Gian Tạo", "Tồn (Giờ)", "Điều Kiện", "Trạng Thái Ghi Chú", "Nội Dung Ghi Chú"];
    const rows = filteredBacklogDetails.map((r, i) => [
      i + 1,
      r.typeLabel,
      r.soHd,
      r.tenKh,
      r.block,
      r.doiTruong,
      r.nhanSu,
      r.loaiGd,
      r.createdAt,
      r.tonHrs,
      r.type === 'TK' ? (r.isOver72h ? '>72H' : '<=72H') : (r.isOver24h ? '>24H' : '<=24H'),
      r.noteStatus,
      r.noteContent
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Ton_TK_BT_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    },
    {
      id: 'admin',
      label: 'Quản Trị',
      sublabel: 'Trang Quản Trị Hệ Thống (Admin)',
      icon: <AdminPanelSettingsIcon />
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
                  if (item.id === 'admin' && !currentUser) {
                    setAuthError(null);
                    setAuthModalOpen(true);
                  } else {
                    setCurrentNav(item.id);
                  }
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

                      <Button
                        size="small"
                        startIcon={<InfoIcon sx={{ fontSize: '15px !important' }} />}
                        onClick={() => setBtDetailModalOpen(true)}
                        sx={{
                          mt: 1,
                          p: 0,
                          textTransform: 'none',
                          fontWeight: 700,
                          color: '#00897b',
                          fontSize: '12px',
                          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                        }}
                      >
                        Chi tiết loại phiếu bảo trì
                      </Button>
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
                                <Typography variant="body2" sx={{
                                  fontWeight: 800,
                                  color: (emp.rt_tk_hours !== null && emp.rt_tk_hours !== undefined && !isNaN(emp.rt_tk_hours))
                                    ? (emp.rt_tk_hours <= 18.0 ? '#2e7d32' : '#d32f2f')
                                    : '#5f6368'
                                }}>
                                  {emp.rt_tk_fmt || '-'}
                                </Typography>
                              </TableCell>

                              <TableCell align="center" sx={{ borderRight: '1px solid #ffe0b2' }}>
                                <Typography variant="body2" sx={{
                                  fontWeight: 800,
                                  color: (emp.rt_bt_hours !== null && emp.rt_bt_hours !== undefined && !isNaN(emp.rt_bt_hours))
                                    ? (emp.rt_bt_hours <= 8.0 ? '#2e7d32' : '#d32f2f')
                                    : '#5f6368'
                                }}>
                                  {emp.rt_bt_fmt || '-'}
                                </Typography>
                              </TableCell>

                              {/* CLL30N Column */}
                              <TableCell align="center" sx={{ backgroundColor: '#fcf8fe', borderRight: '1px solid #e1bee7' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: emp.cll30n_status === 'PASS' ? '#2e7d32' : '#d32f2f' }}>
                                    {emp.cll30n_pct || 0}%
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#5f6368', fontSize: '10px' }}>
                                    {emp.kh_cls_count > 0 ? `(${emp.cll30n_count || 0}/${emp.kh_cls_count} HĐ)` : `(${emp.cll30n_count || 0} HĐ)`}
                                  </Typography>
                                </Box>
                              </TableCell>

                              {/* Total Đúng Hẹn Percentage Column */}
                              <TableCell align="center" sx={{ backgroundColor: '#f6fbf7' }}>
                                <Chip
                                  label={emp.total_dung_hen_pct >= 97.2 ? `${emp.total_dung_hen_pct || 0}% Đạt` : `${emp.total_dung_hen_pct || 0}% Không Đạt`}
                                  size="small"
                                  color={emp.total_dung_hen_pct >= 97.2 ? 'success' : 'error'}
                                  sx={{ fontWeight: 800, borderRadius: '12px' }}
                                />
                              </TableCell>

                              <TableCell align="center" sx={{ color: emp.tk_dung_hen_pct >= 97.2 ? '#2e7d32' : '#d32f2f', fontWeight: 800 }}>
                                {emp.tk_dung_hen_pct || 0}%
                              </TableCell>
                              <TableCell align="center" sx={{ color: emp.bt_dung_hen_pct >= 97.2 ? '#2e7d32' : '#d32f2f', fontWeight: 800, borderRight: '1px solid #ceead6' }}>
                                {emp.bt_dung_hen_pct || 0}%
                              </TableCell>

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
                    <Dialog open={timelineModalOpen} onClose={() => setTimelineModalOpen(false)} maxWidth="sm" fullWidth>
                      <DialogTitle sx={{ fontWeight: 800, color: '#1a73e8', borderBottom: '1px solid #e0e0e0' }}>
                        ⏱ Timeline Diễn Biến Ca Trực — {selectedStaffTimeline?.name}
                      </DialogTitle>
                      <DialogContent dividers>
                        {selectedStaffTimeline && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                              <Typography variant="body2"><b>Mã NV / Email:</b> {selectedStaffTimeline.codeStaff} - {selectedStaffTimeline.mail}</Typography>
                              <Typography variant="body2"><b>Block:</b> {selectedStaffTimeline.block} ({selectedStaffTimeline.doiTruong})</Typography>
                              <Typography variant="body2"><b>Ngày bị ảnh hưởng:</b> {selectedStaffTimeline.dateStr}</Typography>
                            </Box>

                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mt: 1 }}>
                              Lịch Sử Chi Tiết Biến Động
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              {ltHistData?.data
                                ?.filter(r => r.mail === selectedStaffTimeline.mail && r.day === selectedStaffTimeline.day && r.month === selectedStaffTimeline.month && r.year === selectedStaffTimeline.year)
                                .map((ev, idx) => (
                                  <Box key={ev.id || idx} sx={{ p: 2, borderRadius: 2, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                                        {ev.timeDisplay || ev.timestamp} ({ev.milestone || 'Tự động'})
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                                        Biến động: <span style={{ color: ev.changeType === 'CA1 ➔ OFF' ? '#e65100' : '#2e7d32' }}>{ev.oldVal} ➔ {ev.newVal}</span>
                                      </Typography>
                                    </Box>
                                    <Chip label={`Lần ${idx + 1}`} size="small" color="primary" variant="outlined" />
                                  </Box>
                                ))}
                            </Box>
                          </Box>
                        )}
                      </DialogContent>
                      <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setTimelineModalOpen(false)} variant="contained">Đóng</Button>
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
            {/* VIEW 3: QUẢN LÝ TỒN TK-BT (REAL-TIME DASHBOARD)                            */}
            {/* ========================================================================= */}
            {currentNav === 'ton_tk_bt' && (
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
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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

                        <Grid item xs={12} sm={6} md={2.5}>
                          <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Tìm Kiếm</FormLabel>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Nhập SHD, Tên KH, Block, KTV..."
                            value={tonTkBtSearch}
                            onChange={(e) => setTonTkBtSearch(e.target.value)}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', gap: 1, mt: 2.5 }}>
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
                <Dialog open={over72hModalOpen} onClose={() => setOver72hModalOpen(false)} maxWidth="md" fullWidth>
                  <DialogTitle sx={{ fontWeight: 800, color: '#d93025', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🚨 CHI TIẾT PHIẾU TỒN TRIỂN KHAI &gt;72H</span>
                    <Chip label={`${dynamicTonTkBtMetrics.countTK72h} Ca vi phạm`} color="error" size="small" sx={{ fontWeight: 700 }} />
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
                          {dynamicTonTkBtMetrics.filteredTkList
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
                                    onClick={() => {
                                      setSelectedNoteItem(row);
                                      setNoteDetailModalOpen(true);
                                    }}
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
                    <Button onClick={() => setOver72hModalOpen(false)} variant="contained" color="primary">Đóng</Button>
                  </DialogActions>
                </Dialog>

                {/* MODAL 2: SHOW CHI TIẾT TỒN BẢO TRÌ >24H */}
                <Dialog open={over24hModalOpen} onClose={() => setOver24hModalOpen(false)} maxWidth="md" fullWidth>
                  <DialogTitle sx={{ fontWeight: 800, color: '#e65100', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⚠️ CHI TIẾT PHIẾU TỒN BẢO TRÌ &gt;24H</span>
                    <Chip label={`${dynamicTonTkBtMetrics.countBT24h} Ca quá hạn`} color="warning" size="small" sx={{ fontWeight: 700, backgroundColor: '#e65100', color: '#fff' }} />
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
                          {dynamicTonTkBtMetrics.filteredBtList
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
                                    onClick={() => {
                                      setSelectedNoteItem(row);
                                      setNoteDetailModalOpen(true);
                                    }}
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
                    <Button onClick={() => setOver24hModalOpen(false)} variant="contained" color="primary">Đóng</Button>
                  </DialogActions>
                </Dialog>

                {/* MODAL 3: XEM CHI TIẾT NỘI DUNG GHI CHÚ HỢP ĐỒNG */}
                <Dialog open={noteDetailModalOpen} onClose={() => setNoteDetailModalOpen(false)} maxWidth="sm" fullWidth>
                  <DialogTitle sx={{ fontWeight: 800, color: '#1a73e8', borderBottom: '1px solid #e0e0e0' }}>
                    📝 CHI TIẾT GHI CHÚ HỢP ĐỒNG — {selectedNoteItem?.soHd}
                  </DialogTitle>
                  <DialogContent dividers>
                    {selectedNoteItem && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <Typography variant="body2"><b>Số HĐ:</b> {selectedNoteItem.soHd}</Typography>
                          <Typography variant="body2"><b>Khách Hàng:</b> {selectedNoteItem.tenKh}</Typography>
                          <Typography variant="body2"><b>Phân Loại:</b> {selectedNoteItem.typeLabel} ({selectedNoteItem.loaiGd})</Typography>
                          <Typography variant="body2"><b>Block:</b> {selectedNoteItem.block} (Đội trưởng: {selectedNoteItem.doiTruong})</Typography>
                          <Typography variant="body2"><b>Nhân Viên (KTV):</b> {selectedNoteItem.nhanSu || '(Chưa phân công)'}</Typography>
                          <Typography variant="body2"><b>TG Tạo / Tồn:</b> {selectedNoteItem.createdAt} ({selectedNoteItem.tonHrs} Giờ)</Typography>
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mt: 1 }}>
                          Nội Dung Ghi Chú Chi Tiết:
                        </Typography>

                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: '#fffbe6', border: '1px solid #ffe58f', minHeight: 100 }}>
                          {selectedNoteItem.hasNote ? (
                            <Typography variant="body2" sx={{ whitespace: 'pre-wrap', color: '#78350f', fontFamily: 'monospace' }}>
                              {selectedNoteItem.noteContent}
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#d97706', fontStyle: 'italic' }}>
                              ⚠️ Chưa có nội dung ghi chú được nhập cho phiếu tồn này.
                            </Typography>
                          )}
                        </Paper>
                      </Box>
                    )}
                  </DialogContent>
                  <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setNoteDetailModalOpen(false)} variant="contained">Đóng</Button>
                  </DialogActions>
                </Dialog>

                {/* MODAL 4: IMPORT DATA TỒN TK-BT */}
                <Dialog open={importTonModalOpen} onClose={() => !importingTon && setImportTonModalOpen(false)} maxWidth="sm" fullWidth>
                  <DialogTitle sx={{ fontWeight: 800, color: '#1a73e8', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📥 IMPORT DỮ LIỆU TỒN TRIỂN KHAI & BẢO TRÌ</span>
                    <IconButton size="small" onClick={() => setImportTonModalOpen(false)} disabled={importingTon}><CloseIcon /></IconButton>
                  </DialogTitle>
                  <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Typography variant="body2" sx={{ color: '#5f6368' }}>
                        Tải file CSV hoặc Excel (.xlsx, .xls) chứa danh sách phiếu Tồn mới nhất để tính toán lại toàn bộ Dashboard. Dữ liệu cũ sẽ được ghi đè bằng file mới.
                      </Typography>

                      <Box>
                        <FormLabel sx={{ fontSize: '13px', fontWeight: 700, color: '#202124', display: 'block', mb: 1 }}>
                          Phân Loại Dataset File Import:
                        </FormLabel>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={importTonMode}
                          onChange={(e) => setImportTonMode(e.target.value)}
                          disabled={importingTon}
                        >
                          <MenuItem value="AUTO">✨ Tự động nhận diện (Triển khai / Bảo trì)</MenuItem>
                          <MenuItem value="TK">📂 File Tồn Triển Khai (TK)</MenuItem>
                          <MenuItem value="BT">🛠️ File Tồn Bảo Trì (BT)</MenuItem>
                        </TextField>
                      </Box>

                      {importingTon && (
                        <Box sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a73e8', mb: 1 }}>
                            ⏳ Đang tải file, ghi đè dữ liệu cache & tính toán lại chỉ số...
                          </Typography>
                          <LinearProgress sx={{ borderRadius: 1, height: 8 }} />
                        </Box>
                      )}

                      {importTonResult && (
                        <Alert severity={importTonResult.ok ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
                          {importTonResult.msg}
                        </Alert>
                      )}

                      <input
                        type="file"
                        ref={tonImportInputRef}
                        style={{ display: 'none' }}
                        accept=".csv, .xlsx, .xls"
                        onChange={handleImportTonFileSelect}
                      />

                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<FileUploadIcon />}
                        onClick={() => tonImportInputRef.current?.click()}
                        disabled={importingTon}
                        sx={{ borderRadius: 2, height: 48, fontWeight: 800, fontSize: '15px' }}
                      >
                        {importingTon ? 'Đang Xử Lý File...' : 'Chọn File CSV / Excel Để Import'}
                      </Button>
                    </Box>
                  </DialogContent>
                  <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setImportTonModalOpen(false)} disabled={importingTon} variant="outlined">
                      Đóng
                    </Button>
                  </DialogActions>
                </Dialog>

              </Box>
            )}

            {/* ========================================================================= */}
            {/* MAIN NAVIGATION TAB 4: TRANG QUẢN TRỊ (ADMIN PAGE) */}
            {/* ========================================================================= */}
            {currentNav === 'admin' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* HEADER USER BAR */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#e8f0fe', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', lineHeight: 1.2 }}>
                        Trang Quản Trị Hệ Thống (Admin Panel)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#5f6368', fontWeight: 600 }}>
                          Đang đăng nhập: <b>{currentUser?.name || currentUser?.mail}</b> ({currentUser?.mail})
                        </Typography>
                        <Chip
                          label={currentUser?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}
                          size="small"
                          color={currentUser?.role === 'admin' ? 'secondary' : 'primary'}
                          sx={{ fontWeight: 800, height: 22 }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Đăng Xuất
                  </Button>
                </Paper>

                {/* SUB-TABS TOPIC SELECTION */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                  <Tabs
                    value={adminSubTab}
                    onChange={(e, val) => setAdminSubTab(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      borderBottom: '1px solid #e0e0e0',
                      backgroundColor: '#f8fafc',
                      '& .MuiTab-root': { fontWeight: 700, minHeight: 52 }
                    }}
                  >
                    <Tab icon={<PeopleIcon />} iconPosition="start" label="1. HR Nhân Sự" />
                    <Tab icon={<AdminPanelSettingsIcon />} iconPosition="start" label="2. Trang Quản Trị User (Sheet Admin)" />
                    <Tab icon={<StorageIcon />} iconPosition="start" label="3. Import Data Base" />
                  </Tabs>

                  <Box sx={{ p: 3 }}>
                    {/* TOPIC 1: HR NHÂN SỰ */}
                    {adminSubTab === 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                          👥 Danh Sách Thông Tin Nhân Sự (HR Database)
                        </Typography>

                        {/* FILTER BAR */}
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Tìm kiếm Mã NV, Họ Tên, Email, Account, Phone..."
                              value={hrSearch}
                              onChange={(e) => setHrSearch(e.target.value)}
                              InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} /> }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4} md={3}>
                            <TextField select fullWidth size="small" value={hrBlockFilter} onChange={(e) => setHrBlockFilter(e.target.value)} label="Lọc Block">
                              <MenuItem value="__ALL__">-- Tất cả Block --</MenuItem>
                              {options.blocks?.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={4} md={3}>
                            <TextField select fullWidth size="small" value={hrTlFilter} onChange={(e) => setHrTlFilter(e.target.value)} label="Lọc Đội Trưởng">
                              <MenuItem value="__ALL__">-- Tất cả Đội Trưởng --</MenuItem>
                              {options.team_leads?.map(tl => <MenuItem key={tl} value={tl}>{tl}</MenuItem>)}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={12} md={2}>
                            <Button variant="contained" fullWidth onClick={fetchAdminHrList} startIcon={<RefreshIcon />} sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}>
                              Tải Lại
                            </Button>
                          </Grid>
                        </Grid>

                        {/* HR TABLE */}
                        {hrLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
                        ) : (
                          <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader size="small">
                              <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                                <TableRow>
                                  <TableCell align="center" sx={{ fontWeight: 800, width: 50 }}>STT</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Mã NV</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Họ và Tên</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Inside Account</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Số Điện Thoại</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Block</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Đội Trưởng</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Chức Danh</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Loại HĐ</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {hrList.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: '#64748b' }}>Không tìm thấy nhân sự phù hợp.</TableCell>
                                  </TableRow>
                                ) : (
                                  hrList.map((row) => (
                                    <TableRow key={row.stt} hover>
                                      <TableCell align="center">{row.stt}</TableCell>
                                      <TableCell sx={{ fontWeight: 800, color: '#1a73e8' }}>{row.code}</TableCell>
                                      <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{row.account}</TableCell>
                                      <TableCell sx={{ fontSize: '12px' }}>{row.mail}</TableCell>
                                      <TableCell sx={{ fontSize: '12px' }}>{row.phone}</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>{row.block}</TableCell>
                                      <TableCell sx={{ fontSize: '12px' }}>{row.team_lead}</TableCell>
                                      <TableCell sx={{ fontSize: '12px' }}>{row.title}</TableCell>
                                      <TableCell>
                                        <Chip label={row.status || 'Chính thức'} size="small" color={row.status?.includes('Chính thức') ? 'success' : 'default'} sx={{ height: 20, fontSize: '10px', fontWeight: 700 }} />
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    )}

                    {/* TOPIC 2: QỦAN TRỊ USER (SHEET ADMIN) */}
                    {adminSubTab === 1 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                              🔑 Quản Lý Tài Khoản Người Dùng (Sheet Admin Users)
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Sheet ID: <code>10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY</code> | GID: 0 (Cấu trúc: ID, MSNV, Họ và Tên, Mail, User, Mật Khẩu, Quyền)
                            </Typography>
                          </Box>

                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setEditingUser(null);
                              setUserForm({ msnv: '', name: '', mail: '', user: '', password: '', role: 'user' });
                              setUserModalOpen(true);
                            }}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                          >
                            Thêm User Mới
                          </Button>
                        </Box>

                        {adminUsersLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
                        ) : (
                          <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader size="small">
                              <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                                <TableRow>
                                  <TableCell align="center" sx={{ fontWeight: 800, width: 60 }}>ID</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>MSNV</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Họ và Tên</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>Mail</TableCell>
                                  <TableCell sx={{ fontWeight: 800 }}>User (Mật danh)</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800 }}>Quyền</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, width: 120 }}>Thao Tác</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {adminUsers.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#64748b' }}>Chưa có tài khoản người dùng nào.</TableCell>
                                  </TableRow>
                                ) : (
                                  adminUsers.map((row) => (
                                    <TableRow key={row.id} hover>
                                      <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>{row.id}</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#1a73e8' }}>{row.msnv || '-'}</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{row.name}</TableCell>
                                      <TableCell sx={{ fontSize: '13px' }}>{row.mail}</TableCell>
                                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{row.user}</TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={row.role === 'admin' ? 'ADMIN' : 'USER'}
                                          color={row.role === 'admin' ? 'secondary' : 'default'}
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
                                                password: '',
                                                role: row.role
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
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    )}

                    {/* TOPIC 3: IMPORT DATA BASE */}
                    {adminSubTab === 2 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                          📦 Trung Tâm Import Dữ Liệu Hệ Thống (Central Data Hub)
                        </Typography>

                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5, '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1a73e8' }}>
                                <PendingActionsIcon />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Tồn TK-BT</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>Import file CSV/Excel danh sách phiếu tồn Triển Khai và Bảo Trì mới nhất.</Typography>
                              <Button variant="contained" size="small" startIcon={<FileUploadIcon />} onClick={() => setImportTonModalOpen(true)} sx={{ borderRadius: 2, fontWeight: 700, mt: 1 }}>
                                Import Tồn TK-BT
                              </Button>
                            </Paper>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5, '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#2e7d32' }}>
                                <CalendarMonthIcon />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Lịch Trực Ca</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>Import file CSV lịch phân ca kỹ thuật tháng hiện tại để tính toán tỉ lệ trực.</Typography>
                              <Button variant="contained" color="success" size="small" startIcon={<FileUploadIcon />} onClick={() => importInputRef.current && importInputRef.current.click()} sx={{ borderRadius: 2, fontWeight: 700, mt: 1 }}>
                                Import Lịch Trực
                              </Button>
                            </Paper>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5, '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#9c27b0' }}>
                                <BarChartIcon />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>KPIs Tổng Hợp</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>Đồng bộ dữ liệu live từ Google Sheet KPI Triển Khai & Bảo Trì chính.</Typography>
                              <Button variant="contained" color="secondary" size="small" startIcon={<RefreshIcon />} onClick={triggerSync} disabled={syncing} sx={{ borderRadius: 2, fontWeight: 700, mt: 1 }}>
                                {syncing ? 'Đang Đồng Bộ...' : 'Đồng Bộ Live KPI'}
                              </Button>
                            </Paper>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5, '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ea580c' }}>
                                <PeopleIcon />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>HR Nhân Sự</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>Nạp lại bảng danh mục nhân sự và danh sách Đội trưởng / Block.</Typography>
                              <Button variant="outlined" color="warning" size="small" startIcon={<RefreshIcon />} onClick={fetchAdminHrList} sx={{ borderRadius: 2, fontWeight: 700, mt: 1 }}>
                                Nạp Lại HR Data
                              </Button>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
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

        {/* BT TRANSACTION TYPES MODAL */}
        <Dialog open={btDetailModalOpen} onClose={() => setBtDetailModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124' }}>
              CHI TIẾT KHỐI LƯỢNG TỪNG LOẠI PHIẾU BẢO TRÌ (SG01)
            </Typography>
            <IconButton onClick={() => setBtDetailModalOpen(false)}><CloseIcon /></IconButton>
          </DialogTitle>
          
          <DialogContent dividers sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#202124', mb: 1.5 }}>
              Danh Sách Phân Loại Tình Trạng Lên Phiếu Bảo Trì:
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tình Trạng Lên Phiếu Bảo Trì</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Số Lượng</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Tỷ Lệ / Đánh Giá</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.all_bt_type_counts && Object.keys(summary.all_bt_type_counts).length > 0 ? (
                    Object.entries(summary.all_bt_type_counts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count], idx) => {
                        const totalAll = Object.values(summary.all_bt_type_counts).reduce((a, b) => a + b, 0);
                        const pct = totalAll > 0 ? ((count / totalAll) * 100).toFixed(1) : 0;

                        return (
                          <TableRow key={type} hover>
                            <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#202124' }}>
                              {type || '(Trống / Không xác định)'}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#00897b' }}>
                              {count}
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={`${pct}%`} size="small" sx={{ backgroundColor: '#e0f2f1', color: '#00897b', fontWeight: 700 }} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#5f6368' }}>
                        Không tìm thấy dữ liệu phiếu bảo trì trong khoảng thời gian đang lọc.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setBtDetailModalOpen(false)} variant="contained" sx={{ backgroundColor: '#00897b', '&:hover': { backgroundColor: '#00695c' }, borderRadius: '18px', textTransform: 'none', px: 3 }}>
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* EMPLOYEE TICKET DETAILS DRAWER */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: { xs: '100%', md: 950 }, p: 3 } }}
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
                <Tab label={`CLL30N (Ca Lặp) (${empDetails?.cll_tickets?.length || 0})`} />
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
              ) : activeTab === 1 ? (
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
                          <TableCell>
                            <Typography variant="body2">{t.customer_name}</Typography>
                            {t.tx_type && <Typography variant="caption" sx={{ color: '#00897b', display: 'block' }}>{t.tx_type}</Typography>}
                          </TableCell>
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
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 40 }}>STT</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>TG Hoàn Tất</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tình Trạng Đầu Vào</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Hướng Xử Lý</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {empDetails?.cll_tickets?.map((t, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t.contract_no}</TableCell>
                          <TableCell>{t.customer_name || '-'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.dt_complete || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{t.tinh_trang_dau_vao || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#1a73e8', fontWeight: 500 }}>{t.huong_xu_ly || '-'}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!empDetails?.cll_tickets || empDetails.cll_tickets.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#5f6368' }}>
                            Không có ca lặp CLL30N trong khoảng thời gian này
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

            </Box>
          )}
        </Drawer>

        {/* AUTHENTICATION DIALOG MODAL */}
        <Dialog open={authModalOpen} onClose={() => setAuthModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pt: 3, color: '#1e293b' }}>
            🔒 ĐĂNG NHẬP / ĐĂNG KÝ HỆ THỐNG
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Tabs value={authTab} onChange={(e, val) => { setAuthTab(val); setAuthError(null); }} centered sx={{ mb: 2.5, borderBottom: '1px solid #e2e8f0' }}>
              <Tab icon={<LoginIcon />} label="Đăng Nhập" />
              <Tab icon={<PersonAddIcon />} label="Đăng Ký" />
            </Tabs>

            {authError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{authError}</Alert>
            )}

            {/* TAB 0: LOGIN */}
            {authTab === 0 && (
              <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mail hoặc User (mật danh)"
                  placeholder="Nhập Mail hoặc User..."
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />

                <Button type="submit" variant="contained" color="primary" fullWidth disabled={authLoading} sx={{ borderRadius: 2, height: 42, fontWeight: 800, mt: 1 }}>
                  {authLoading ? <CircularProgress size={24} /> : 'ĐĂNG NHẬP'}
                </Button>

                <Divider sx={{ my: 1 }}>hoặc</Divider>

                <Button variant="text" color="secondary" size="small" onClick={() => { setAuthTab(2); setAuthError(null); }}>
                  🔑 Cài đặt mật khẩu lần đầu cho admin phuongnam.phongnh5@fpt.net
                </Button>
              </Box>
            )}

            {/* TAB 1: REGISTER */}
            {authTab === 1 && (
              <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email nhân sự (FPT/PNC)"
                  placeholder="VD: namnp@fpt.net..."
                  value={regMail}
                  onChange={(e) => {
                    setRegMail(e.target.value);
                    handleCheckHrEmail(e.target.value);
                  }}
                  required
                />

                {hrCheckResult && (
                  <Alert severity="success" sx={{ borderRadius: 2, py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                      ✓ Khớp nhân sự HR: {hrCheckResult.name} (MSNV: {hrCheckResult.msnv})
                    </Typography>
                  </Alert>
                )}

                <TextField
                  fullWidth
                  size="small"
                  label="User (Mật danh tự chọn tùy thích)"
                  placeholder="VD: phongnh5_admin..."
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                />

                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Mật khẩu"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Xác nhận mật khẩu"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                />

                <Button type="submit" variant="contained" color="success" fullWidth disabled={authLoading} sx={{ borderRadius: 2, height: 42, fontWeight: 800, mt: 1 }}>
                  {authLoading ? <CircularProgress size={24} /> : 'ĐĂNG KÝ TÀI KHOẢN'}
                </Button>
              </Box>
            )}

            {/* TAB 2: SETUP INITIAL ADMIN PASSWORD */}
            {authTab === 2 && (
              <Box component="form" onSubmit={handleSetupInitialAdminPassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                  Thiết lập mật khẩu lần đầu cho tài khoản quản trị mặc định: <b>phuongnam.phongnh5@fpt.net</b>
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Mật khẩu mới"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Xác nhận mật khẩu mới"
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  required
                />

                <Button type="submit" variant="contained" color="secondary" fullWidth disabled={authLoading} sx={{ borderRadius: 2, height: 42, fontWeight: 800, mt: 1 }}>
                  {authLoading ? <CircularProgress size={24} /> : 'LƯU MẬT KHẨU & ĐĂNG NHẬP'}
                </Button>

                <Button variant="text" color="inherit" size="small" onClick={() => setAuthTab(0)}>
                  Quay lại Đăng nhập
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAuthModalOpen(false)} color="inherit">Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* EDIT / ADD USER DIALOG MODAL */}
        <Dialog open={userModalOpen} onClose={() => setUserModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#1a73e8' }}>
            {editingUser ? '✏️ SỬA TÀI KHOẢN NGƯỜI DÙNG' : '➕ THÊM USER MỚI (SHEET ADMIN)'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField fullWidth size="small" label="MSNV" value={userForm.msnv} onChange={(e) => setUserForm({ ...userForm, msnv: e.target.value })} />
              <TextField fullWidth size="small" label="Họ và Tên" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
              <TextField fullWidth size="small" label="Mail" value={userForm.mail} onChange={(e) => setUserForm({ ...userForm, mail: e.target.value })} required />
              <TextField fullWidth size="small" label="User (Mật danh)" value={userForm.user} onChange={(e) => setUserForm({ ...userForm, user: e.target.value })} />
              <TextField fullWidth size="small" type="password" label={editingUser ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
              <TextField select fullWidth size="small" label="Quyền Hạn" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                <MenuItem value="user">User (Người dùng thường)</MenuItem>
                <MenuItem value="admin">Admin (Quản trị viên)</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setUserModalOpen(false)} variant="outlined">Hủy</Button>
            <Button onClick={handleSaveUser} variant="contained" color="primary">Lưu Thay Đổi</Button>
          </DialogActions>
        </Dialog>

        {/* DELETE USER CONFIRM DIALOG */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#d93025' }}>⚠️ XÁC NHẬN XÓA TÀI KHOẢN</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2">
              Bạn có chắc chắn muốn xóa tài khoản <b>{userToDelete?.name}</b> ({userToDelete?.mail}) khỏi hệ thống?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined">Hủy</Button>
            <Button onClick={handleDeleteUser} variant="contained" color="error">Xóa Tài Khoản</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </ThemeProvider>
  );
}
