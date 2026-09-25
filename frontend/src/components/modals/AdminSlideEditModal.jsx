import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Grid,
  MenuItem,
  FormLabel,
  FormControlLabel,
  Switch
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

// Isolated Admin Slide Edit / Add Modal (Local State Buffering)
export const AdminSlideEditModal = React.memo(({
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

export default AdminSlideEditModal;
