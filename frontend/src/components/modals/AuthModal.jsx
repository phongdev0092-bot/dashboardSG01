import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export const AuthModal = ({
  open,
  onClose,
  authTab,
  setAuthTab,
  authError,
  setAuthError,
  handleLogin,
  loginId,
  setLoginId,
  loginPassword,
  setLoginPassword,
  authLoading,
  handleRegister,
  regMail,
  setRegMail,
  hrCheckResult,
  regUser,
  setRegUser,
  regPassword,
  setRegPassword,
  regConfirmPassword,
  setRegConfirmPassword
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
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
        <Button onClick={onClose} color="inherit">Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthModal;
