import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export default function TopHeader({
  currentNav,
  isMobile,
  setMobileOpen,
  handleExportExcel,
  tonTkBtData,
  tonSyncing,
  handleSyncTonTkBt,
}) {
  return (
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
        justifyContent: 'space-between',
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
            {currentNav === 'lich_truc' && '📅 Dashboard Lịch Trực Kỹ Thuật - Chi Nhánh SG01'}
            {currentNav === 'ton_tk_bt' && '⏳ Quản Lý Tồn Triển Khai & Bảo Trì - Chi Nhánh SG01'}
            {currentNav === 'admin' && '⚙️ Trang Quản Trị Hệ Thống - Chi Nhánh SG01'}
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
          sx={{ borderRadius: '18px', textTransform: 'none', px: 2, fontWeight: 700, backgroundColor: '#0f9d58' }}
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
              sx={{ fontWeight: 600, fontSize: '11px', display: { xs: 'none', sm: 'inline-flex' }, borderColor: '#dadce0' }}
            />
          )}
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={tonSyncing ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: 16 }} />}
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
  );
}
