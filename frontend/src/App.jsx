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
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormControl,
  RadioGroup,
  Radio,
  Menu,
  Switch,
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
  VpnKey as VpnKeyIcon,
  MonetizationOn as SalaryIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  CheckCircleOutlined as CheckCircleOutlineIcon,
  ReceiptLong as ReceiptLongIcon,
  Paid as PaidIcon,
  TrendingDown as TrendingDownIcon,
  Percent as PercentIcon
} from '@mui/icons-material';

import axios from 'axios';
import * as XLSX from 'xlsx';
import theme from './theme';
import SOPLoadingScreen from './components/SOPLoadingScreen';
import { DEFAULT_SOP_SLIDES } from './config/sopSlides';

const API_BASE = '/api/kpi';
const LOGO_URL = 'https://management.mypt.vn/images/FPT_Telecom_logo.svg';

// Custom Dropdown Component with Quick Search & Add Option
const SearchableAddableSelect = ({ label, value, options = [], onChange, onAddOption, placeholder = "Chọn hoặc thêm..." }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchKw, setSearchKw] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newVal, setNewVal] = useState('');
  const [extraOptions, setExtraOptions] = useState([]);

  const open = Boolean(anchorEl);

  const combinedOptions = useMemo(() => {
    const set = new Set([...(options || []), ...extraOptions]);
    if (value && !set.has(value)) set.add(value);
    return Array.from(set).filter(Boolean);
  }, [options, extraOptions, value]);

  const filtered = useMemo(() => {
    if (!searchKw.trim()) return combinedOptions;
    return combinedOptions.filter(opt => String(opt).toLowerCase().includes(searchKw.toLowerCase()));
  }, [combinedOptions, searchKw]);

  const handleAddSubmit = () => {
    const trimmed = newVal.trim();
    if (trimmed) {
      if (!extraOptions.includes(trimmed)) {
        setExtraOptions(prev => [...prev, trimmed]);
      }
      if (onAddOption) onAddOption(trimmed);
      onChange(trimmed);
      setNewVal('');
      setIsAdding(false);
      setAnchorEl(null);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        label={label}
        value={value || ''}
        placeholder={placeholder}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        InputProps={{
          readOnly: false,
          endAdornment: (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
              <ChevronRightIcon sx={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }} />
            </IconButton>
          )
        }}
        onChange={(e) => onChange(e.target.value)}
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => { setAnchorEl(null); setIsAdding(false); setSearchKw(''); }}
        PaperProps={{ sx: { width: anchorEl?.clientWidth || 280, maxHeight: 340, p: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', borderRadius: 2 } }}
      >
        <Box sx={{ p: 1, pb: 1, borderBottom: '1px solid #e2e8f0', mb: 1 }}>
          <TextField
            autoFocus
            size="small"
            fullWidth
            placeholder="🔍 Tìm kiếm nhanh..."
            value={searchKw}
            onChange={(e) => setSearchKw(e.target.value)}
            sx={{ '& .MuiInputBase-root': { fontSize: '13px', borderRadius: 1.5 } }}
          />
        </Box>

        {!isAdding ? (
          <MenuItem
            onClick={() => setIsAdding(true)}
            sx={{ fontWeight: 800, color: '#2563eb', backgroundColor: '#eff6ff', borderRadius: 1.5, mb: 1, fontSize: '13px' }}
          >
            ➕ Thêm giá trị mới vào danh sách...
          </MenuItem>
        ) : (
          <Box sx={{ p: 1, backgroundColor: '#f8fafc', borderRadius: 1.5, mb: 1, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Nhập giá trị mới..."
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubmit(); }}
            />
            <Button size="small" variant="contained" onClick={handleAddSubmit} sx={{ minWidth: 50, fontWeight: 800 }}>Lưu</Button>
          </Box>
        )}

        {filtered.length === 0 ? (
          <MenuItem disabled sx={{ fontSize: '13px', color: '#94a3b8' }}>
            Không có kết quả khớp
          </MenuItem>
        ) : (
          filtered.map((opt) => (
            <MenuItem
              key={opt}
              selected={opt === value}
              onClick={() => {
                onChange(opt);
                setAnchorEl(null);
                setSearchKw('');
              }}
              sx={{ fontSize: '13px', fontWeight: opt === value ? 800 : 500, borderRadius: 1 }}
            >
              {opt}
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
};


// Debounced Search Input for instantaneous typing without App re-render lag
const DebouncedSearchInput = React.memo(({ value, onChange, delay = 200, ...props }) => {
  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localVal !== value) {
        onChange(localVal);
      }
    }, delay);
    return () => clearTimeout(handler);
  }, [localVal, delay, onChange, value]);

  return (
    <TextField
      {...props}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
    />
  );
});

// Isolated Unified HR Profile Modal (Local State Buffering)
const UnifiedHrProfileModal = React.memo(({
  open,
  onClose,
  initialData,
  isNew,
  loading,
  options,
  hrList,
  onSave
}) => {
  const [formData, setFormData] = useState({});
  const [searchKw, setSearchKw] = useState('');

  useEffect(() => {
    if (open) {
      setFormData(initialData || {});
      setSearchKw('');
    }
  }, [open, initialData]);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', position: 'relative' }}>
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>

          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              position: 'absolute',
              top: 14,
              right: 54,
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 2,
              px: 2.5,
              '&:hover': { backgroundColor: '#15803d' }
            }}
          >
            💾 Lưu Hồ Sơ HR
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '20px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
              <PeopleIcon sx={{ fontSize: 36 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
                {isNew ? '➕ Thêm Mới Hồ Sơ Nhân Sự HR' : (formData?.['Họ Tên NV'] || formData?.['Mã NV'] || 'Hồ Sơ Nhân Sự')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip label={`Mã NV: ${formData?.['Mã NV'] || '-'}`} size="small" sx={{ backgroundColor: '#334155', color: '#f8fafc', fontWeight: 800 }} />
                <Chip label={`Inside: ${formData?.['Inside Account'] || '-'}`} size="small" sx={{ backgroundColor: '#312e81', color: '#c7d2fe', fontWeight: 800 }} />
                <Chip label={`Mobisale: ${formData?.['Mobisale'] || '-'}`} size="small" sx={{ backgroundColor: '#1e3a8a', color: '#bfdbfe', fontWeight: 800 }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <TextField
              fullWidth
              size="small"
              placeholder="🔍 Lọc các trường trong hồ sơ để tìm & chỉnh sửa nhanh..."
              value={searchKw}
              onChange={(e) => setSearchKw(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} /> }}
              sx={{ '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#ffffff' } }}
            />

            {/* SECTION 1: PERSONAL & CONTACT */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#2563eb', mb: 2 }}>
                👤 1. Thông Tin Cá Nhân & Tài Khoản Liên Hệ
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Mã Nhân Viên (Code) *"
                    value={formData['Mã NV'] || ''}
                    disabled={!isNew}
                    onChange={(e) => handleChange('Mã NV', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Họ và Tên NV *"
                    value={formData['Họ Tên NV'] || ''}
                    onChange={(e) => handleChange('Họ Tên NV', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Inside Account"
                    value={formData['Inside Account'] || ''}
                    onChange={(e) => handleChange('Inside Account', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Mobisale Account"
                    value={formData['Mobisale'] || ''}
                    onChange={(e) => handleChange('Mobisale', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Email Công Việc"
                    value={formData['Email'] || ''}
                    onChange={(e) => handleChange('Email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Số Điện Thoại"
                    value={formData['Số điện thoại'] || ''}
                    onChange={(e) => handleChange('Số điện thoại', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Tình Trạng Tài Khoản"
                    value={formData['Tình trạng Tài khoản'] || 'Active'}
                    options={['Active', 'Inactive', 'Bình thường', 'Khóa']}
                    onChange={(val) => handleChange('Tình trạng Tài khoản', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Số CMND/CCCD"
                    value={formData['Số CMND'] || ''}
                    onChange={(e) => handleChange('Số CMND', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Ngày Cấp CMND"
                    value={formData['Ngày cấp'] || ''}
                    onChange={(e) => handleChange('Ngày cấp', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SECTION 2: WORKPLACE & BLOCK */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#7c3aed', mb: 2 }}>
                🏢 2. Đơn Vị & Block Công Tác
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Block Kỹ Thuật"
                    value={formData['Block'] || ''}
                    options={options?.blocks || []}
                    onChange={(val) => handleChange('Block', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Họ tên Đội Trưởng"
                    value={formData['Họ tên Đội trưởng'] || ''}
                    options={options?.team_leads || []}
                    onChange={(val) => handleChange('Họ tên Đội trưởng', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Chức Danh / Vị Trí"
                    value={formData['Chức danh'] || ''}
                    options={Array.from(new Set((hrList || []).map(r => r.title).filter(Boolean)))}
                    onChange={(val) => handleChange('Chức danh', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Tên Đối Tác"
                    value={formData['Tên Đối Tác'] || ''}
                    options={options?.partners || []}
                    onChange={(val) => handleChange('Tên Đối Tác', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Vùng Phụ Trách"
                    value={formData['Vùng'] || ''}
                    options={options?.regions || []}
                    onChange={(val) => handleChange('Vùng', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Chi Nhánh"
                    value={formData['Chi nhánh'] || ''}
                    onChange={(e) => handleChange('Chi nhánh', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SECTION 3: CONTRACT & SALARY ASSIGNMENT */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#059669', mb: 2 }}>
                📜 3. Hợp Đồng & Phân Công Tính Lương
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Tình Trạng Hợp Đồng (Cột M)"
                    value={formData['Tình trạng Hợp đồng'] || 'NS Đang làm việc'}
                    options={['NS Đang làm việc', 'NS đã thôi việc', 'Thử việc', 'Chính thức', 'Active', 'Inactive']}
                    onChange={(val) => handleChange('Tình trạng Hợp đồng', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <SearchableAddableSelect
                    label="Loại HĐLĐ"
                    value={formData['Loại HĐLĐ'] || ''}
                    options={['HĐLĐ Xác định thời hạn', 'HĐLĐ Không xác định thời hạn', 'Hợp đồng khoán', 'Thử việc']}
                    onChange={(val) => handleChange('Loại HĐLĐ', val)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Ngày Vào Công Ty"
                    value={formData['Ngày vào công ty'] || ''}
                    onChange={(e) => handleChange('Ngày vào công ty', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Phân Công Tính Lương"
                    value={formData['Phân công'] || ''}
                    onChange={(e) => handleChange('Phân công', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth size="small" label="Hình Thức Tính Lương"
                    value={formData['Tính lương'] || ''}
                    onChange={(e) => handleChange('Tính lương', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SECTION 4: REMAINING DYNAMIC COLUMNS (NO HIDDEN DATA) */}
            {(() => {
              const usedKeys = [
                'Mã NV', 'Họ Tên NV', 'Inside Account', 'Mobisale', 'Email', 'Số điện thoại', 'Tình trạng Tài khoản', 'Số CMND', 'Ngày cấp', 'Block', 'Họ tên Đội trưởng', 'Chức danh', 'Tên Đối Tác', 'Vùng', 'Chi nhánh', 'Tình trạng Hợp đồng', 'Loại HĐLĐ', 'Ngày vào công ty', 'Phân công', 'Tính lương'
              ];
              const remainingEntries = Object.entries(formData).filter(([k, v]) => {
                const isUsed = usedKeys.some(uk => k.toLowerCase() === uk.toLowerCase());
                if (isUsed) return false;
                if (!searchKw) return true;
                const kw = searchKw.toLowerCase();
                return k.toLowerCase().includes(kw) || String(v).toLowerCase().includes(kw);
              });

              if (remainingEntries.length === 0) return null;

              return (
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#475569', mb: 2 }}>
                    📌 4. Tất Cả Cột Thông Tin Bổ Sung Khác
                  </Typography>
                  <Grid container spacing={2}>
                    {remainingEntries.map(([key, val]) => (
                      <Grid item xs={12} sm={6} md={4} key={key}>
                        <TextField
                          fullWidth
                          size="small"
                          label={key}
                          value={val || ''}
                          onChange={(e) => handleChange(key, e.target.value)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              );
            })()}

          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
          Hủy Bỏ
        </Button>
        <Button onClick={handleSave} variant="contained" color="success" startIcon={<SaveIcon />} sx={{ borderRadius: 2, px: 3, fontWeight: 800 }}>
          💾 Lưu Thay Đổi Hồ Sơ HR
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// Isolated Admin User Edit / Add Modal (Local State Buffering)
const UserEditModal = React.memo(({
  open,
  onClose,
  initialData,
  isEditMode,
  onSave
}) => {
  const [formData, setFormData] = useState({
    msnv: '', name: '', mail: '', user: '', password: '', role: 'user', status: 'Active', allowed_apps: []
  });

  useEffect(() => {
    if (open) {
      setFormData(initialData || {
        msnv: '', name: '', mail: '', user: '', password: '', role: 'user', status: 'Active', allowed_apps: []
      });
    }
  }, [open, initialData]);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#1a73e8' }}>
        {isEditMode ? '✏️ SỬA TÀI KHOẢN NGƯỜI DÙNG & PHÂN QUYỀN' : '➕ THÊM USER MỚI (QUẢN TRỊ USER)'}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="MSNV" value={formData.msnv || ''} onChange={(e) => handleChange('msnv', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Họ và Tên" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Email" value={formData.mail || ''} onChange={(e) => handleChange('mail', e.target.value)} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="User (Mật danh)" value={formData.user || ''} onChange={(e) => handleChange('user', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="password" label={isEditMode ? "Mật khẩu mới (Tùy chọn)" : "Mật khẩu"} value={formData.password || ''} onChange={(e) => handleChange('password', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Quyền Mặc Định" value={formData.role || 'user'} onChange={(e) => handleChange('role', e.target.value)}>
                <MenuItem value="user">User (Người dùng thường)</MenuItem>
                <MenuItem value="admin">Admin (Quản trị viên)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Trạng Thái Tài Khoản" value={formData.status || 'Active'} onChange={(e) => handleChange('status', e.target.value)}>
                <MenuItem value="Active">Active (Hoạt động)</MenuItem>
                <MenuItem value="Inactive">Inactive (Khóa / Không hoạt động)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
            🔒 Phân Quyền Ứng Dụng Được Xem (RBAC Phân Quyền):
          </Typography>

          <Grid container spacing={1}>
            {[
              { key: 'Salary', label: '💵 Salary (Quản Lý Lương)' },
              { key: 'HR', label: '👥 HR (HR Nhân Sự)' },
              { key: 'KPIs', label: '📊 KPIs (Dashboard KPIs)' },
              { key: 'LichTruc', label: '📋 LichTruc (Lịch Trực)' },
              { key: 'TonTKBT', label: '📦 TonTKBT (Tồn TK-BT)' },
              { key: 'UserMgmt', label: '🔑 UserMgmt (Quản Trị User)' },
              { key: 'ImportDB', label: '📦 ImportDB (Import Data)' },
              { key: 'Admin', label: '⚙️ Admin (Trang Admin)' }
            ].map((item) => {
              const appsList = Array.isArray(formData.allowed_apps)
                ? formData.allowed_apps.map(x => String(x).trim().toLowerCase())
                : (typeof formData.allowed_apps === 'string' ? formData.allowed_apps.toLowerCase().split(/[;,]/) : []);
              const isChecked = appsList.includes(item.key.toLowerCase());

              return (
                <Grid item xs={12} sm={6} key={item.key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          let newApps = Array.isArray(formData.allowed_apps) ? [...formData.allowed_apps] : [];
                          if (checked) {
                            if (!newApps.some(a => a.toLowerCase() === item.key.toLowerCase())) {
                              newApps.push(item.key);
                            }
                          } else {
                            newApps = newApps.filter(a => a.toLowerCase() !== item.key.toLowerCase());
                          }
                          setFormData(prev => ({ ...prev, allowed_apps: newApps }));
                        }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Hủy</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Lưu Phân Quyền</Button>
      </DialogActions>
    </Dialog>
  );
});

// Isolated Add Schedule Row Modal (Local State Buffering)
const AddLichTrucRowModal = React.memo(({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    mail: '', code: '', name: '', partner: '', block: '', month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });

  useEffect(() => {
    if (open) {
      setFormData({
        mail: '', code: '', name: '', partner: '', block: '', month: new Date().getMonth() + 1, year: new Date().getFullYear()
      });
    }
  }, [open]);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>➕ Thêm Dòng Lịch Trực Mới</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Mail *</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: PNC01.NHANHT6@fpt.com"
              value={formData.mail}
              onChange={(e) => handleChange('mail', e.target.value)}
            />
          </Box>

          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Mã Nhân Viên (CodeStaff)</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: 280558"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
            />
          </Box>

          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Họ và Tên (Name)</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: Cao Tiến Triều"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Box>

          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Đối Tác (Partner)</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: Phương Nam-01"
              value={formData.partner}
              onChange={(e) => handleChange('partner', e.target.value)}
            />
          </Box>

          <Box>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Block</FormLabel>
            <TextField
              fullWidth
              size="small"
              placeholder="vd: Phuong Long Truong-002"
              value={formData.block}
              onChange={(e) => handleChange('block', e.target.value)}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Tháng</FormLabel>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={formData.month}
                onChange={(e) => handleChange('month', Number(e.target.value))}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormLabel sx={{ fontSize: '12px', fontWeight: 700, display: 'block', mb: 0.5 }}>Năm</FormLabel>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={formData.year}
                onChange={(e) => handleChange('year', Number(e.target.value))}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Hủy</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Thêm Dòng</Button>
      </DialogActions>
    </Dialog>
  );
});

// Isolated Admin Slide Edit / Add Modal (Local State Buffering)
const AdminSlideEditModal = React.memo(({
  open,
  onClose,
  initialData,
  onSave
}) => {
  const [formData, setFormData] = useState({
    tag: '',
    category: '',
    title: '',
    target: '',
    stepsText: '',
    note: '',
    badgeColor: '#2563eb',
    icon: 'EngineeringOutlined',
    is_active: true
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          tag: initialData.tag || '',
          category: initialData.category || '',
          title: initialData.title || '',
          target: initialData.target || '',
          stepsText: Array.isArray(initialData.steps) ? initialData.steps.join('\n') : (initialData.stepsText || ''),
          note: initialData.note || '',
          badgeColor: initialData.badgeColor || '#2563eb',
          icon: initialData.icon || 'EngineeringOutlined',
          is_active: initialData.is_active !== false
        });
      } else {
        setFormData({
          tag: 'QUY TRÌNH MỚI',
          category: 'Kỹ Thuật SG01',
          title: '',
          target: '',
          stepsText: '1. Tiếp nhận phiếu và kiểm tra thông tin kỹ thuật.\n2. Khảo sát hiện trường và đo kiểm chuẩn thông số.\n3. Hướng dẫn khách hàng nghiệm thu và bàn giao chu đáo.',
          note: '💡 Khuyến nghị: Tuân thủ đúng chuẩn thao tác kỹ thuật để triệt tiêu ca lặp!',
          badgeColor: '#0284c7',
          icon: 'EngineeringOutlined',
          is_active: true
        });
      }
    }
  }, [open, initialData]);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleFormSubmit = () => {
    if (!formData.title.trim()) {
      alert("Vui lòng nhập Tiêu đề Slide!");
      return;
    }
    const steps = formData.stepsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const gradientMap = {
      '#7c3aed': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      '#0284c7': 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      '#ea580c': 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      '#059669': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      '#d97706': 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      '#dc2626': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
    };

    onSave({
      ...formData,
      steps,
      colorGradient: gradientMap[formData.badgeColor] || `linear-gradient(135deg, ${formData.badgeColor} 0%, #1e293b 100%)`
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{initialData ? '✏️ Chỉnh Sửa Slide SOP' : '➕ Thêm Slide SOP / Quy Trình Mới'}</span>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth size="small" label="Nhãn / Tag (VD: CHẤT LƯỢNG, AN TOÀN)"
                value={formData.tag}
                onChange={(e) => handleChange('tag', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth size="small" label="Danh mục (VD: G-Safe, Kiểm soát CLL)"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth size="small" label="Tiêu Đề Slide *"
            placeholder="vd: Quy Trình Triệt Tiêu CLL30N & Lặp Ca Bảo Trì"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />

          <TextField
            fullWidth size="small" label="Chỉ Tiêu / Mục Tiêu KPI"
            placeholder="vd: Chỉ tiêu: CLL30N <= 7.0% • CLPS 7N <= 3.0%"
            value={formData.target}
            onChange={(e) => handleChange('target', e.target.value)}
          />

          <Box>
            <FormLabel sx={{ fontSize: '13px', fontWeight: 700, display: 'block', mb: 0.5, color: '#334155' }}>
              Các Bước Quy Trình (Mỗi dòng là 1 bước)
            </FormLabel>
            <TextField
              fullWidth
              multiline
              rows={5}
              placeholder="1. Bước 1: Tiếp nhận...\n2. Bước 2: Khảo sát..."
              value={formData.stepsText}
              onChange={(e) => handleChange('stepsText', e.target.value)}
            />
          </Box>

          <TextField
            fullWidth size="small" label="Ghi Chú / Khuyến Nghị / Tip"
            placeholder="vd: 💡 Bí quyết: Đo kiểm kỹ suy hao quang trước khi nghiệm thu..."
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Biểu Tượng (Icon)"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
              >
                <MenuItem value="EngineeringOutlined">🛠️ Kỹ thuật viên (Engineering)</MenuItem>
                <MenuItem value="SpeedOutlined">⚡ Tốc độ / Đúng hẹn (Speed)</MenuItem>
                <MenuItem value="ShieldOutlined">🛡️ An toàn lao động (Shield)</MenuItem>
                <MenuItem value="SentimentSatisfiedAltOutlined">😊 Trải nghiệm khách hàng (Happy)</MenuItem>
                <MenuItem value="TipsAndUpdatesOutlined">💡 Mẹo & Chỉ số KPI (Tips)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Màu Sắc Chủ Đạo"
                value={formData.badgeColor}
                onChange={(e) => handleChange('badgeColor', e.target.value)}
              >
                <MenuItem value="#7c3aed">🟣 Tím (Chất lượng / CLL)</MenuItem>
                <MenuItem value="#0284c7">🔵 Xanh dương (Triển khai TK)</MenuItem>
                <MenuItem value="#ea580c">🟠 Cam (An toàn G-Safe)</MenuItem>
                <MenuItem value="#059669">🟢 Xanh lá (Khách hàng / CS)</MenuItem>
                <MenuItem value="#d97706">🟡 Vàng hổ phách (Mẹo KPI)</MenuItem>
                <MenuItem value="#dc2626">🔴 Đỏ (Cảnh báo / Khẩn)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                color="primary"
              />
            }
            label={<Typography sx={{ fontSize: 14, fontWeight: 600 }}>Kích hoạt hiển thị trên màn hình tải (Active)</Typography>}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Hủy</Button>
        <Button onClick={handleFormSubmit} variant="contained" color="primary" startIcon={<SaveIcon />} sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}>
          Lưu Slide
        </Button>
      </DialogActions>
    </Dialog>
  );
});

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* HIDDEN CSV INPUT */}
      {isEditable && (
        <input
          type="file"
          accept=".csv"
          ref={importInputRef}
          style={{ display: 'none' }}
          onChange={handleImportCsvFile}
        />
      )}

      {/* TOOLBAR */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3} md={isEditable ? 1.5 : 2}>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Tháng</FormLabel>
            <TextField select fullWidth size="small" value={ltCtMonth} onChange={(e) => setLtCtMonth(Number(e.target.value))}>
              <MenuItem value={0}>Tất cả</MenuItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3} md={isEditable ? 1.5 : 2}>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Năm</FormLabel>
            <TextField select fullWidth size="small" value={ltCtYear} onChange={(e) => setLtCtYear(Number(e.target.value))}>
              <MenuItem value={0}>Tất cả</MenuItem>
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={isEditable ? 2.5 : 3}>
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

          <Grid item xs={12} sm={4} md={isEditable ? 1.8 : 2}>
            <Button variant="outlined" color="primary" fullWidth onClick={() => setSortBlockEnabled(!sortBlockEnabled)} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5, fontSize: '12px' }}>
              🔤 Sort Block: {sortBlockEnabled ? 'Bật' : 'Tắt'}
            </Button>
          </Grid>

          {isEditable && (
            <Grid item xs={12} sm={4} md={1.2}>
              <Button variant="contained" color="info" fullWidth onClick={() => setAddRowOpen(true)} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5 }}>
                ➕ Thêm
              </Button>
            </Grid>
          )}

          {isEditable && (
            <Grid item xs={12} sm={4} md={1.2}>
              <Button variant="outlined" color="secondary" fullWidth onClick={() => importInputRef.current && importInputRef.current.click()} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5 }}>
                📥 Import
              </Button>
            </Grid>
          )}

          <Grid item xs={12} sm={4} md={isEditable ? 1.6 : 1.8}>
            <Button variant="contained" color="success" fullWidth onClick={handleExportLichTrucCSV} startIcon={<DownloadIcon />} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5, backgroundColor: '#1e8e3e' }}>
              Xuất CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* STICKY DATA TABLE FOR 31 DAYS */}
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
                {isEditable && <TableCell align="center" sx={{ fontWeight: 700, minWidth: 120 }}>Thao Tác</TableCell>}
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
                  const isEditing = isEditable && editingRowNumber === rowObj.row;

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
                      {isEditable && (
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
                      )}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {isEditable && (<AddLichTrucRowModal open={addRowOpen} onClose={() => setAddRowOpen(false)} onSubmit={handleAddRowSubmit} />)}

    </Box>
  );

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
          {reportData?.metadata?.execution_time_ms && (
            <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 600, display: 'block', mt: 0.2 }}>
              ⚡ Độ trễ API: {reportData.metadata.execution_time_ms} ms
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
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

            {currentNav === 'ton_tk_bt' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {tonTkBtData?.lastSyncTime && (
                  <Chip
                    size="small"
                    label={`Cập nhật: ${tonTkBtData.lastSyncTime}`}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '11px', display: { xs: 'none', sm: 'inline-flex' }, borderColor: '#cbd5e1' }}
                  />
                )}
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={tonSyncing ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: '18px' }} />}
                  onClick={handleSyncTonTkBt}
                  disabled={tonSyncing}
                  sx={{
                    borderRadius: '18px',
                    textTransform: 'none',
                    px: 2,
                    fontWeight: 700,
                    fontSize: '13px',
                    backgroundColor: '#1a73e8',
                    boxShadow: '0 2px 6px rgba(26,115,232,0.3)'
                  }}
                >
                  {tonSyncing ? 'Đang kéo data...' : '🔄 Đồng Bộ Tồn'}
                </Button>
              </Box>
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
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 2, width: '100%' }}>
                  
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
                        {summary.tk_total_volume ?? ((summary.tk_volume_kpi || 0) + (summary.tk_swap_volume || 0) + (summary.tk_gsafe_volume || 0))}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.5 }}>
                        Tính KPI: <strong>{summary.tk_volume_kpi || 0}</strong> (✅ {summary.tk_dung_hen_1 || 0} | ❌ {summary.tk_dung_hen_0 || 0})
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                        <Chip
                          label={`🔥 >72H: ${summary.tk_gt_72h || 0} phiếu`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '11px',
                            height: 22,
                            backgroundColor: (summary.tk_gt_72h || 0) > 0 ? '#d32f2f' : '#f5f5f5',
                            color: (summary.tk_gt_72h || 0) > 0 ? '#ffffff' : '#616161'
                          }}
                        />
                        {(summary.tk_swap_volume || 0) > 0 && (
                          <Chip
                            label={`Swap: ${summary.tk_swap_volume}`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '11px',
                              height: 22,
                              backgroundColor: '#f3e8ff',
                              color: '#7c3aed',
                              border: '1px solid #d8b4fe'
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 700, display: 'block', mt: 0.8 }}>
                        Đúng hẹn TK: {summary.tk_dung_hen_pct || 0}%
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
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={`⚠️ >24H: ${summary.bt_gt_24h || 0} phiếu`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '11px',
                            height: 22,
                            backgroundColor: (summary.bt_gt_24h || 0) > 0 ? '#d32f2f' : '#f5f5f5',
                            color: (summary.bt_gt_24h || 0) > 0 ? '#ffffff' : '#616161'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#00897b', fontWeight: 700, display: 'block', mt: 0.8 }}>
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
                        {`${summary.cll30n_pct || 0}%`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.2 }}>
                        {`HĐ: ${summary.cll30n_count || 0} / ${summary.kh_cls_count || summary.cll30n_count || 0}`}
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

                  {/* Card 6: CLPS 7N BT */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${summary.clps7n_status === 'PASS' ? '#e1bee7' : '#ffcdd2'}`, borderLeft: `6px solid ${summary.clps7n_status === 'PASS' ? '#7b1fa2' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#7b1fa2', fontWeight: 800 }}>
                          {"CLPS 7N BT (<= 3%)"}
                        </Typography>
                        <TrendingUpIcon sx={{ color: summary.clps7n_status === 'PASS' ? '#7b1fa2' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.clps7n_status === 'PASS' ? '#7b1fa2' : '#d32f2f', letterSpacing: '-1px' }}>
                        {`${summary.clps7n_pct || 0}%`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.2 }}>
                        {`HĐ: ${summary.clps7n_count || 0} / ${summary.kh_cls_count || summary.cll30n_count || 0}`}
                      </Typography>
                      <Box sx={{ mt: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Chip
                          label={summary.clps7n_status === 'PASS' ? "ĐẠT (<= 3%)" : "KHÔNG ĐẠT (> 3%)"}
                          size="small"
                          color={summary.clps7n_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                        <Button
                          size="small"
                          startIcon={<InfoIcon sx={{ fontSize: '14px !important' }} />}
                          onClick={() => setClps7nDetailModalOpen(true)}
                          sx={{
                            p: 0,
                            textTransform: 'none',
                            fontWeight: 700,
                            color: '#7b1fa2',
                            fontSize: '11px',
                            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                          }}
                        >
                          Chi tiết
                        </Button>
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
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 600, display: 'block', mt: 0.2 }}>
                        🔥 TK &gt;72H: <strong style={{ color: (summary.tk_gt_72h || 0) > 0 ? '#d32f2f' : 'inherit' }}>{summary.tk_gt_72h || 0}</strong> | ⚠️ BT &gt;24H: <strong style={{ color: (summary.bt_gt_24h || 0) > 0 ? '#d32f2f' : 'inherit' }}>{summary.bt_gt_24h || 0}</strong>
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

                {/* ========================================================================= */}
                {/* CHĂM SÓC KHÁCH HÀNG SECTION                                               */}
                {/* ========================================================================= */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Section Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 5, height: 28, borderRadius: 2, backgroundColor: '#0277bd' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#01579b', letterSpacing: '0.5px' }}>
                        📡 CHĂM SÓC KHÁCH HÀNG
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500 }}>
                        (Công nợ & Rời mạng — từ Sheet theo dõi dịch vụ)
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={fetchDichVu}
                      disabled={dichVuLoading}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '12px', color: '#0277bd', borderColor: '#0277bd' }}
                    >
                      {dichVuLoading ? '⏳ Đang tải...' : '🔄 Cập nhật'}
                    </Button>
                  </Box>

                  {/* 4 Metric Cards */}
                  {(() => {
                    // Tính tổng / trung bình từ dichVuData
                    const dvRows = dichVuData || [];
                    const tiLeDaTTArr = dvRows.filter(r => r.ti_le_da_tt !== null).map(r => r.ti_le_da_tt);
                    const avgTiLeDaTT = tiLeDaTTArr.length > 0 ? (tiLeDaTTArr.reduce((a, b) => a + b, 0) / tiLeDaTTArr.length) : null;
                    const rmKHTotal = dvRows.filter(r => r.roi_mang_kh !== null).reduce((s, r) => s + (r.roi_mang_kh || 0), 0);
                    const rmDKTotal = dvRows.filter(r => r.roi_mang_du_kien !== null).reduce((s, r) => s + (r.roi_mang_du_kien || 0), 0);
                    const pctRMArr = dvRows.filter(r => r.pct_rm_hien_tai !== null).map(r => r.pct_rm_hien_tai);
                    const avgPctRM = pctRMArr.length > 0 ? (pctRMArr.reduce((a, b) => a + b, 0) / pctRMArr.length) : null;

                    const cardBase = {
                      elevation: 0,
                      sx: { borderRadius: 3, backgroundColor: '#ffffff', height: '100%' }
                    };

                    return (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>


                        {/* Card: % Công Nợ */}
                        <Card {...cardBase} sx={{ ...cardBase.sx, border: `1px solid ${avgTiLeDaTT !== null && avgTiLeDaTT >= 95 ? '#c8e6c9' : '#ffccbc'}`, borderLeft: `6px solid ${avgTiLeDaTT !== null && avgTiLeDaTT >= 95 ? '#2e7d32' : '#bf360c'}` }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="overline" sx={{ color: '#0288d1', fontWeight: 800, fontSize: '10px' }}>
                                % CÔNG NỢ (J)
                              </Typography>
                              <PaidIcon sx={{ color: avgTiLeDaTT !== null && avgTiLeDaTT >= 95 ? '#2e7d32' : '#bf360c', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: avgTiLeDaTT !== null && avgTiLeDaTT >= 95 ? '#1b5e20' : '#bf360c', letterSpacing: '-0.5px' }}>
                              {dichVuLoading ? '...' : avgTiLeDaTT !== null ? `${avgTiLeDaTT.toFixed(2)}%` : '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                              Trung bình % công nợ
                            </Typography>
                            <Chip
                              label={avgTiLeDaTT !== null ? (avgTiLeDaTT >= 95 ? 'ĐẠT (≥ 95%)' : 'CHƯA ĐẠT (< 95%)') : 'Chưa có dữ liệu'}
                              size="small"
                              color={avgTiLeDaTT !== null && avgTiLeDaTT >= 95 ? 'success' : 'error'}
                              sx={{ fontWeight: 800, fontSize: '10px', height: 20, mt: 0.8 }}
                            />
                          </CardContent>
                        </Card>

                        {/* Card: RM Kế Hoạch Tháng */}
                        <Card {...cardBase} sx={{ ...cardBase.sx, border: '1px solid #fff9c4', borderLeft: '6px solid #f9a825' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="overline" sx={{ color: '#f57f17', fontWeight: 800, fontSize: '10px' }}>
                                RM KẾ HOẠCH THÁNG (M)
                              </Typography>
                              <TrendingDownIcon sx={{ color: '#f9a825', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#e65100', letterSpacing: '-0.5px' }}>
                              {dichVuLoading ? '...' : dvRows.length > 0 ? rmKHTotal.toLocaleString('vi-VN') : '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                              Tổng RM kế hoạch tháng
                            </Typography>
                          </CardContent>
                        </Card>

                        {/* Card: Rời Mạng Dự Kiến */}
                        <Card {...cardBase} sx={{ ...cardBase.sx, border: '1px solid #fce4ec', borderLeft: '6px solid #c62828' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="overline" sx={{ color: '#c62828', fontWeight: 800, fontSize: '10px' }}>
                                RỜI MẠNG DỰ KIẾN (T)
                              </Typography>
                              <TrendingDownIcon sx={{ color: '#c62828', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#b71c1c', letterSpacing: '-0.5px' }}>
                              {dichVuLoading ? '...' : dvRows.length > 0 ? rmDKTotal.toLocaleString('vi-VN') : '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                              Tổng rời mạng dự kiến
                            </Typography>
                            {dvRows.length > 0 && rmKHTotal > 0 && (
                              <Typography variant="caption" sx={{ color: rmDKTotal > rmKHTotal ? '#d32f2f' : '#2e7d32', fontWeight: 700, display: 'block', mt: 0.3 }}>
                                {rmDKTotal > rmKHTotal ? `⬆️ Vượt KH: +${(rmDKTotal - rmKHTotal).toLocaleString('vi-VN')}` : `✅ Trong KH: ${(rmKHTotal - rmDKTotal).toLocaleString('vi-VN')} buffer`}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>

                        {/* Card: % RM Hiện Tại */}
                        <Card {...cardBase} sx={{ ...cardBase.sx, border: `1px solid ${avgPctRM !== null && avgPctRM <= 1.5 ? '#c8e6c9' : '#ffcdd2'}`, borderLeft: `6px solid ${avgPctRM !== null && avgPctRM <= 1.5 ? '#2e7d32' : '#d32f2f'}` }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="overline" sx={{ color: '#0288d1', fontWeight: 800, fontSize: '10px' }}>
                                % RM HIỆN TẠI (U)
                              </Typography>
                              <PercentIcon sx={{ color: avgPctRM !== null && avgPctRM <= 1.5 ? '#2e7d32' : '#d32f2f', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: avgPctRM !== null && avgPctRM <= 1.5 ? '#1b5e20' : '#b71c1c', letterSpacing: '-0.5px' }}>
                              {dichVuLoading ? '...' : avgPctRM !== null ? `${avgPctRM.toFixed(2)}%` : '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                              Trung bình % RM hiện tại
                            </Typography>
                            <Chip
                              label={avgPctRM !== null ? (avgPctRM <= 1.5 ? 'ĐẠT (≤ 1.5%)' : 'CHƯA ĐẠT (> 1.5%)') : 'Chưa có dữ liệu'}
                              size="small"
                              color={avgPctRM !== null && avgPctRM <= 1.5 ? 'success' : 'error'}
                              sx={{ fontWeight: 800, fontSize: '10px', height: 20, mt: 0.8 }}
                            />
                          </CardContent>
                        </Card>

                      </Box>
                    );
                  })()}

                  {!dichVuData && !dichVuLoading && (
                    <Box sx={{ textAlign: 'center', py: 2, color: '#9e9e9e' }}>
                      <Typography variant="body2">Chưa có dữ liệu Chăm Sóc Khách Hàng. Nhấn "Cập nhật" để tải.</Typography>
                    </Box>
                  )}
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
                  <Grid container spacing={2} alignItems="flex-end">
                    
                    <Grid item xs={12} sm={6} md={2}>
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

                    <Grid item xs={12} sm={6} md={2}>
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

                    <Grid item xs={12} sm={6} md={2}>
                      <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                        Lọc Theo Đội Trưởng
                      </FormLabel>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={selectedTeamLead}
                        onChange={(e) => {
                          setSelectedTeamLead(e.target.value);
                          // Reset block khi đổi đội trưởng để tránh chọn block không thuộc đội
                          setSelectedBlock('');
                        }}
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#fafafa' } }}
                      >
                        <MenuItem value="">-- Tất cả Đội Trưởng --</MenuItem>
                        {options.team_leads.map((tl) => (
                          <MenuItem key={tl} value={tl}>{tl}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={1.75}>
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

                    <Grid item xs={12} sm={6} md={2}>
                      <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                        Lọc Theo Block
                      </FormLabel>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={selectedBlock}
                        onChange={(e) => setSelectedBlock(e.target.value)}
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#fafafa' } }}
                      >
                        <MenuItem value="">-- Tất cả Block {selectedTeamLead ? `(${filteredBlocks.length})` : ''} --</MenuItem>
                        {filteredBlocks.map((b) => (
                          <MenuItem key={b} value={b}>{b}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={12} md={2.25}>
                      <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>
                        Tìm Inside Acc / NV
                      </FormLabel>
                      <DebouncedSearchInput
                        fullWidth
                        size="small"
                        placeholder="Nhập tên, mã hoặc account..."
                        value={searchQuery}
                        onChange={(val) => setSearchQuery(val)}
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
                          <TableRow sx={{ height: '38px' }}>
                            <TableCell rowSpan={2} sx={{ top: 0, zIndex: 12, verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderRight: '1px solid #e0e0e0', borderBottom: '2px solid #cbd5e1', width: 60, textAlign: 'center' }}>
                              STT
                            </TableCell>
                            
                            <TableCell rowSpan={2} sx={{ top: 0, zIndex: 12, verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderRight: '1px solid #e0e0e0', borderBottom: '2px solid #cbd5e1', minWidth: 200 }}>
                              <TableSortLabel
                                active={orderBy === 'name' || orderBy === 'account'}
                                direction={orderBy === 'name' || orderBy === 'account' ? order : 'asc'}
                                onClick={() => handleRequestSort('account')}
                              >
                                Nhân Viên (Inside Acc)
                              </TableSortLabel>
                            </TableCell>

                            <TableCell rowSpan={2} sx={{ top: 0, zIndex: 12, verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderRight: '1px solid #e0e0e0', borderBottom: '2px solid #cbd5e1', minWidth: 170 }}>
                              <TableSortLabel
                                active={orderBy === 'team_lead'}
                                direction={orderBy === 'team_lead' ? order : 'asc'}
                                onClick={() => handleRequestSort('team_lead')}
                              >
                                Đội Trưởng / Vùng / Block
                              </TableSortLabel>
                            </TableCell>

                            {/* CHĂM SÓC KHÁCH HÀNG (4 cột: % Công Nợ, RM KH Tháng, RM Dự Kiến, % RM Hiện Tại) */}
                            <TableCell colSpan={4} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#fce4ec', color: '#c62828', borderRight: '1px solid #f8bbd0', borderBottom: '1px solid #f8bbd0', fontSize: '13px' }}>
                              CHĂM SÓC KHÁCH HÀNG
                            </TableCell>

                            <TableCell colSpan={3} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#e8f0fe', color: '#1a73e8', borderRight: '1px solid #d2e3fc', borderBottom: '1px solid #d2e3fc', fontSize: '13px' }}>
                              KHỐI LƯỢNG CÔNG VIỆC
                            </TableCell>

                            <TableCell colSpan={2} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#fff3e0', color: '#e65100', borderRight: '1px solid #ffe0b2', borderBottom: '1px solid #ffe0b2', fontSize: '13px' }}>
                              TIẾN ĐỘ (RT)
                            </TableCell>

                            <TableCell colSpan={2} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#f3e5f5', color: '#7b1fa2', borderRight: '1px solid #e1bee7', borderBottom: '1px solid #e1bee7', fontSize: '13px' }}>
                              CHẤT LƯỢNG (CLL)
                            </TableCell>

                            <TableCell colSpan={3} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#e6f4ea', color: '#1e8e3e', borderRight: '1px solid #ceead6', borderBottom: '1px solid #ceead6', fontSize: '13px' }}>
                              CAM KẾT TIẾN ĐỘ
                            </TableCell>

                            <TableCell rowSpan={2} align="center" sx={{ top: 0, zIndex: 12, verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderBottom: '2px solid #cbd5e1', width: 100 }}>
                              Thao Tác
                            </TableCell>
                          </TableRow>

                          <TableRow sx={{ height: '44px' }}>
                            {/* CHĂM SÓC KHÁCH HÀNG - 4 sub-columns */}
                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff5f8', color: '#c2185b', px: 1, minWidth: 80 }}>
                              <TableSortLabel
                                active={orderBy === 'dv_ti_le_da_tt'}
                                direction={orderBy === 'dv_ti_le_da_tt' ? order : 'asc'}
                                onClick={() => handleRequestSort('dv_ti_le_da_tt')}
                              >
                                % Công Nợ
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff5f8', color: '#c2185b', px: 1, minWidth: 85 }}>
                              <TableSortLabel
                                active={orderBy === 'dv_roi_mang_kh'}
                                direction={orderBy === 'dv_roi_mang_kh' ? order : 'asc'}
                                onClick={() => handleRequestSort('dv_roi_mang_kh')}
                              >
                                RM Kế Hoạch Tháng
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff5f8', color: '#c2185b', px: 1, minWidth: 85 }}>
                              <TableSortLabel
                                active={orderBy === 'dv_roi_mang_du_kien'}
                                direction={orderBy === 'dv_roi_mang_du_kien' ? order : 'asc'}
                                onClick={() => handleRequestSort('dv_roi_mang_du_kien')}
                              >
                                Rời Mạng Dự Kiến
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff5f8', color: '#c2185b', px: 1, minWidth: 80, borderRight: '1px solid #f8bbd0' }}>
                              <TableSortLabel
                                active={orderBy === 'dv_pct_rm_hien_tai'}
                                direction={orderBy === 'dv_pct_rm_hien_tai' ? order : 'asc'}
                                onClick={() => handleRequestSort('dv_pct_rm_hien_tai')}
                              >
                                % RM Hiện Tại
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#f4f8fe', color: '#1a73e8' }}>
                              <TableSortLabel
                                active={orderBy === 'tk_kpi_volume'}
                                direction={orderBy === 'tk_kpi_volume' ? order : 'asc'}
                                onClick={() => handleRequestSort('tk_kpi_volume')}
                              >
                                Triển Khai (KPI)
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#f4f8fe', color: '#1a73e8' }}>
                              <TableSortLabel
                                active={orderBy === 'bt_volume'}
                                direction={orderBy === 'bt_volume' ? order : 'asc'}
                                onClick={() => handleRequestSort('bt_volume')}
                              >
                                Bảo Trì
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#f4f8fe', color: '#1a73e8', borderRight: '1px solid #d2e3fc' }}>
                              <TableSortLabel
                                active={orderBy === 'tk_swap_volume'}
                                direction={orderBy === 'tk_swap_volume' ? order : 'asc'}
                                onClick={() => handleRequestSort('tk_swap_volume')}
                              >
                                Swap
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff8e1', color: '#b06000' }}>
                              <TableSortLabel
                                active={orderBy === 'rt_tk_hours'}
                                direction={orderBy === 'rt_tk_hours' ? order : 'asc'}
                                onClick={() => handleRequestSort('rt_tk_hours')}
                              >
                                {"RT-TK (<=18H)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff8e1', color: '#b06000', borderRight: '1px solid #ffe0b2' }}>
                              <TableSortLabel
                                active={orderBy === 'rt_bt_hours'}
                                direction={orderBy === 'rt_bt_hours' ? order : 'asc'}
                                onClick={() => handleRequestSort('rt_bt_hours')}
                              >
                                {"RT-BT (<=8H)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 800, backgroundColor: '#f3e5f5', color: '#7b1fa2', borderRight: '1px solid #e1bee7' }}>
                              <TableSortLabel
                                active={orderBy === 'cll30n_pct'}
                                direction={orderBy === 'cll30n_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('cll30n_pct')}
                              >
                                {"CLL30N (%) (<=7%)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 800, backgroundColor: '#f3e5f5', color: '#7b1fa2', borderRight: '1px solid #e1bee7' }}>
                              <TableSortLabel
                                active={orderBy === 'clps7n_pct'}
                                direction={orderBy === 'clps7n_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('clps7n_pct')}
                              >
                                {"CLPS 7N BT (%) (<=3%)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 800, backgroundColor: '#e6f4ea', color: '#1e8e3e' }}>
                              <TableSortLabel
                                active={orderBy === 'total_dung_hen_pct'}
                                direction={orderBy === 'total_dung_hen_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('total_dung_hen_pct')}
                              >
                                {"TỔNG ĐÚNG HẸN (>=97.2%)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#e6f4ea', color: '#1e8e3e' }}>
                              <TableSortLabel
                                active={orderBy === 'tk_dung_hen_pct'}
                                direction={orderBy === 'tk_dung_hen_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('tk_dung_hen_pct')}
                              >
                                Đúng Hẹn TK (%)
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#e6f4ea', color: '#1e8e3e', borderRight: '1px solid #ceead6' }}>
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
                                {emp.team_lead === 'Chưa xác nhận' ? (
                                  <Chip label="⚠️ Chưa xác nhận" size="small" sx={{ height: 22, fontSize: '11px', fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }} />
                                ) : (
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#3c4043' }}>{emp.team_lead}</Typography>
                                )}
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25, alignItems: 'center' }}>
                                  {emp.region && <Chip label={emp.region} size="small" sx={{ height: 18, fontSize: '10px', backgroundColor: '#e8f0fe', color: '#1a73e8' }} />}
                                  {emp.block && <Chip label={emp.block} size="small" sx={{ height: 18, fontSize: '10px', backgroundColor: '#f1f5f9', color: '#475569' }} />}
                                </Box>
                              </TableCell>

                              {/* CHĂM SÓC KHÁCH HÀNG (4 cột nhỏ gọn tương ứng Khối Lượng Công Việc) */}
                              {/* 1. % Công Nợ */}
                              <TableCell align="center" sx={{ px: 1, py: 0.5, backgroundColor: '#fffbfe' }}>
                                {emp.dv_ti_le_da_tt !== null && emp.dv_ti_le_da_tt !== undefined ? (
                                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '12px', color: emp.dv_ti_le_da_tt >= 95 ? '#2e7d32' : '#c62828' }}>
                                    {emp.dv_ti_le_da_tt.toFixed(2)}%
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#bdbdbd', fontSize: '11px' }}>—</Typography>
                                )}
                              </TableCell>

                              {/* 2. RM Kế Hoạch Tháng */}
                              <TableCell align="center" sx={{ px: 1, py: 0.5, backgroundColor: '#fffbfe' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#e65100', fontSize: '12px' }}>
                                  {emp.dv_roi_mang_kh !== null && emp.dv_roi_mang_kh !== undefined
                                    ? emp.dv_roi_mang_kh.toLocaleString('vi-VN')
                                    : <span style={{ color: '#bdbdbd', fontSize: '11px' }}>—</span>}
                                </Typography>
                              </TableCell>

                              {/* 3. Rời Mạng Dự Kiến */}
                              <TableCell align="center" sx={{ px: 1, py: 0.5, backgroundColor: '#fffbfe' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#b71c1c', fontSize: '12px' }}>
                                  {emp.dv_roi_mang_du_kien !== null && emp.dv_roi_mang_du_kien !== undefined
                                    ? emp.dv_roi_mang_du_kien.toLocaleString('vi-VN')
                                    : <span style={{ color: '#bdbdbd', fontSize: '11px' }}>—</span>}
                                </Typography>
                              </TableCell>

                              {/* 4. % RM Hiện Tại */}
                              <TableCell align="center" sx={{ px: 1, py: 0.5, backgroundColor: '#fffbfe', borderRight: '1px solid #f8bbd0' }}>
                                {emp.dv_pct_rm_hien_tai !== null && emp.dv_pct_rm_hien_tai !== undefined ? (
                                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '12px', color: emp.dv_pct_rm_hien_tai <= 1.5 ? '#2e7d32' : '#c62828' }}>
                                    {emp.dv_pct_rm_hien_tai.toFixed(2)}%
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#bdbdbd', fontSize: '11px' }}>—</Typography>
                                )}
                              </TableCell>

                              {/* Volume Columns */}
                              <TableCell align="center">
                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a73e8' }}>
                                  {emp.tk_kpi_volume || 0}
                                </Typography>
                                {(emp.tk_gt_72h || 0) > 0 ? (
                                  <Box sx={{ mt: 0.3 }}>
                                    <Chip
                                      label={`>72H: ${emp.tk_gt_72h}`}
                                      size="small"
                                      sx={{ height: 18, fontSize: '10px', fontWeight: 800, backgroundColor: '#d32f2f', color: '#ffffff' }}
                                    />
                                  </Box>
                                ) : (
                                  <Typography variant="caption" sx={{ display: 'block', fontSize: '10.5px', color: '#9e9e9e', fontWeight: 500, mt: 0.2 }}>
                                    {`>72H: 0`}
                                  </Typography>
                                )}
                              </TableCell>

                              <TableCell align="center">
                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#00897b' }}>
                                  {emp.bt_volume || 0}
                                </Typography>
                                {(emp.bt_gt_24h || 0) > 0 ? (
                                  <Box sx={{ mt: 0.3 }}>
                                    <Chip
                                      label={`>24H: ${emp.bt_gt_24h}`}
                                      size="small"
                                      sx={{ height: 18, fontSize: '10px', fontWeight: 800, backgroundColor: '#d32f2f', color: '#ffffff' }}
                                    />
                                  </Box>
                                ) : (
                                  <Typography variant="caption" sx={{ display: 'block', fontSize: '10.5px', color: '#9e9e9e', fontWeight: 500, mt: 0.2 }}>
                                    {`>24H: 0`}
                                  </Typography>
                                )}
                              </TableCell>

                              <TableCell align="center" sx={{ borderRight: '1px solid #d2e3fc' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#5f6368' }}>
                                  {emp.tk_swap_volume || 0}
                                </Typography>
                              </TableCell>

                              {/* Progress RT Columns */}
                              <TableCell align="center">
                                {emp.rt_tk_hours !== null && emp.rt_tk_hours !== undefined && !isNaN(emp.rt_tk_hours) && emp.rt_tk_hours > 72.0 ? (
                                  <Chip
                                    label={emp.rt_tk_fmt || '-'}
                                    size="small"
                                    sx={{ height: 22, fontSize: '11px', fontWeight: 900, backgroundColor: '#d32f2f', color: '#ffffff', boxShadow: '0 2px 4px rgba(211,47,47,0.4)' }}
                                  />
                                ) : (
                                  <Typography variant="body2" sx={{
                                    fontWeight: 800,
                                    color: (emp.rt_tk_hours !== null && emp.rt_tk_hours !== undefined && !isNaN(emp.rt_tk_hours))
                                      ? (emp.rt_tk_hours <= 18.0 ? '#2e7d32' : '#d32f2f')
                                      : '#5f6368'
                                  }}>
                                    {emp.rt_tk_fmt || '-'}
                                  </Typography>
                                )}
                              </TableCell>

                              <TableCell align="center" sx={{ borderRight: '1px solid #ffe0b2' }}>
                                {emp.rt_bt_hours !== null && emp.rt_bt_hours !== undefined && !isNaN(emp.rt_bt_hours) && emp.rt_bt_hours > 24.0 ? (
                                  <Chip
                                    label={emp.rt_bt_fmt || '-'}
                                    size="small"
                                    sx={{ height: 22, fontSize: '11px', fontWeight: 900, backgroundColor: '#d32f2f', color: '#ffffff', boxShadow: '0 2px 4px rgba(211,47,47,0.4)' }}
                                  />
                                ) : (
                                  <Typography variant="body2" sx={{
                                    fontWeight: 800,
                                    color: (emp.rt_bt_hours !== null && emp.rt_bt_hours !== undefined && !isNaN(emp.rt_bt_hours))
                                      ? (emp.rt_bt_hours <= 8.0 ? '#2e7d32' : '#d32f2f')
                                      : '#5f6368'
                                  }}>
                                    {emp.rt_bt_fmt || '-'}
                                  </Typography>
                                )}
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

                              {/* CLPS 7N BT Column */}
                              <TableCell align="center" sx={{ backgroundColor: '#fcf8fe', borderRight: '1px solid #e1bee7' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: emp.clps7n_status === 'PASS' ? '#2e7d32' : '#d32f2f' }}>
                                    {emp.clps7n_pct || 0}%
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#5f6368', fontSize: '10px' }}>
                                    {emp.kh_cls_count > 0 ? `(${emp.clps7n_count || 0}/${emp.kh_cls_count} HĐ)` : `(${emp.clps7n_count || 0} HĐ)`}
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

        {/* CLPS 7N BT DETAILS MODAL */}
        <Dialog open={clps7nDetailModalOpen} onClose={() => setClps7nDetailModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#7b1fa2' }}>
              CHI TIẾT DANH SÁCH CLPS 7N BT (SG01)
            </Typography>
            <IconButton onClick={() => setClps7nDetailModalOpen(false)}><CloseIcon /></IconButton>
          </DialogTitle>
          
          <DialogContent dividers sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#202124' }}>
                Tỉ Lệ CLPS 7N BT Toàn Đơn Vị: <span style={{ color: summary?.clps7n_status === 'PASS' ? '#2e7d32' : '#d32f2f' }}>{summary?.clps7n_pct || 0}%</span> (Tiêu chuẩn: &le; 3%)
              </Typography>
              <Chip
                label={summary?.clps7n_status === 'PASS' ? "ĐẠT (<= 3%)" : "KHÔNG ĐẠT (> 3%)"}
                color={summary?.clps7n_status === 'PASS' ? 'success' : 'error'}
                sx={{ fontWeight: 800 }}
              />
            </Box>

            <Typography variant="body2" sx={{ color: '#5f6368', mb: 2 }}>
              Phiếu CLPS 7N BT là ca lặp có TG Hoàn Tất (cột G) đến TG Tạo CLPS (cột AB) &le; 7 ngày. 
              Tổng số phiếu: <strong>{summary?.clps7n_count || 0} HĐ</strong> trên tổng <strong>{summary?.kh_cls_count || 0} HĐ KH Có Cls</strong>.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setClps7nDetailModalOpen(false)} variant="contained" sx={{ backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#4a148c' }, borderRadius: '18px', textTransform: 'none', px: 3 }}>
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
                <Tab label={`CLPS 7N BT (${empDetails?.clps7n_tickets?.length || empDetails?.cll_tickets?.filter(t => t.is_clps_7n_bt)?.length || 0})`} />
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
                          <TableCell align="center">
                            {(() => {
                              const rtNum = t.rt_hours ?? (t.rt_fmt ? parseFloat(String(t.rt_fmt).replace('H', '')) : 0);
                              const isOver72 = rtNum > 72.0;
                              return (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 800,
                                    color: isOver72 ? '#ffffff' : (rtNum > 18.0 ? '#d32f2f' : '#1a73e8'),
                                    backgroundColor: isOver72 ? '#d32f2f' : 'transparent',
                                    px: isOver72 ? 1 : 0,
                                    py: isOver72 ? 0.3 : 0,
                                    borderRadius: isOver72 ? '6px' : 0,
                                    display: 'inline-block',
                                    boxShadow: isOver72 ? '0 2px 4px rgba(211,47,47,0.3)' : 'none'
                                  }}
                                >
                                  {t.rt_fmt || '-'}
                                </Typography>
                              );
                            })()}
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
                          <TableCell align="center">
                            {(() => {
                              const rtNum = t.rt_hours ?? (t.rt_fmt ? parseFloat(String(t.rt_fmt).replace('H', '')) : 0);
                              const isOver24 = rtNum > 24.0;
                              return (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 800,
                                    color: isOver24 ? '#ffffff' : (rtNum > 8.0 ? '#d32f2f' : '#00897b'),
                                    backgroundColor: isOver24 ? '#d32f2f' : 'transparent',
                                    px: isOver24 ? 1 : 0,
                                    py: isOver24 ? 0.3 : 0,
                                    borderRadius: isOver24 ? '6px' : 0,
                                    display: 'inline-block',
                                    boxShadow: isOver24 ? '0 2px 4px rgba(211,47,47,0.3)' : 'none'
                                  }}
                                >
                                  {t.rt_fmt || '-'}
                                </Typography>
                              );
                            })()}
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
              ) : activeTab === 2 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 40 }}>STT</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>TG Hoàn Tất CLPS</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tình Trạng Đầu Vào</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Hướng Xử Lý</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {empDetails?.cll_tickets?.map((t, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {t.contract_no}
                            {t.is_clps_7n_bt && <Chip label="CLPS 7N BT" size="small" sx={{ ml: 1, height: 18, fontSize: '10px', backgroundColor: '#f3e5f5', color: '#7b1fa2', fontWeight: 700 }} />}
                          </TableCell>
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
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 40 }}>STT</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>TG Hoàn Tất CLPS</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tình Trạng Đầu Vào</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Hướng Xử Lý</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(empDetails?.clps7n_tickets || empDetails?.cll_tickets?.filter(t => t.is_clps_7n_bt))?.map((t, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {t.contract_no}
                            <Chip label="CLPS 7N BT" size="small" sx={{ ml: 1, height: 18, fontSize: '10px', backgroundColor: '#f3e5f5', color: '#7b1fa2', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>{t.customer_name || '-'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.dt_complete || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{t.tinh_trang_dau_vao || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#7b1fa2', fontWeight: 500 }}>{t.huong_xu_ly || '-'}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!empDetails?.clps7n_tickets?.length && !empDetails?.cll_tickets?.some(t => t.is_clps_7n_bt)) && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#5f6368' }}>
                            Không có phiếu CLPS 7N BT trong khoảng thời gian này
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
                  onChange={(e) => setRegMail(e.target.value)}
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
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAuthModalOpen(false)} color="inherit">Đóng</Button>
          </DialogActions>
        </Dialog>

        <UserEditModal open={userModalOpen} onClose={() => setUserModalOpen(false)} initialData={userForm} isEditMode={Boolean(editingUser)} onSave={handleSaveUser} />

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

        <UnifiedHrProfileModal open={unifiedHrModalOpen} onClose={() => setUnifiedHrModalOpen(false)} initialData={unifiedHrProfile} isNew={isNewHrProfile} loading={hrDetailLoading} options={options} hrList={hrList} onSave={handleSaveUnifiedHr} />


        {/* GOOGLE APPS SCRIPT GUIDE & CODE MODAL */}
        <Dialog open={appsScriptGuideOpen} onClose={() => setAppsScriptGuideOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#1d4ed8', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            📜 Hướng Dẫn Tải & Tạo Google Apps Script Web App Đồng Bộ Sheet
            <IconButton onClick={() => setAppsScriptGuideOpen(false)} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Đường dẫn export CSV của Google Sheet chỉ cho phép đọc. Để ghi toàn bộ danh sách tài khoản (MSNV, Họ Tên, Email, Mật Khẩu, Quyền, Trang Thái) tự động lên Google Sheet <b>10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY</b> (GID 0), hãy làm theo các bước bên dưới:
                </Typography>
              </Alert>

              <Alert severity="warning" sx={{ borderRadius: 2, backgroundColor: '#fff7ed', border: '1px solid #ffedd5' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#c2410c' }}>
                  ⚠️ KHẮC PHỤC LỖI HTTP 403 (FORBIDDEN):
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '13px', color: '#9a3412', mt: 0.5, lineHeight: 1.6 }}>
                  Nếu bấm đồng bộ báo <b>Lỗi HTTP 403</b>, nguyên nhân duy nhất là khi cài đặt Apps Script mục <b>Who has access (Ai có quyền truy cập)</b> chưa chọn <b>"Bất kỳ ai" (Anyone)</b>.
                  <br/>
                  👉 <b>Cách sửa nhanh trong 10 giây:</b> Vào lại Apps Script ➔ Bấm góc phải <b>Triển khai (Deploy)</b> ➔ <b>Quản lý các bản triển khai (Manage deployments)</b> ➔ Bấm biểu tượng <b>Cây bút sửa (Edit icon ✏️)</b> ➔ Đổi <i>Who has access</i> thành <b>Anyone (Bất kỳ ai)</b> ➔ Bấm <b>Triển khai (Deploy)</b> là xong ngay!
                </Typography>
              </Alert>

              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                📋 Các bước triển khai trong 30 giây:
              </Typography>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: '13px', lineHeight: '1.8', color: '#334155' }}>
                <li>Mở file Google Sheet: <a href="https://docs.google.com/spreadsheets/d/10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY/edit#gid=0" target="_blank" rel="noreferrer"><b>Mở Google Sheet 10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY</b></a></li>
                <li>Trên thanh menu chọn: <b>Tiện ích mở rộng (Extensions)</b> ➔ <b>Apps Script</b>.</li>
                <li>Xóa toàn bộ mã mặc định và dán đoạn code bên dưới vào. Bấm <b>Lưu (Save icon 💾)</b>.</li>
                <li>Bấm nút góc phải trên <b>Triển khai (Deploy)</b> ➔ <b>Triển khai dưới dạng ứng dụng web (New deployment &rarr; Web App)</b>.</li>
                <li>Cấu hình:
                  <ul>
                    <li>Mô tả: <b>Admin Sync API</b></li>
                    <li>Thực thi dưới dạng (Execute as): <b>Tôi (Me)</b></li>
                    <li>Ai có quyền truy cập (Who has access): <b>Bất kỳ ai (Anyone)</b></li>
                  </ul>
                </li>
                <li>Bấm <b>Triển khai (Deploy)</b> ➔ Cấp quyền truy cập ➔ Copy đường dẫn <b>URL ứng dụng Web (Web App URL)</b> và dán vào ô cấu hình Web App URL!</li>
              </ol>

              <Box sx={{ position: 'relative', mt: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    const code = `function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var users = contents.users || [];
    var headers = ["ID", "MSNV", "Họ và Tên", "Mail", "User", "Mật Khẩu", "Quyền", "Ứng dụng được xem", "Trạng thái"];
    
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    if (users.length > 0) {
      var rows = users.map(function(u, idx) {
        return [
          u["ID"] || (idx + 1),
          u["MSNV"] || "",
          u["Họ và Tên"] || "",
          u["Mail"] || "",
          u["User"] || "",
          u["Mật Khẩu"] || "",
          u["Quyền"] || "user",
          u["Ứng dụng được xem"] || "",
          u["Trạng thái"] || "Active"
        ];
      });
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Đã đồng bộ " + users.length + " tài khoản lên Google Sheet thành công!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Apps Script API đang hoạt động!" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
                    navigator.clipboard.writeText(code);
                    alert("📋 Đã sao chép mã Google Apps Script vào bộ nhớ tạm!");
                  }}
                  sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, fontWeight: 800, borderRadius: 2 }}
                >
                  📋 Copy Code Apps Script
                </Button>
                <Paper sx={{ p: 2, backgroundColor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px', borderRadius: 2.5, overflowX: 'auto', maxHeight: 300 }}>
                  <pre style={{ margin: 0 }}>{`function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var users = contents.users || [];
    var headers = ["ID", "MSNV", "Họ và Tên", "Mail", "User", "Mật Khẩu", "Quyền", "Ứng dụng được xem", "Trạng thái"];
    
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    if (users.length > 0) {
      var rows = users.map(function(u, idx) {
        return [
          u["ID"] || (idx + 1),
          u["MSNV"] || "",
          u["Họ và Tên"] || "",
          u["Mail"] || "",
          u["User"] || "",
          u["Mật Khẩu"] || "",
          u["Quyền"] || "user",
          u["Ứng dụng được xem"] || "",
          u["Trạng thái"] || "Active"
        ];
      });
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Đã đồng bộ " + users.length + " tài khoản lên Google Sheet thành công!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Apps Script API đang hoạt động!" }))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
                </Paper>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAppsScriptGuideOpen(false)} variant="contained">Đóng</Button>
          </DialogActions>
        </Dialog>


        {/* HR DELETE CONFIRM MODAL */}
        <Dialog open={hrDeleteModalOpen} onClose={() => setHrDeleteModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#dc2626' }}>⚠️ XÁC NHẬN XÓA NHÂN SỰ</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2">
              Bạn có chắc chắn muốn xóa nhân sự <b>{hrToDelete?.name}</b> (Mã NV: <b>{hrToDelete?.code}</b>) khỏi danh sách HR?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setHrDeleteModalOpen(false)} variant="outlined">Hủy</Button>
            <Button onClick={handleDeleteHr} variant="contained" color="error">Xóa Nhân Sự</Button>
          </DialogActions>
        </Dialog>

        {/* POSITION BREAKDOWN MODAL (CHỨC DANH CỘT O) */}
        <Dialog open={positionModalOpen} onClose={() => setPositionModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 900, color: '#1e40af', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            👔 THỐNG KÊ CHỨC DANH NHÂN SỰ (CỘT O)
            <IconButton onClick={() => setPositionModalOpen(false)} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc' }}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontWeight: 600 }}>
              Tổng số <b>{hrList.length}</b> nhân sự phân loại theo Chức Danh / Vị Trí (Cột O):
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#eff6ff' }}>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#1e40af', width: 60 }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#1e40af' }}>Tên Chức Danh / Vị Trí (Cột O)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#1e40af' }}>Số Lượng</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#1e40af' }}>Tỷ Lệ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const counts = {};
                    hrList.forEach(r => {
                      const title = (r.title || 'Chưa phân loại').trim();
                      if (title) counts[title] = (counts[title] || 0) + 1;
                    });
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                    const total = hrList.length || 1;
                    
                    return sorted.map(([pos, cnt], idx) => {
                      const pct = ((cnt / total) * 100).toFixed(1);
                      return (
                        <TableRow key={pos} hover>
                          <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{pos}</TableCell>
                          <TableCell align="right">
                            <Chip label={cnt} size="small" sx={{ fontWeight: 900, backgroundColor: '#dbeafe', color: '#1e40af', height: 22 }} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#2563eb' }}>
                            {pct}%
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPositionModalOpen(false)} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700 }}>
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

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
        <Dialog
          fullScreen
          open={previewLoadingModalOpen}
          onClose={() => setPreviewLoadingModalOpen(false)}
        >
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <SOPLoadingScreen
              slides={adminLoadingSlides}
              loadingProgress={78}
              currentStatusText="[Chế độ Xem Thử] Đang mô phỏng giao diện màn hình chờ SOP của FPT SG01..."
              onSkip={() => setPreviewLoadingModalOpen(false)}
            />
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => setPreviewLoadingModalOpen(false)}
              sx={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 10000,
                fontWeight: 800,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              ✕ Đóng Xem Thử
            </Button>
          </Box>
        </Dialog>

      </Box>
    </ThemeProvider>
  );
}
