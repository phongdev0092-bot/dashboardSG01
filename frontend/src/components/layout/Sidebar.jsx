import React from 'react';
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
  Drawer,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  CalendarMonth as CalendarMonthIcon,
  PendingActions as PendingActionsIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export default function Sidebar({
  currentNav,
  setCurrentNav,
  currentUser,
  setAuthError,
  setAuthModalOpen,
  mobileOpen,
  setMobileOpen,
  isMobile,
  totalBacklogSummary,
  syncing,
  handleTriggerSync,
  options,
  reportData,
  logoUrl = 'https://management.mypt.vn/images/FPT_Telecom_logo.svg',
}) {
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
      badge: totalBacklogSummary && totalBacklogSummary.total > 0 ? totalBacklogSummary.total : null
    },
    {
      id: 'admin',
      label: 'Quản Trị',
      sublabel: 'Trang Quản Trị Hệ Thống (Admin)',
      icon: <AdminPanelSettingsIcon />
    }
  ];

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
            src={logoUrl}
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
            🔄 Cập nhật: <strong>{(options && options.last_sync_time) || 'Hôm nay'}</strong>
          </Typography>
          {reportData?.metadata?.execution_time_ms && (
            <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 600, display: 'block', mt: 0.5 }}>
              ⚡ Độ trễ API: {reportData.metadata.execution_time_ms} ms
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
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
    </>
  );
}
