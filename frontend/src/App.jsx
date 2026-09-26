import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  useMediaQuery,
  useTheme
} from '@mui/material';

import axios from 'axios';
import * as XLSX from 'xlsx';
import theme from './theme';
import SOPLoadingScreen from './components/SOPLoadingScreen';
import { DEFAULT_SOP_SLIDES } from './config/sopSlides';

import { Sidebar, TopHeader } from './components/layout';
import KpisView from './components/kpi/KpisView';
import LichTrucView from './components/lich_truc/LichTrucView';
import TonTkBtView from './components/ton_tk_bt/TonTkBtView';
import AdminView from './components/admin/AdminView';
import LichTrucChiTietView from './components/lich_truc/LichTrucChiTietView';
import { EmployeeDrawer } from './components/drawers';
import {
  UnifiedHrProfileModal,
  UserEditModal,
  AdminSlideEditModal,
  DetailModal,
  BtDetailModal,
  Clps7nDetailModal,
  AuthModal,
  UserDeleteModal,
  HrDeleteModal,
  AppsScriptGuideModal,
  PositionModal,
  PreviewLoadingModal
} from './components/modals';

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
    blocks_by_teamlead: {},
    last_sync_time: null,
    is_syncing: false
  });

  const [startDate, setStartDate] = useState(() => localStorage.getItem('kpi_startDate') || initialDates.start);
  const [endDate, setEndDate] = useState(() => localStorage.getItem('kpi_endDate') || initialDates.end);
  const [selectedTeamLead, setSelectedTeamLead] = useState(() => localStorage.getItem('kpi_teamLead') || '');
  const [selectedRegion, setSelectedRegion] = useState(() => localStorage.getItem('kpi_region') || '');
  const [selectedBlock, setSelectedBlock] = useState(() => localStorage.getItem('kpi_block') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState(() => localStorage.getItem('kpi_datePreset') || 'month_to_yesterday');

  useEffect(() => {
    try {
      localStorage.setItem('kpi_startDate', startDate || '');
      localStorage.setItem('kpi_endDate', endDate || '');
      localStorage.setItem('kpi_datePreset', datePreset || '');
      localStorage.setItem('kpi_teamLead', selectedTeamLead || '');
      localStorage.setItem('kpi_region', selectedRegion || '');
      localStorage.setItem('kpi_block', selectedBlock || '');
    } catch (e) {}
  }, [startDate, endDate, datePreset, selectedTeamLead, selectedRegion, selectedBlock]);

  // KPI Data State
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // KPI Dịch Vụ State
  const [dichVuData, setDichVuData] = useState(null);
  const [dichVuLoading, setDichVuLoading] = useState(false);
  // Global app initialization loading state (SOP Showcase)
  const [appInitializing, setAppInitializing] = useState(true);
  const appInitRef = useRef({ optionsDone: false, reportDone: false });
  const [loadingProgress, setLoadingProgress] = useState(12);
  const [loadingStatusText, setLoadingStatusText] = useState("Đang kết nối cơ sở dữ liệu Supabase...");
  const [loadingSlides, setLoadingSlides] = useState(DEFAULT_SOP_SLIDES);

  const _checkAppInitDone = () => {
    if (appInitRef.current.optionsDone && appInitRef.current.reportDone) {
      setLoadingProgress(100);
      setLoadingStatusText("Hệ thống sẵn sàng! Đang chuyển sang giao diện...");
      setTimeout(() => {
        setAppInitializing(false);
      }, 500);
    }
  };

  // Computed: Danh sách Block phụ thuộc vào Đội trưởng đang chọn
  // Nếu chọn Đội trưởng A thì chỉ hiện blocks của A, không hiện tất cả
  const filteredBlocks = useMemo(() => {
    if (!selectedTeamLead) return options.blocks || [];
    const byTl = options.blocks_by_teamlead || {};
    return byTl[selectedTeamLead] || options.blocks || [];
  }, [selectedTeamLead, options.blocks, options.blocks_by_teamlead]);


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
  const [clps7nDetailModalOpen, setClps7nDetailModalOpen] = useState(false);

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
  const [ltOffStaffSearch, setLtOffStaffSearch] = useState('');

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
  const [tonSyncing, setTonSyncing] = useState(false);
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

  // Admin Page States (0: HR Nhân Sự, 1: Sheet Quyền Admin, 2: Import Data Base, 3: Quản Lý Lương)
  // [FIX] Khởi tạo thông minh: User thường luôn bắt đầu ở tab Quản Lý Lương (id=3)
  const [adminSubTab, setAdminSubTab] = useState(() => {
    try {
      const stored = localStorage.getItem('kpi_current_user');
      const u = stored ? JSON.parse(stored) : null;
      return u && u.role !== 'admin' ? 3 : 0;
    } catch {
      return 0;
    }
  });

  // Topic 1: HR List & CRUD States
  const [hrList, setHrList] = useState([]);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [hrLoading, setHrLoading] = useState(false);
  const [hrSearch, setHrSearch] = useState('');
  const [hrBlockFilter, setHrBlockFilter] = useState('__ALL__');
  const [hrTlFilter, setHrTlFilter] = useState('__ALL__');

  // HR Detail Modal States
  const [hrDetailModalOpen, setHrDetailModalOpen] = useState(false);
  const [selectedHrDetail, setSelectedHrDetail] = useState(null);
  const [hrDetailLoading, setHrDetailLoading] = useState(false);
  const [hrDetailSearch, setHrDetailSearch] = useState('');

  // Unified HR Profile Modal States (View & Edit Combined in 1)
  const [unifiedHrModalOpen, setUnifiedHrModalOpen] = useState(false);
  const [unifiedHrProfile, setUnifiedHrProfile] = useState({});
  const [isNewHrProfile, setIsNewHrProfile] = useState(false);

  // HR Delete Confirmation States
  const [hrDeleteModalOpen, setHrDeleteModalOpen] = useState(false);
  const [hrToDelete, setHrToDelete] = useState(null);

  // Topic 4: Lương States
  const [luongList, setLuongList] = useState([]);
  const [luongLoading, setLuongLoading] = useState(false);
  const [luongSearch, setLuongSearch] = useState('');
  const [luongBlockFilter, setLuongBlockFilter] = useState('__ALL__');
  const [luongTlFilter, setLuongTlFilter] = useState('__ALL__');

  // Topic 2: Admin Users Table States
  const [adminUsers, setAdminUsers] = useState([]);
  const [webAppUrl, setWebAppUrl] = useState('');
  const [appsScriptGuideOpen, setAppsScriptGuideOpen] = useState(false);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null for Add, user object for Edit
  const [showPasswords, setShowPasswords] = useState({});
  const toggleShowPassword = (id) => setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  const [userForm, setUserForm] = useState({
    msnv: '', name: '', mail: '', user: '', password: '', role: 'user', status: 'Active', allowed_apps: ['Salary']
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Data Base Dataset Import States
  const [dbCounts, setDbCounts] = useState({ kh_cls: 0, cll30n: 0, ton_tk: 0, ton_bt: 0 });
  const [importTarget, setImportTarget] = useState('kh_cls'); // 'kh_cls', 'cll30n', 'ton_tk', 'ton_bt'
  const [importRule, setImportRule] = useState('MERGE_NO_OVERWRITE');
  const [dbFile, setDbFile] = useState(null);
  const [dbUploading, setDbUploading] = useState(false);
  const [dbResult, setDbResult] = useState(null);
  const dbInputRef = useRef(null);

  // ===== PERMISSION HELPERS =====
  // hasApp: kiểm tra user có quyền truy cập app/feature cụ thể không
  // Admin có tất cả quyền. User thường chỉ có quyền trong allowed_apps
  const isAdmin = currentUser?.role === 'admin';
  const hasApp = (app) => {
    if (!currentUser) return false;
    if (isAdmin) return true; // admin luôn có tất cả quyền
    const apps = currentUser.allowed_apps || [];
    return apps.some(a => a.toLowerCase() === app.toLowerCase() || a.toLowerCase() === 'all');
  };
  // canImport: chỉ admin hoặc user có quyền ImportDB mới được import
  const canImport = hasApp('ImportDB');
  // canManageUsers: chỉ admin hoặc user có quyền UserMgmt
  const canManageUsers = isAdmin || hasApp('UserMgmt');

  // Clear Dataset Modal States
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState('kh_cls');
  const [clearPassword, setClearPassword] = useState('');
  const [clearingDb, setClearingDb] = useState(false);
  const [clearError, setClearError] = useState(null);

  // Admin Topic 5: Slide Chờ & Quy Trình SOP States
  const [adminLoadingSlides, setAdminLoadingSlides] = useState(DEFAULT_SOP_SLIDES);
  const [adminSlideModalOpen, setAdminSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [previewLoadingModalOpen, setPreviewLoadingModalOpen] = useState(false);

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
        // [FIX] Phân quyền: User thường chỉ được xem tab Quản Lý Lương (id=3)
        // Admin mới vào trang HR Nhân Sự (id=0) mặc định
        if (u?.role === 'admin') {
          setAdminSubTab(0);
          fetchAdminUsers();
        } else {
          setAdminSubTab(3);
          fetchLuongList();
        }
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

  useEffect(() => {
    if (!regMail || !regMail.includes('@') || regMail.trim().length < 4) {
      setHrCheckResult(null);
      return;
    }
    const timer = setTimeout(() => {
      handleCheckHrEmail(regMail.trim());
    }, 2000);
    return () => clearTimeout(timer);
  }, [regMail]);

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
        // [FIX] User mới đăng ký là user thường → chỉ vào tab Quản Lý Lương
        setAdminSubTab(3);
        fetchLuongList();
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
      const cfgRes = await axios.get('/api/admin/users/config-webapp');
      if (cfgRes.data && cfgRes.data.url) {
        setWebAppUrl(cfgRes.data.url);
      }
    } catch (err) {
      console.error("Fetch admin users error:", err);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const handleSaveWebAppUrl = async () => {
    try {
      const res = await axios.post('/api/admin/users/config-webapp', { url: webAppUrl });
      if (res.data && res.data.ok) {
        alert("✅ Đã lưu Google Apps Script Web App URL thành công!");
      } else {
        alert("❌ Không thể lưu Web App URL!");
      }
    } catch (err) {
      alert("❌ Lỗi kết nối server khi lưu Web App URL!");
    }
  };

  const handleSyncSheetNow = async () => {
    try {
      const res = await axios.post('/api/admin/users/sync-sheet');
      if (res.data && res.data.ok) {
        alert(res.data.msg || "✅ Đồng bộ dữ liệu DataBase thành công!");
      } else {
        alert("❌ Lỗi đồng bộ: " + (res.data?.msg || "Vui lòng thử lại!"));
      }
    } catch (err) {
      alert("❌ Lỗi kết nối server khi đồng bộ DataBase!");
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

  const fetchDbCounts = async () => {
    try {
      const res = await axios.get('/api/admin/dataset-counts');
      if (res.data) {
        setDbCounts(res.data.counts || res.data);
      }
    } catch (err) {
      console.error("Lỗi fetch db counts:", err);
    }
  };

  const handleImportDbDataset = async () => {
    if (!dbFile) {
      alert("Vui lòng chọn file Excel hoặc CSV để import!");
      return;
    }
    setDbUploading(true);
    setDbResult(null);
    const formData = new FormData();
    formData.append('file', dbFile);
    formData.append('target', importTarget);
    formData.append('rule', importRule);

    try {
      const res = await axios.post('/api/admin/import-dataset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.ok) {
        setDbResult({
          success: true,
          message: res.data.message,
          added: res.data.added,
          skipped: res.data.skipped,
          total: res.data.total,
          db_total: res.data.db_total
        });
        setDbFile(null);
        if (dbInputRef.current) dbInputRef.current.value = '';
        fetchDbCounts();
      } else {
        setDbResult({
          success: false,
          message: res.data?.error || 'Import thất bại!'
        });
      }
    } catch (err) {
      setDbResult({
        success: false,
        message: err.response?.data?.detail || err.message || 'Lỗi khi gửi file lên server!'
      });
    } finally {
      setDbUploading(false);
    }
  };

  const handleClearDbDataset = async (e) => {
    if (e) e.preventDefault();
    if (!clearPassword) {
      setClearError("Vui lòng nhập mật khẩu xác nhận Quản trị viên!");
      return;
    }
    setClearingDb(true);
    setClearError(null);

    try {
      const res = await axios.post('/api/admin/clear-dataset', {
        target: clearTarget,
        password: clearPassword
      });
      if (res.data && res.data.ok) {
        setDbResult({
          success: true,
          message: res.data.message,
          added: 0,
          skipped: 0,
          total: 0,
          db_total: 0
        });
        setClearModalOpen(false);
        setClearPassword('');
        fetchDbCounts();
      } else {
        setClearError(res.data?.error || 'Xác nhận mật khẩu thất bại!');
      }
    } catch (err) {
      setClearError(err.response?.data?.detail || err.message || 'Lỗi khi gửi yêu cầu xóa dữ liệu!');
    } finally {
      setClearingDb(false);
    }
  };

  const openUnifiedHrModal = async (code = null) => {
    setHrDetailLoading(true);
    setHrDetailSearch('');
    if (code) {
      setIsNewHrProfile(false);
      try {
        const res = await axios.get(`/api/admin/hr-detail/${encodeURIComponent(code)}`);
        if (res.data && res.data.ok) {
          setUnifiedHrProfile(res.data.detail || {});
          setUnifiedHrModalOpen(true);
        } else {
          alert(res.data?.error || "Không thể tải thông tin nhân sự!");
        }
      } catch (err) {
        alert("Lỗi khi tải thông tin nhân sự!");
      } finally {
        setHrDetailLoading(false);
      }
    } else {
      setIsNewHrProfile(true);
      setUnifiedHrProfile({
        'Mã NV': '',
        'Họ Tên NV': '',
        'Inside Account': '',
        'Mobisale': '',
        'Email': '',
        'Số điện thoại': '',
        'Block': '',
        'Họ tên Đội trưởng': '',
        'Chức danh': 'Nhân Viên',
        'Tình trạng Hợp đồng': 'NS Đang làm việc',
        'Loại HĐLĐ': 'Chính thức',
        'Tình trạng Tài khoản': 'Active'
      });
      setUnifiedHrModalOpen(true);
      setHrDetailLoading(false);
    }
  };

  const handleSaveUnifiedHr = async (formDataParam) => {
    const profile = formDataParam || unifiedHrProfile;
    const code = profile['Mã NV'] || profile['Inside Account'] || '';
    const name = profile['Họ Tên NV'] || '';

    if (!code || !name) {
      alert("Vui lòng nhập đầy đủ Mã NV và Họ Tên NV!");
      return;
    }

    try {
      if (isNewHrProfile) {
        const res = await axios.post('/api/admin/hr/add', profile);
        if (res.data && res.data.ok) {
          alert(res.data.message || "Đã thêm mới nhân sự thành công!");
          setUnifiedHrModalOpen(false);
          fetchAdminHrList();
        } else alert(res.data?.error || "Lỗi thêm mới nhân sự!");
      } else {
        const res = await axios.post('/api/admin/hr/update', { code, ...profile });
        if (res.data && res.data.ok) {
          alert(res.data.message || "Đã cập nhật hồ sơ nhân sự thành công!");
          setUnifiedHrModalOpen(false);
          fetchAdminHrList();
        } else alert(res.data?.error || "Lỗi cập nhật nhân sự!");
      }
    } catch (err) {
      alert("Lỗi khi lưu thông tin nhân sự!");
    }
  };

  const handleDeleteHr = async () => {
    if (!hrToDelete) return;
    try {
      const res = await axios.post('/api/admin/hr/delete', { code: hrToDelete.code });
      if (res.data && res.data.ok) {
        alert(res.data.message || 'Đã xóa nhân sự!');
        setHrDeleteModalOpen(false);
        setHrToDelete(null);
        fetchAdminHrList();
      } else alert(res.data?.error || 'Lỗi xóa nhân sự!');
    } catch (err) {
      alert("Lỗi kết nối khi xóa nhân sự!");
    }
  };

  const fetchLuongList = async () => {
    setLuongLoading(true);
    try {
      const res = await axios.get('/api/admin/luong-list', {
        params: { search: luongSearch, block: luongBlockFilter, team_lead: luongTlFilter }
      });
      if (res.data) setLuongList(res.data);
    } catch (err) {
      console.error("Fetch Lương list error:", err);
    } finally {
      setLuongLoading(false);
    }
  };

  const handleSaveUser = async (formDataParam) => {
    const form = formDataParam || userForm;
    if (!form.mail || (!editingUser && !form.password)) {
      alert("Vui lòng điền đầy đủ Email và Mật khẩu!");
      return;
    }
    try {
      if (editingUser) {
        const res = await axios.post('/api/admin/users/update', {
          user_id: editingUser.id,
          msnv: form.msnv,
          name: form.name,
          mail: form.mail,
          user: form.user,
          password: form.password,
          role: form.role,
          status: form.status || 'Active',
          allowed_apps: Array.isArray(form.allowed_apps) ? form.allowed_apps.join(', ') : form.allowed_apps
        });
        if (res.data && res.data.ok) {
          alert(res.data.message);
          setUserModalOpen(false);
          fetchAdminUsers();
        } else alert(res.data?.error || "Lỗi cập nhật!");
      } else {
        const res = await axios.post('/api/admin/users/add', {
          ...form,
          allowed_apps: Array.isArray(form.allowed_apps) ? form.allowed_apps.join(', ') : form.allowed_apps
        });
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
    } finally {
      appInitRef.current.optionsDone = true;
      _checkAppInitDone();
    }
  };

  // Fetch KPI Report (with auto-retry on transient error)
  const fetchReport = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedTeamLead) params.team_lead = selectedTeamLead;
      if (selectedRegion) params.region = selectedRegion;
      if (selectedBlock) params.block = selectedBlock;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get(`${API_BASE}/report`, { params });
      setReportData(res.data);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      if (retryCount < 2) {
        // Auto-retry up to 2 times with 1.5s delay (handles cold-start / transient errors)
        setTimeout(() => fetchReport(retryCount + 1), 1500);
        return;
      }
      setError("Không thể tải dữ liệu báo cáo KPI. Vui lòng thử lại!");
    } finally {
      setLoading(false);
      appInitRef.current.reportDone = true;
      _checkAppInitDone();
    }
  };

  // Fetch KPI Dịch Vụ from Google Sheet
  const fetchDichVu = async () => {
    setDichVuLoading(true);
    try {
      const res = await axios.get('/api/dich-vu/report');
      if (res.data && res.data.ok) {
        setDichVuData(res.data.rows || []);
      }
    } catch (err) {
      console.error('Failed to fetch KPI Dịch Vụ:', err);
    } finally {
      setDichVuLoading(false);
    }
  };

  // Lịch Trực API Calls
  const fetchLichTrucDashboard = async (targetDate = ltDate, force = false) => {
    setLtLoading(true);
    try {
      const res = await axios.get('/api/lich-truc/dashboard', { params: { date: targetDate, force } });
      setLtDashData(res.data);
    } catch (err) {
      console.error("Failed to fetch Lịch Trực dashboard:", err);
    } finally {
      setLtLoading(false);
    }
  };

  const exportCaOStaffCsv = () => {
    if (!ltDashData || !ltDashData.offStaffList) return;
    const filtered = ltDashData.offStaffList
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
    if (filtered.length === 0) {
      alert("Không có dữ liệu nhân sự ca O để xuất!");
      return;
    }
    const headers = ["STT", "Mã NV", "Họ Tên", "Email", "Block", "Đội Trưởng", "Đối Tác", "Ca Trực", "Trạng Thái"];
    const rows = filtered.map((s, idx) => [
      idx + 1,
      s.code,
      s.name,
      s.mail,
      s.block,
      s.doiTruong,
      s.partner,
      s.caTruc,
      s.status
    ]);
    const csvContent = "\uFEFF" + [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DS_Nhan_Su_Ca_O_${ltDate || new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Topic 5: Slide Chờ & Quy Trình Handlers
  const fetchAdminLoadingSlides = async () => {
    try {
      const res = await axios.get('/api/admin/loading-slides');
      if (res.data && res.data.ok && Array.isArray(res.data.slides) && res.data.slides.length > 0) {
        setLoadingSlides(res.data.slides);
        setAdminLoadingSlides(res.data.slides);
      }
    } catch (e) {
      console.warn("Using default loading slides:", e);
    }
  };

  const handleSaveLoadingSlides = async (slidesToSave) => {
    const data = slidesToSave || adminLoadingSlides;
    try {
      const res = await axios.post('/api/admin/loading-slides', { slides: data });
      if (res.data && res.data.ok) {
        setLoadingSlides(res.data.slides);
        setAdminLoadingSlides(res.data.slides);
        alert("✅ Đã lưu cấu hình Slide Chờ thành công!");
      } else {
        alert("❌ Lưu thất bại: " + (res.data?.error || "Lỗi không xác định"));
      }
    } catch (err) {
      alert("❌ Lỗi khi lưu: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleResetLoadingSlides = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn khôi phục về 5 Slide Quy trình SOP mặc định của SG01?")) return;
    try {
      const res = await axios.post('/api/admin/loading-slides/reset');
      if (res.data && res.data.ok) {
        setLoadingSlides(res.data.slides);
        setAdminLoadingSlides(res.data.slides);
        alert("✅ Đã khôi phục thành công các Slide mặc định!");
      } else {
        alert("❌ Khôi phục thất bại: " + (res.data?.error || "Lỗi không xác định"));
      }
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleToggleSlideActive = (slideId) => {
    const updated = adminLoadingSlides.map(s => {
      if (s.id === slideId) {
        return { ...s, is_active: s.is_active === false ? true : false };
      }
      return s;
    });
    setAdminLoadingSlides(updated);
    handleSaveLoadingSlides(updated);
  };

  const handleDeleteSlide = (slideId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa slide này?")) return;
    const updated = adminLoadingSlides.filter(s => s.id !== slideId);
    setAdminLoadingSlides(updated);
    handleSaveLoadingSlides(updated);
  };

  const handleSaveSlideForm = (slideData) => {
    let updated;
    if (editingSlide && editingSlide.id) {
      updated = adminLoadingSlides.map(s => s.id === editingSlide.id ? { ...s, ...slideData } : s);
    } else {
      const newId = Date.now();
      updated = [...adminLoadingSlides, { ...slideData, id: newId, is_active: true }];
    }
    setAdminLoadingSlides(updated);
    setAdminSlideModalOpen(false);
    setEditingSlide(null);
    handleSaveLoadingSlides(updated);
  };

  useEffect(() => {
    fetchOptions();
    fetchTonTkBtDashboard();
    fetchAdminLoadingSlides();
    fetchDichVu();
  }, []);

  // Smooth loading progress animation
  useEffect(() => {
    if (!appInitializing) return;

    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 92) return 92;
        if (prev < 35) {
          setLoadingStatusText("Đang kết nối Supabase & Nạp danh mục...");
          return prev + 5;
        } else if (prev < 65) {
          setLoadingStatusText("Đang phân tích dữ liệu KPI & Ca lặp...");
          return prev + 3;
        } else if (prev < 85) {
          setLoadingStatusText("Đang tổng hợp tồn & lịch trực kỹ thuật...");
          return prev + 2;
        } else {
          setLoadingStatusText("Đang hoàn tất tối ưu hóa giao diện...");
          return prev + 1;
        }
      });
    }, 400);

    return () => clearInterval(timer);
  }, [appInitializing]);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, selectedTeamLead, selectedRegion, selectedBlock, searchQuery]);

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

      const timer = setInterval(() => {
        if (ltTab === 'dashboard') fetchLichTrucDashboard();
        else if (ltTab === 'chitiet') fetchLichTrucChiTiet();
      }, 60000);
      return () => clearInterval(timer);
    } else if (currentNav === 'ton_tk_bt') {
      fetchTonTkBtDashboard();
      const tonTimer = setInterval(() => {
        fetchTonTkBtDashboard();
      }, 60000);
      return () => clearInterval(tonTimer);
    } else if (currentNav === 'admin') {
      fetchAdminUsers();
      fetchAdminHrList();
      fetchAdminLoadingSlides();
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

  // Trigger Live Data Sync (with polling instead of fixed timeout)
  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API_BASE}/sync`);
      // Poll /api/kpi/sync/status every 2s until is_syncing === false (max 90s)
      let waited = 0;
      const maxWait = 90000;
      const pollInterval = 2000;
      await new Promise((resolve) => {
        const poll = setInterval(async () => {
          waited += pollInterval;
          try {
            const statusRes = await axios.get(`${API_BASE}/sync/status`);
            if (!statusRes.data.is_syncing || waited >= maxWait) {
              clearInterval(poll);
              resolve();
            }
          } catch {
            clearInterval(poll);
            resolve();
          }
        }, pollInterval);
      });
      // After sync completes, refresh data
      await fetchOptions();
      await fetchReport();
      if (currentNav === 'lich_truc') {
        fetchLichTrucDashboard();
      } else if (currentNav === 'ton_tk_bt') {
        fetchTonTkBtDashboard(true);
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
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
      '% Công Nợ': emp.dv_ti_le_da_tt !== null && emp.dv_ti_le_da_tt !== undefined ? `${emp.dv_ti_le_da_tt.toFixed(2)}%` : '',
      'RM Kế Hoạch Tháng': emp.dv_roi_mang_kh ?? '',
      'Rời Mạng Dự Kiến': emp.dv_roi_mang_du_kien ?? '',
      '% RM Hiện Tại': emp.dv_pct_rm_hien_tai !== null && emp.dv_pct_rm_hien_tai !== undefined ? `${emp.dv_pct_rm_hien_tai.toFixed(2)}%` : '',
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
  const fetchTonTkBtDashboard = async (force = false) => {
    setTonTkBtLoading(true);
    try {
      const res = await axios.get('/api/kpi/ton-tk-bt/dashboard', {
        params: force ? { force: true } : {}
      });
      setTonTkBtData(res.data);
    } catch (err) {
      console.error("Failed to fetch Tồn TK-BT dashboard:", err);
    } finally {
      setTonTkBtLoading(false);
    }
  };

  // Explicit sync Tồn TK-BT from Supabase Cloud / Remote
  const handleSyncTonTkBt = async () => {
    setTonSyncing(true);
    try {
      const res = await axios.post('/api/kpi/ton-tk-bt/sync');
      if (res.data && res.data.dashboard) {
        setTonTkBtData(res.data.dashboard);
      } else {
        await fetchTonTkBtDashboard(true);
      }
    } catch (err) {
      console.error("Sync Tồn TK-BT error:", err);
      await fetchTonTkBtDashboard(true);
    } finally {
      setTonSyncing(false);
    }
  };

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
  const handleAddRowSubmit = async (formDataParam) => {
    const form = formDataParam || addRowData;
    if (!form.mail) {
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
      const res = await axios.post('/api/lich-truc/update-row', {
        rowNumber: editingRowNumber,
        valuesBtoAL: editingRowValues
      });
      if (res.data && res.data.ok) {
        setEditingRowNumber(null);
        setEditingRowValues([]);
        fetchLichTrucChiTiet();
        alert(res.data.message || "Đã lưu thay đổi lịch trực thành công!");
      } else {
        alert("Lỗi khi lưu lịch trực: " + (res.data?.error || "Không thể lưu dữ liệu!"));
      }
    } catch (err) {
      console.error("Failed to update row:", err);
      alert("Có lỗi khi kết nối máy chủ để lưu lịch trực!");
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

  // Helper function to render Lịch Trực Chi Tiết table (read-only for public, editable for admin)
  const renderLichTrucChiTiet = (isEditable = false) => (
    <LichTrucChiTietView
      isEditable={isEditable}
      importInputRef={importInputRef}
      handleImportCsvFile={handleImportCsvFile}
      ltCtMonth={ltCtMonth}
      setLtCtMonth={setLtCtMonth}
      ltCtYear={ltCtYear}
      setLtCtYear={setLtCtYear}
      ltCtDoiTruong={ltCtDoiTruong}
      setLtCtDoiTruong={setLtCtDoiTruong}
      options={options}
      fetchLichTrucChiTiet={fetchLichTrucChiTiet}
      sortBlockEnabled={sortBlockEnabled}
      setSortBlockEnabled={setSortBlockEnabled}
      addRowOpen={addRowOpen}
      setAddRowOpen={setAddRowOpen}
      handleAddRowSubmit={handleAddRowSubmit}
      handleExportLichTrucCSV={handleExportLichTrucCSV}
      ltCtData={ltCtData}
      editingRowNumber={editingRowNumber}
      editingRowValues={editingRowValues}
      setEditingRowValues={setEditingRowValues}
      handleStartEditRow={handleStartEditRow}
      handleCancelEditRow={handleCancelEditRow}
      handleSaveEditRow={handleSaveEditRow}
      handleDeleteRow={handleDeleteRow}
    />
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ========== GLOBAL APP INITIALIZING SOP SHOWCASE ========== */}
      {appInitializing && (
        <SOPLoadingScreen
          slides={loadingSlides}
          loadingProgress={loadingProgress}
          currentStatusText={loadingStatusText}
          onSkip={() => setAppInitializing(false)}
        />
      )}

      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>

        {/* DESKTOP & MOBILE SIDEBAR */}
        <Sidebar
          currentNav={currentNav}
          setCurrentNav={setCurrentNav}
          currentUser={currentUser}
          setAuthError={setAuthError}
          setAuthModalOpen={setAuthModalOpen}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          isMobile={isMobile}
          totalBacklogSummary={totalBacklogSummary}
          syncing={syncing}
          handleTriggerSync={handleTriggerSync}
          options={options}
          reportData={reportData}
          logoUrl={LOGO_URL}
        />

        {/* MAIN CONTENT AREA */}
        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* TOP HEADER BAR */}
          <TopHeader
            currentNav={currentNav}
            isMobile={isMobile}
            setMobileOpen={setMobileOpen}
            handleExportExcel={handleExportExcel}
            tonTkBtData={tonTkBtData}
            tonSyncing={tonSyncing}
            handleSyncTonTkBt={handleSyncTonTkBt}
          />

          {/* VIEW CONTENT CONTAINER */}
          <Box sx={{ p: { xs: 2, md: 3.5 }, flexGrow: 1 }}>

            {/* ========================================================================= */}
            {/* VIEW 1: KPIS DASHBOARD */}
            {/* ========================================================================= */}
            {currentNav === 'kpis' && (
              <KpisView
                summary={summary}
                setDetailModalOpen={setDetailModalOpen}
                fetchDichVu={fetchDichVu}
                setBtDetailModalOpen={setBtDetailModalOpen}
                setClps7nDetailModalOpen={setClps7nDetailModalOpen}
                datePreset={datePreset}
                setDatePreset={setDatePreset}
                handleDatePreset={handleDatePreset}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                selectedTeamLead={selectedTeamLead}
                setSelectedTeamLead={setSelectedTeamLead}
                selectedBlock={selectedBlock}
                setSelectedBlock={setSelectedBlock}
                options={options}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                order={order}
                orderBy={orderBy}
                handleRequestSort={handleRequestSort}
                loading={loading}
                sortedEmployees={sortedEmployees}
                handleOpenEmployee={handleOpenEmployee}
                dichVuData={dichVuData}
                dichVuLoading={dichVuLoading}
                filteredBlocks={filteredBlocks}
                error={error}
              />
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: LỊCH TRỰC KỸ THUẬT (FULL INTEGRATION FROM APPS SCRIPT CODE & HTML)  */}
            {/* ========================================================================= */}
            {currentNav === 'lich_truc' && (
              <LichTrucView
                ltTab={ltTab}
                setLtTab={setLtTab}
                fetchLichTrucDashboard={fetchLichTrucDashboard}
                fetchLichTrucChiTiet={fetchLichTrucChiTiet}
                fetchLichTrucHistory={fetchLichTrucHistory}
                ltDate={ltDate}
                setLtDate={setLtDate}
                ltDashDoiTruong={ltDashDoiTruong}
                setLtDashDoiTruong={setLtDashDoiTruong}
                options={options}
                ltLoading={ltLoading}
                ltDashData={ltDashData}
                ltOffStaffSearch={ltOffStaffSearch}
                setLtOffStaffSearch={setLtOffStaffSearch}
                thresholdModalOpen={thresholdModalOpen}
                setThresholdModalOpen={setThresholdModalOpen}
                tempTiLeTrucMin={tempTiLeTrucMin}
                setTempTiLeTrucMin={setTempTiLeTrucMin}
                tempTonPerNsMax={tempTonPerNsMax}
                setTempTonPerNsMax={setTempTonPerNsMax}
                handleSaveThresholds={handleSaveThresholds}
                ltThresholds={ltThresholds}
                renderLichTrucChiTiet={renderLichTrucChiTiet}
                ltHistMonth={ltHistMonth}
                setLtHistMonth={setLtHistMonth}
                ltHistYear={ltHistYear}
                setLtHistYear={setLtHistYear}
                ltHistDoiTruong={ltHistDoiTruong}
                setLtHistDoiTruong={setLtHistDoiTruong}
                ltHistSearch={ltHistSearch}
                setLtHistSearch={setLtHistSearch}
                ltHistLimit2Only={ltHistLimit2Only}
                setLtHistLimit2Only={setLtHistLimit2Only}
                ltHistLoading={ltHistLoading}
                ltHistData={ltHistData}
                handleExportHistoryCSV={handleExportHistoryCSV}
                timelineModalOpen={timelineModalOpen}
                setTimelineModalOpen={setTimelineModalOpen}
                selectedStaffTimeline={selectedStaffTimeline}
                setSelectedStaffTimeline={setSelectedStaffTimeline}
                exportCaOStaffCsv={exportCaOStaffCsv}
              />
            )}

            {/* ========================================================================= */}
            {/* VIEW 3: QUẢN LÝ TỒN TK-BT (REAL-TIME DASHBOARD) */}
            {/* ========================================================================= */}
            {currentNav === 'ton_tk_bt' && (
              <TonTkBtView
                tonTkBtDoiTruong={tonTkBtDoiTruong}
                setTonTkBtDoiTruong={setTonTkBtDoiTruong}
                dynamicTonTkBtMetrics={dynamicTonTkBtMetrics}
                setOver72hModalOpen={setOver72hModalOpen}
                setOver24hModalOpen={setOver24hModalOpen}
                tonTkBtSubTab={tonTkBtSubTab}
                setTonTkBtSubTab={setTonTkBtSubTab}
                tonSyncing={tonSyncing}
                handleSyncTonTkBt={handleSyncTonTkBt}
                setImportTonModalOpen={setImportTonModalOpen}
                setImportTonResult={setImportTonResult}
                handleExportBacklogCSV={handleExportBacklogCSV}
                tonTkBtLoading={tonTkBtLoading}
                tonTkBtData={tonTkBtData}
                options={options}
                setTonTkBtBlockFilter={setTonTkBtBlockFilter}
                tonTkBtTypeFilter={tonTkBtTypeFilter}
                setTonTkBtTypeFilter={setTonTkBtTypeFilter}
                tonTkBtCondFilter={tonTkBtCondFilter}
                setTonTkBtCondFilter={setTonTkBtCondFilter}
                tonTkBtNoteFilter={tonTkBtNoteFilter}
                setTonTkBtNoteFilter={setTonTkBtNoteFilter}
                tonTkBtSearch={tonTkBtSearch}
                setTonTkBtSearch={setTonTkBtSearch}
                setSelectedNoteItem={setSelectedNoteItem}
                setNoteDetailModalOpen={setNoteDetailModalOpen}
                over72hModalOpen={over72hModalOpen}
                over24hModalOpen={over24hModalOpen}
                noteDetailModalOpen={noteDetailModalOpen}
                selectedNoteItem={selectedNoteItem}
                importTonModalOpen={importTonModalOpen}
                importingTon={importingTon}
                importTonMode={importTonMode}
                setImportTonMode={setImportTonMode}
                importTonResult={importTonResult}
                tonImportInputRef={tonImportInputRef}
                handleImportTonFileSelect={handleImportTonFileSelect}
                filteredBacklogDetails={filteredBacklogDetails}
              />
            )}

            {/* ========================================================================= */}
            {/* MAIN NAVIGATION TAB 4: TRANG QUẢN TRỊ (ADMIN PAGE) */}
            {/* ========================================================================= */}
            {currentNav === 'admin' && (
              <AdminView
                currentUser={currentUser}
                adminSubTab={adminSubTab}
                setAdminSubTab={setAdminSubTab}
                fetchAdminHrList={fetchAdminHrList}
                fetchAdminUsers={fetchAdminUsers}
                fetchLichTrucChiTiet={fetchLichTrucChiTiet}
                fetchDbCounts={fetchDbCounts}
                fetchLuongList={fetchLuongList}
                fetchAdminLoadingSlides={fetchAdminLoadingSlides}
                handleLogout={handleLogout}
                hrLoading={hrLoading}
                hrList={hrList}
                hrSearch={hrSearch}
                setHrSearch={setHrSearch}
                hrTlFilter={hrTlFilter}
                setHrTlFilter={setHrTlFilter}
                hrBlockFilter={hrBlockFilter}
                setHrBlockFilter={setHrBlockFilter}
                options={options}
                openUnifiedHrModal={openUnifiedHrModal}
                setHrToDelete={setHrToDelete}
                setHrDeleteModalOpen={setHrDeleteModalOpen}
                adminUsersLoading={adminUsersLoading}
                adminUsers={adminUsers}
                showPasswords={showPasswords}
                toggleShowPassword={toggleShowPassword}
                setUserForm={setUserForm}
                setEditingUser={setEditingUser}
                setUserModalOpen={setUserModalOpen}
                setUserToDelete={setUserToDelete}
                setDeleteConfirmOpen={setDeleteConfirmOpen}
                renderLichTrucChiTiet={renderLichTrucChiTiet}
                dbCounts={dbCounts}
                syncing={syncing}
                handleSyncSheetNow={handleSyncSheetNow}
                handleTriggerSync={handleTriggerSync}
                importTarget={importTarget}
                setImportTarget={setImportTarget}
                importRule={importRule}
                setImportRule={setImportRule}
                dbFile={dbFile}
                setDbFile={setDbFile}
                dbUploading={dbUploading}
                handleImportDbDataset={handleImportDbDataset}
                dbResult={dbResult}
                setDbResult={setDbResult}
                dbInputRef={dbInputRef}
                importInputRef={importInputRef}
                setClearTarget={setClearTarget}
                setClearModalOpen={setClearModalOpen}
                setClearPassword={setClearPassword}
                setClearError={setClearError}
                clearModalOpen={clearModalOpen}
                clearTarget={clearTarget}
                clearPassword={clearPassword}
                clearError={clearError}
                clearingDb={clearingDb}
                handleClearDbDataset={handleClearDbDataset}
                setImportTonModalOpen={setImportTonModalOpen}
                luongLoading={luongLoading}
                luongList={luongList}
                luongSearch={luongSearch}
                setLuongSearch={setLuongSearch}
                luongTlFilter={luongTlFilter}
                setLuongTlFilter={setLuongTlFilter}
                luongBlockFilter={luongBlockFilter}
                setLuongBlockFilter={setLuongBlockFilter}
                setPositionModalOpen={setPositionModalOpen}
                adminLoadingSlides={adminLoadingSlides}
                setEditingSlide={setEditingSlide}
                setAdminSlideModalOpen={setAdminSlideModalOpen}
                handleToggleSlideActive={handleToggleSlideActive}
                handleDeleteSlide={handleDeleteSlide}
                setPreviewLoadingModalOpen={setPreviewLoadingModalOpen}
                handleResetLoadingSlides={handleResetLoadingSlides}
                isAdmin={isAdmin}
                canImport={canImport}
              />
            )}

          </Box>
        </Box>

        {/* TRANSACTION TYPES MODAL */}
        <DetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          summary={summary}
        />

        {/* BT TRANSACTION TYPES MODAL */}
        <BtDetailModal
          open={btDetailModalOpen}
          onClose={() => setBtDetailModalOpen(false)}
          summary={summary}
        />

        {/* CLPS 7N BT DETAILS MODAL */}
        <Clps7nDetailModal
          open={clps7nDetailModalOpen}
          onClose={() => setClps7nDetailModalOpen(false)}
          summary={summary}
        />

        {/* EMPLOYEE TICKET DETAILS DRAWER */}
        <EmployeeDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          selectedEmployee={selectedEmployee}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loadingDetails={loadingDetails}
          empDetails={empDetails}
        />

        {/* AUTHENTICATION DIALOG MODAL */}
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          authTab={authTab}
          setAuthTab={setAuthTab}
          authError={authError}
          setAuthError={setAuthError}
          handleLogin={handleLogin}
          loginId={loginId}
          setLoginId={setLoginId}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          authLoading={authLoading}
          handleRegister={handleRegister}
          regMail={regMail}
          setRegMail={setRegMail}
          hrCheckResult={hrCheckResult}
          regUser={regUser}
          setRegUser={setRegUser}
          regPassword={regPassword}
          setRegPassword={setRegPassword}
          regConfirmPassword={regConfirmPassword}
          setRegConfirmPassword={setRegConfirmPassword}
        />

        {/* USER EDIT MODAL */}
        <UserEditModal
          open={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          initialData={userForm}
          isEditMode={Boolean(editingUser)}
          onSave={handleSaveUser}
        />

        {/* DELETE USER CONFIRM DIALOG */}
        <UserDeleteModal
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          userToDelete={userToDelete}
          onDelete={handleDeleteUser}
        />

        {/* UNIFIED HR PROFILE MODAL */}
        <UnifiedHrProfileModal
          open={unifiedHrModalOpen}
          onClose={() => setUnifiedHrModalOpen(false)}
          initialData={unifiedHrProfile}
          isNew={isNewHrProfile}
          loading={hrDetailLoading}
          options={options}
          hrList={hrList}
          onSave={handleSaveUnifiedHr}
        />

        {/* GOOGLE APPS SCRIPT GUIDE & CODE MODAL */}
        <AppsScriptGuideModal
          open={appsScriptGuideOpen}
          onClose={() => setAppsScriptGuideOpen(false)}
        />

        {/* HR DELETE CONFIRM MODAL */}
        <HrDeleteModal
          open={hrDeleteModalOpen}
          onClose={() => setHrDeleteModalOpen(false)}
          hrToDelete={hrToDelete}
          onDelete={handleDeleteHr}
        />

        {/* POSITION BREAKDOWN MODAL (CHỨC DANH CỘT O) */}
        <PositionModal
          open={positionModalOpen}
          onClose={() => setPositionModalOpen(false)}
          hrList={hrList}
        />

        {/* ADMIN SLIDE EDIT / ADD MODAL */}
        <AdminSlideEditModal
          open={adminSlideModalOpen}
          onClose={() => {
            setAdminSlideModalOpen(false);
            setEditingSlide(null);
          }}
          initialData={editingSlide}
          onSave={handleSaveSlideForm}
        />

        {/* FULLSCREEN PREVIEW LOADING SCREEN MODAL */}
        <PreviewLoadingModal
          open={previewLoadingModalOpen}
          onClose={() => setPreviewLoadingModalOpen(false)}
          adminLoadingSlides={adminLoadingSlides}
        />

      </Box>
    </ThemeProvider>
  );
}
