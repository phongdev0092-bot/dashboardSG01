import React from 'react';
import { Dialog, Box, Button } from '@mui/material';
import SOPLoadingScreen from '../SOPLoadingScreen';

export const PreviewLoadingModal = ({ open, onClose, adminLoadingSlides }) => {
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
    >
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <SOPLoadingScreen
          slides={adminLoadingSlides}
          loadingProgress={78}
          currentStatusText="[Chế độ Xem Thử] Đang mô phỏng giao diện màn hình chờ SOP của FPT SG01..."
          onSkip={onClose}
        />
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={onClose}
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
  );
};

export default PreviewLoadingModal;
