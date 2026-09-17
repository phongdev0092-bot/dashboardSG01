import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  LinearProgress,
  Fade,
  Button
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SentimentSatisfiedAltOutlinedIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import CircularProgress from '@mui/material/CircularProgress';

import { DEFAULT_SOP_SLIDES } from '../config/sopSlides';

const LOGO_URL = "https://management.mypt.vn/images/FPT_Telecom_logo.svg";

const ICONS_MAP = {
  EngineeringOutlined: EngineeringOutlinedIcon,
  SpeedOutlined: SpeedOutlinedIcon,
  ShieldOutlined: ShieldOutlinedIcon,
  SentimentSatisfiedAltOutlined: SentimentSatisfiedAltOutlinedIcon,
  TipsAndUpdatesOutlined: TipsAndUpdatesOutlinedIcon
};

export default function SOPLoadingScreen({
  slides = DEFAULT_SOP_SLIDES,
  loadingProgress = 65,
  currentStatusText = "Đang tổng hợp dữ liệu KPI & Đồng bộ Supabase...",
  onSkip
}) {
  const activeSlides = (slides && slides.length > 0 ? slides : DEFAULT_SOP_SLIDES).filter(
    (s) => s.is_active !== false
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);

  const SLIDE_DURATION_MS = 5000;
  const UPDATE_INTERVAL_MS = 50;

  // Auto slide timer & progress bar
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;

    const interval = setInterval(() => {
      setSlideProgress((prev) => {
        const next = prev + (UPDATE_INTERVAL_MS / SLIDE_DURATION_MS) * 100;
        if (next >= 100) {
          setCurrentIndex((cur) => (cur + 1) % activeSlides.length);
          return 0;
        }
        return next;
      });
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPaused, activeSlides.length, currentIndex]);

  const handlePrev = () => {
    setSlideProgress(0);
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSlideProgress(0);
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const handleSelectSlide = (idx) => {
    setSlideProgress(0);
    setCurrentIndex(idx);
  };

  const currentSlide = activeSlides[currentIndex] || activeSlides[0] || DEFAULT_SOP_SLIDES[0];
  const IconComponent = ICONS_MAP[currentSlide.icon] || TipsAndUpdatesOutlinedIcon;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 60%, #020617 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: { xs: 2, sm: 3, md: 4 },
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}
    >
      {/* Background Ambient Glows */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          left: '20%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(37, 99, 235, 0.15)',
          filter: 'blur(100px)',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          right: '20%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(124, 58, 237, 0.15)',
          filter: 'blur(100px)',
          pointerEvents: 'none'
        }}
      />

      {/* TOP BAR: Logo & Title */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 960,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 1.5,
          zIndex: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src={LOGO_URL}
            alt="FPT Telecom"
            sx={{ height: { xs: 32, sm: 40 }, filter: 'brightness(0) invert(1)' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '15px', sm: '18px' },
                letterSpacing: 0.5,
                background: 'linear-gradient(90deg, #ffffff 0%, #93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Dashboard KPIs Hiệu Suất Kỹ Thuật • Chi Nhánh SG01
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px' }}>
              Quy Trình Chuẩn Kỹ Thuật & Cẩm Nang Nghiệp Vụ
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            icon={<CircularProgress size={12} sx={{ color: '#38bdf8' }} />}
            label={`Đang khởi tạo (${Math.round(loadingProgress)}%)`}
            sx={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: '11px',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}
          />
        </Box>
      </Box>

      {/* CENTER: SOP CAROUSEL CARD */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 960,
          my: 'auto',
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Main Showcase Glass Card */}
        <Fade in={true} key={currentIndex} timeout={400}>
          <Box
            sx={{
              width: '100%',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              p: { xs: 2.5, sm: 3.5, md: 4 },
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Slide Progress Bar */}
            <LinearProgress
              variant="determinate"
              value={isPaused ? 100 : slideProgress}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3.5,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: currentSlide.badgeColor || '#38bdf8',
                  transition: 'none'
                }
              }}
            />

            {/* Header: Tag, Badge, Targets */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label={currentSlide.tag}
                  size="small"
                  sx={{
                    backgroundColor: currentSlide.badgeColor || '#3b82f6',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: 0.5,
                    px: 0.5
                  }}
                />
                {currentSlide.category && (
                  <Chip
                    label={currentSlide.category}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                      color: '#cbd5e1',
                      fontWeight: 600,
                      fontSize: '11px'
                    }}
                  />
                )}
              </Box>

              {currentSlide.target && (
                <Chip
                  label={currentSlide.target}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ade80',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}
                />
              )}
            </Box>

            {/* Title & Icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3,
                  background: currentSlide.colorGradient || 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                  flexShrink: 0
                }}
              >
                <IconComponent sx={{ fontSize: 30, color: '#ffffff' }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '18px', sm: '22px' },
                    color: '#ffffff',
                    lineHeight: 1.3
                  }}
                >
                  {currentSlide.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '12px' }}>
                  Cẩm nang hướng dẫn chuẩn tác nghiệp Kỹ thuật viên FPT SG01
                </Typography>
              </Box>
            </Box>

            {/* Steps List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
              {(currentSlide.steps || []).map((step, sIdx) => (
                <Box
                  key={sIdx}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    }
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 18,
                      color: currentSlide.badgeColor || '#38bdf8',
                      mt: 0.2,
                      flexShrink: 0
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: { xs: '13px', sm: '14px' },
                      color: '#e2e8f0',
                      lineHeight: 1.5,
                      fontWeight: 500
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Tip Box */}
            {currentSlide.note && (
              <Box
                sx={{
                  p: 1.75,
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 2,
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '12.5px', sm: '13.5px' },
                    color: '#fde68a',
                    fontWeight: 600,
                    lineHeight: 1.4
                  }}
                >
                  {currentSlide.note}
                </Typography>
              </Box>
            )}

            {/* Image Banner if present */}
            {currentSlide.image_url && (
              <Box
                component="img"
                src={currentSlide.image_url}
                alt="Banner quy trình"
                sx={{
                  width: '100%',
                  maxHeight: 220,
                  objectFit: 'cover',
                  borderRadius: 2,
                  mt: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            )}
          </Box>
        </Fade>

        {/* Carousel Controls */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            mt: 2,
            px: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handlePrev}
              size="small"
              sx={{
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            <IconButton
              onClick={() => setIsPaused(!isPaused)}
              size="small"
              sx={{
                color: isPaused ? '#f59e0b' : '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
              }}
              title={isPaused ? "Bấm để tiếp tục tự động chuyển slide" : "Tạm dừng chuyển slide"}
            >
              {isPaused ? <PlayArrowIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
            </IconButton>

            <IconButton
              onClick={handleNext}
              size="small"
              sx={{
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>

            <Typography variant="caption" sx={{ color: '#94a3b8', ml: 1, fontSize: '12px' }}>
              Quy trình {currentIndex + 1} / {activeSlides.length}
            </Typography>
          </Box>

          {/* Dots Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activeSlides.map((s, idx) => (
              <Box
                key={s.id || idx}
                onClick={() => handleSelectSlide(idx)}
                sx={{
                  width: idx === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    idx === currentIndex
                      ? currentSlide.badgeColor || '#38bdf8'
                      : 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* BOTTOM SECTION: Real-time System Loading Stepper */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 960,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          zIndex: 1
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={16} sx={{ color: '#38bdf8' }} />
            <Typography sx={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>
              {currentStatusText}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
            {Math.round(loadingProgress)}%
          </Typography>
        </Box>

        {/* Global Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={loadingProgress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #10b981 100%)',
              borderRadius: 3
            }
          }}
        />

        {/* 4 Step Milestones */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
            gap: 1,
            pt: 0.5
          }}
        >
          {[
            { label: "1. Kết nối Supabase DB", done: loadingProgress >= 25 },
            { label: "2. Danh mục & Phân quyền", done: loadingProgress >= 50 },
            { label: "3. Tổng hợp TK & BT", done: loadingProgress >= 75 },
            { label: "4. Tính toán CLL30N & Đúng hẹn", done: loadingProgress >= 90 }
          ].map((step, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                fontSize: '11px',
                color: step.done ? '#4ade80' : '#64748b',
                fontWeight: step.done ? 700 : 500
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 13, color: step.done ? '#4ade80' : '#475569' }} />
              <span>{step.label}</span>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
