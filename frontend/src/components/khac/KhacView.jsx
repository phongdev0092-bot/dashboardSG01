import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Build as BuildIcon,
  Router as RouterIcon,
  CreditCard as CreditCardIcon,
  Whatshot as WhatshotIcon,
  Apartment as ApartmentIcon,
  Construction as ConstructionIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import GiaCoModemDashboard from './GiaCoModemDashboard';
import PhanTichMocGioView from './PhanTichMocGioView';

export default function KhacView() {
  const [activeCard, setActiveCard] = useState('phan_tich_moc_gio');
  const [devModalInfo, setDevModalInfo] = useState(null);

  const CARDS = [
    {
      id: 'phan_tich_moc_gio',
      title: 'Phân Tích Mốc Giờ',
      subtitle: 'Phân tích tồn HĐ theo 8 mốc hẹn: Triển khai & Bảo trì (Mốc Xanh - Mốc Đỏ)',
      icon: <AccessTimeIcon sx={{ fontSize: 28 }} />,
      color: '#0d47a1',
      bgLight: '#e3f2fd',
      status: 'Sẵn sàng',
      isReady: true
    },
    {
      id: 'gia_co_modem',
      title: 'Gia Cố Modem',
      subtitle: 'Dashboard tiến độ & hình ảnh gia cố HĐ modem',
      icon: <RouterIcon sx={{ fontSize: 28 }} />,
      color: '#1a73e8',
      bgLight: '#e8f0fe',
      status: 'Sẵn sàng',
      isReady: true
    },
    {
      id: 'prepaid',
      title: 'PrePaird',
      subtitle: 'Theo dõi & quản lý các gói hợp đồng PrePaird',
      icon: <CreditCardIcon sx={{ fontSize: 28 }} />,
      color: '#00897b',
      bgLight: '#e0f2f1',
      status: 'Đang phát triển',
      isReady: false
    },
    {
      id: 'dau_tu_hot',
      title: 'Đầu Tư HOT',
      subtitle: 'Dự án đầu tư phát triển hạ tầng trọng điểm',
      icon: <WhatshotIcon sx={{ fontSize: 28 }} />,
      color: '#f26522',
      bgLight: '#fff3e0',
      status: 'Đang phát triển',
      isReady: false
    },
    {
      id: 'khu_dan_cu',
      title: 'Khu Dân Cư',
      subtitle: 'Quản lý dữ liệu & hạ tầng kỹ thuật các KDC',
      icon: <ApartmentIcon sx={{ fontSize: 28 }} />,
      color: '#7c4dff',
      bgLight: '#ede7f6',
      status: 'Đang phát triển',
      isReady: false
    }
  ];

  const handleCardClick = (card) => {
    if (card.isReady) {
      setActiveCard(card.id);
    } else {
      setDevModalInfo(card);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ========================================================================= */}
      {/* 1. TOP CARDS SELECTION GRID */}
      {/* ========================================================================= */}
      <Box>
        <Typography variant="overline" sx={{ fontWeight: 800, color: '#5f6368', letterSpacing: '0.8px', mb: 1, display: 'block' }}>
          DANH MỤC TIỆN ÍCH & MỞ RỘNG
        </Typography>

        <Grid container spacing={2}>
          {CARDS.map((card) => {
            const isSelected = activeCard === card.id;

            return (
              <Grid key={card.id} size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: isSelected ? card.color : '#e8eaed',
                    backgroundColor: isSelected ? '#ffffff' : '#ffffff',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isSelected ? `0 8px 24px ${card.color}25` : '0 1px 3px rgba(0,0,0,0.05)',
                    transform: isSelected ? 'translateY(-3px)' : 'none',
                    '&:hover': {
                      borderColor: card.color,
                      transform: 'translateY(-4px)',
                      boxShadow: `0 10px 24px ${card.color}20`
                    }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleCardClick(card)}
                    sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Avatar
                          sx={{
                            backgroundColor: card.bgLight,
                            color: card.color,
                            width: 44,
                            height: 44,
                            borderRadius: 2
                          }}
                        >
                          {card.icon}
                        </Avatar>

                        <Chip
                          label={card.status}
                          size="small"
                          sx={{
                            fontSize: '10px',
                            fontWeight: 800,
                            height: 22,
                            backgroundColor: card.isReady ? '#e6f4ea' : '#f1f3f4',
                            color: card.isReady ? '#137333' : '#70757a',
                            borderRadius: '6px'
                          }}
                        />
                      </Box>

                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          color: isSelected ? card.color : '#202124',
                          lineHeight: 1.3,
                          mb: 0.5
                        }}
                      >
                        {card.title}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: '#5f6368',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4
                        }}
                      >
                        {card.subtitle}
                      </Typography>
                    </Box>

                    {isSelected && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5, color: card.color }}>
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>
                          Đang chọn xem
                        </Typography>
                      </Box>
                    )}
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* ========================================================================= */}
      {/* 2. ACTIVE VIEW CONTENT */}
      {/* ========================================================================= */}
      {activeCard === 'phan_tich_moc_gio' && (
        <PhanTichMocGioView />
      )}

      {activeCard === 'gia_co_modem' && (
        <GiaCoModemDashboard />
      )}

      {/* ========================================================================= */}
      {/* 3. DIALOG: TÍNH NĂNG ĐANG PHÁT TRIỂN */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(devModalInfo)}
        onClose={() => setDevModalInfo(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 1,
            textAlign: 'center'
          }
        }}
      >
        <DialogTitle sx={{ pt: 3, pb: 1 }}>
          <Avatar
            sx={{
              backgroundColor: '#fff3e0',
              color: '#f57c00',
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 1.5
            }}
          >
            <ConstructionIcon sx={{ fontSize: 36 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124' }}>
            Đang phát triển
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Typography variant="body1" sx={{ color: '#3c4043', fontWeight: 600, mb: 1 }}>
            Mục "{devModalInfo?.title}" đang được hoàn thiện!
          </Typography>
          <Typography variant="body2" sx={{ color: '#5f6368', lineHeight: 1.6 }}>
            Tính năng và nguồn dữ liệu cho danh mục này đang trong quá trình phát triển và sẽ sớm được cập nhật trên Dashboard SG01.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 2.5, px: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setDevModalInfo(null)}
            sx={{
              backgroundColor: '#1a73e8',
              borderRadius: 2,
              fontWeight: 700,
              py: 1,
              '&:hover': { backgroundColor: '#1557b0' }
            }}
          >
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
