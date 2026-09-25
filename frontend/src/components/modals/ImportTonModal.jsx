import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  FormLabel,
  TextField,
  MenuItem,
  LinearProgress,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileUploadIcon from '@mui/icons-material/FileUpload';

export const ImportTonModal = ({
  open,
  onClose,
  importingTon,
  importTonMode,
  setImportTonMode,
  importTonResult,
  tonImportInputRef,
  handleImportTonFileSelect
}) => {
  return (
    <Dialog open={open} onClose={() => !importingTon && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#1a73e8', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📥 IMPORT DỮ LIỆU TỒN TRIỂN KHAI & BẢO TRÌ</span>
        <IconButton size="small" onClick={onClose} disabled={importingTon}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#5f6368' }}>
            Tải file CSV hoặc Excel (.xlsx, .xls) chứa danh sách phiếu Tồn mới nhất để tính toán lại toàn bộ Dashboard. Dữ liệu cũ sẽ được ghi đè bằng file mới.
          </Typography>

          <Box>
            <FormLabel sx={{ fontSize: '13px', fontWeight: 700, color: '#202124', display: 'block', mb: 1 }}>
              Phân Loại Dataset File Import:
            </FormLabel>
            <TextField
              select
              fullWidth
              size="small"
              value={importTonMode}
              onChange={(e) => setImportTonMode(e.target.value)}
              disabled={importingTon}
            >
              <MenuItem value="AUTO">✨ Tự động nhận diện (Triển khai / Bảo trì)</MenuItem>
              <MenuItem value="TK">📂 File Tồn Triển Khai (TK)</MenuItem>
              <MenuItem value="BT">🛠️ File Tồn Bảo Trì (BT)</MenuItem>
            </TextField>
          </Box>

          {importingTon && (
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a73e8', mb: 1 }}>
                ⏳ Đang tải file, ghi đè dữ liệu cache & tính toán lại chỉ số...
              </Typography>
              <LinearProgress sx={{ borderRadius: 1, height: 8 }} />
            </Box>
          )}

          {importTonResult && (
            <Alert severity={importTonResult.ok ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
              {importTonResult.msg}
            </Alert>
          )}

          <input
            type="file"
            ref={tonImportInputRef}
            style={{ display: 'none' }}
            accept=".csv, .xlsx, .xls"
            onChange={handleImportTonFileSelect}
          />

          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<FileUploadIcon />}
            onClick={() => tonImportInputRef?.current?.click()}
            disabled={importingTon}
            sx={{ borderRadius: 2, height: 48, fontWeight: 800, fontSize: '15px' }}
          >
            {importingTon ? 'Đang Xử Lý File...' : 'Chọn File CSV / Excel Để Import'}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={importingTon} variant="outlined">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportTonModal;
