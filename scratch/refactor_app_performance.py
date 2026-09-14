import re

file_path = r'd:\Tool KPI\frontend\src\App.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Define subcomponents code block
subcomponents = '''
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
        {isEditMode ? '✏️ SỬA TÀI KHOẢN NGƯỜI DÙNG & PHÂN QUYỀN' : '➕ THÊM USER MỚI (SHEET ADMIN)'}
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
            🔒 Phân Quyền Ứng Dụng Được Xem (RBAC Column Sheet Quyền):
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
'''

# Insert subcomponents right before getInitialDates or App component
target_marker = '// Helper for default date calculation'
if target_marker in content:
    content = content.replace(target_marker, subcomponents + '\n' + target_marker)
else:
    print('Target marker not found!')

# Update handleSaveUnifiedHr to accept formData parameter
old_handle_hr_save = '''const handleSaveUnifiedHr = async () => {
    const code = unifiedHrProfile['Mã NV'] || unifiedHrProfile['Inside Account'] || '';
    const name = unifiedHrProfile['Họ Tên NV'] || '';'''

new_handle_hr_save = '''const handleSaveUnifiedHr = async (formDataParam) => {
    const profile = formDataParam || unifiedHrProfile;
    const code = profile['Mã NV'] || profile['Inside Account'] || '';
    const name = profile['Họ Tên NV'] || '';'''

content = content.replace(old_handle_hr_save, new_handle_hr_save)
content = content.replace("res = await axios.post('/api/admin/hr/add', unifiedHrProfile);", "res = await axios.post('/api/admin/hr/add', profile);")
content = content.replace("res = await axios.post('/api/admin/hr/update', { code, ...unifiedHrProfile });", "res = await axios.post('/api/admin/hr/update', { code, ...profile });")

# Update handleSaveUser to accept formData parameter
old_handle_user_save = '''const handleSaveUser = async () => {
    if (!userForm.mail || (!editingUser && !userForm.password)) {'''

new_handle_user_save = '''const handleSaveUser = async (formDataParam) => {
    const form = formDataParam || userForm;
    if (!form.mail || (!editingUser && !form.password)) {'''

content = content.replace(old_handle_user_save, new_handle_user_save)
content = content.replace("user_id: editingUser.id,\n          msnv: userForm.msnv,\n          name: userForm.name,\n          mail: userForm.mail,\n          user: userForm.user,\n          password: userForm.password,\n          role: userForm.role,\n          allowed_apps: userForm.allowed_apps",
                          "user_id: editingUser.id,\n          msnv: form.msnv,\n          name: form.name,\n          mail: form.mail,\n          user: form.user,\n          password: form.password,\n          role: form.role,\n          status: form.status || 'Active',\n          allowed_apps: Array.isArray(form.allowed_apps) ? form.allowed_apps.join(', ') : form.allowed_apps")
content = content.replace("res = await axios.post('/api/admin/users/add', userForm);",
                          "res = await axios.post('/api/admin/users/add', {\n          ...form,\n          allowed_apps: Array.isArray(form.allowed_apps) ? form.allowed_apps.join(', ') : form.allowed_apps\n        });")

# Update handleAddRowSubmit to accept formData parameter
old_handle_add_row = '''const handleAddRowSubmit = async () => {
    if (!addRowData.mail) {'''

new_handle_add_row = '''const handleAddRowSubmit = async (formDataParam) => {
    const form = formDataParam || addRowData;
    if (!form.mail) {'''

content = content.replace(old_handle_add_row, new_handle_add_row)
content = content.replace("month: addRowData.month,\n        year: addRowData.year,\n        row_data: {\n          code: addRowData.code,\n          name: addRowData.name,\n          partner: addRowData.partner,\n          block: addRowData.block,\n          mail: addRowData.mail\n        }",
                          "month: form.month,\n        year: form.year,\n        row_data: {\n          code: form.code,\n          name: form.name,\n          partner: form.partner,\n          block: form.block,\n          mail: form.mail\n        }")

# Replace inline Dialogs with subcomponents
# 1. AddRowModal
add_row_dialog_pattern = re.compile(r'\{\/\* ADD ROW DIALOG MODAL \*\/\}\s*\{isEditable && \(\s*<Dialog open=\{addRowOpen\}.*?<\/Dialog>\s*\)\}', re.DOTALL)
content = add_row_dialog_pattern.sub('{isEditable && (<AddLichTrucRowModal open={addRowOpen} onClose={() => setAddRowOpen(false)} onSubmit={handleAddRowSubmit} />)}', content)

# 2. UserEditModal
user_modal_pattern = re.compile(r'\{\/\* EDIT \/ ADD USER DIALOG MODAL WITH RBAC CHECKBOXES & STATUS DROPDOWN \*\/\}\s*<Dialog open=\{userModalOpen\}.*?<\/Dialog>', re.DOTALL)
content = user_modal_pattern.sub('<UserEditModal open={userModalOpen} onClose={() => setUserModalOpen(false)} initialData={userForm} isEditMode={Boolean(editingUser)} onSave={handleSaveUser} />', content)

# 3. UnifiedHrProfileModal
unified_hr_modal_pattern = re.compile(r'\{\/\* UNIFIED HR PROFILE DIALOG MODAL \(VIEW & EDIT COMBINED IN 1 MODAL\) \*\/\}\s*<Dialog open=\{unifiedHrModalOpen\}.*?<\/Dialog>', re.DOTALL)
content = unified_hr_modal_pattern.sub('<UnifiedHrProfileModal open={unifiedHrModalOpen} onClose={() => setUnifiedHrModalOpen(false)} initialData={unifiedHrProfile} isNew={isNewHrProfile} loading={hrDetailLoading} options={options} hrList={hrList} onSave={handleSaveUnifiedHr} />', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactoring complete.")
