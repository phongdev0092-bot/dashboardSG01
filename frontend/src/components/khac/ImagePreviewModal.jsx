import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  RestartAlt as RestartAltIcon,
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  BrokenImage as BrokenImageIcon
} from '@mui/icons-material';

export default function ImagePreviewModal({
  open,
  onClose,
  contract
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const images = contract?.images || [];
  const currentImg = images[currentIndex] || null;

  useEffect(() => {
    setCurrentIndex(0);
    setScale(1);
    setRotation(0);
    setLoading(true);
    setImgError(false);
  }, [contract, open]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handlePrev = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setScale(1);
    setRotation(0);
    setLoading(true);
    setImgError(false);
  };

  const handleNext = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setScale(1);
    setRotation(0);
    setLoading(true);
    setImgError(false);
  };

  if (!contract) return null;

  const imgSrc = currentImg ? (currentImg.view_url || currentImg.original) : '';
  const openUrl = currentImg ? (currentImg.open_url || currentImg.original) : '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: '#121212',
          color: '#ffffff',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)'
        }
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          p: 2,
          px: 3,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label={contract.so_hd || 'Hợp Đồng'}
            color="primary"
            size="small"
            sx={{ fontWeight: 800, fontSize: '13px', px: 0.5 }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f3f4' }}>
            {contract.name || contract.inside_account || 'Chi tiết hình ảnh'}
          </Typography>
          {contract.team_lead && (
            <Chip
              label={`Đội: ${contract.team_lead}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#e0e0e0',
                fontSize: '11px',
                fontWeight: 600
              }}
            />
          )}
          {images.length > 1 && (
            <Chip
              label={`Ảnh ${currentIndex + 1} / ${images.length}`}
              size="small"
              color="info"
              sx={{ fontSize: '11px', fontWeight: 700 }}
            />
          )}
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* CONTENT / IMAGE VIEWER */}
      <DialogContent
        sx={{
          p: 0,
          position: 'relative',
          minHeight: 460,
          maxHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          overflow: 'hidden',
          userSelect: 'none'
        }}
      >
        {/* Loading Spinner */}
        {loading && !imgError && (
          <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <CircularProgress color="primary" size={40} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Đang tải hình ảnh...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {imgError ? (
          <Box sx={{ textAlign: 'center', p: 4, color: 'rgba(255,255,255,0.6)' }}>
            <BrokenImageIcon sx={{ fontSize: 64, mb: 1, color: '#f44336' }} />
            <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
              Không thể hiển thị ảnh trực tiếp
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, mb: 2 }}>
              Link có thể yêu cầu quyền truy cập Google Drive hoặc ảnh bị giới hạn.
            </Typography>
            {openUrl && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<OpenInNewIcon />}
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Mở link gốc trong tab mới
              </Button>
            )}
          </Box>
        ) : (
          imgSrc && (
            <Box
              component="img"
              src={imgSrc}
              alt={`Gia cố ${contract.so_hd}`}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onLoad={() => setLoading(false)}
              onError={(e) => {
                // If view_url (proxy) fails, fallback to direct_url or original
                if (currentImg?.direct_url && imgSrc !== currentImg.direct_url) {
                  e.target.src = currentImg.direct_url;
                } else if (currentImg?.original && imgSrc !== currentImg.original) {
                  e.target.src = currentImg.original;
                } else {
                  setLoading(false);
                  setImgError(true);
                }
              }}
              sx={{
                maxWidth: '100%',
                maxHeight: '72vh',
                objectFit: 'contain',
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: scale > 1 ? 'grab' : 'default',
                display: loading ? 'none' : 'block'
              }}
            />
          )
        )}

        {/* Previous / Next Arrow Controls */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 16,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#ffffff',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
              }}
            >
              <PrevIcon fontSize="large" />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 16,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#ffffff',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
              }}
            >
              <NextIcon fontSize="large" />
            </IconButton>
          </>
        )}
      </DialogContent>

      {/* FOOTER ACTIONS & CONTROLS */}
      <DialogActions
        sx={{
          p: 1.5,
          px: 3,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        {/* Zoom & Rotate Toolbars */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Phóng to">
            <span>
              <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#fff' }}>
                <ZoomInIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Thu nhỏ">
            <span>
              <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#fff' }}>
                <ZoomOutIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Xoay 90°">
            <span>
              <IconButton size="small" onClick={handleRotate} sx={{ color: '#fff' }}>
                <RotateRightIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Đặt lại (Reset)">
            <span>
              <IconButton size="small" onClick={handleReset} sx={{ color: '#fff' }}>
                <RestartAltIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', ml: 1 }}>
            {Math.round(scale * 100)}%
          </Typography>
        </Box>

        {/* Link / Open / Close */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {openUrl && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<OpenInNewIcon />}
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff' }}
            >
              Mở link gốc
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            onClick={onClose}
            sx={{ backgroundColor: '#1a73e8', '&:hover': { backgroundColor: '#1557b0' } }}
          >
            Đóng
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
