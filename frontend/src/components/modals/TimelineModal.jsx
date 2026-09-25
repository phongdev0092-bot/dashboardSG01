import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button
} from '@mui/material';

export const TimelineModal = ({ open, onClose, selectedStaffTimeline, ltHistData }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
        <Button onClick={onClose} variant="contained">Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimelineModal;
