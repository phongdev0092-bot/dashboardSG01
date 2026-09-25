import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const AppsScriptGuideModal = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#1d4ed8', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        📜 Hướng Dẫn Tải & Tạo Google Apps Script Web App Đồng Bộ Sheet
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Đường dẫn export CSV của Google Sheet chỉ cho phép đọc. Để ghi toàn bộ danh sách tài khoản (MSNV, Họ Tên, Email, Mật Khẩu, Quyền, Trang Thái) tự động lên Google Sheet <b>10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY</b> (GID 0), hãy làm theo các bước bên dưới:
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ borderRadius: 2, backgroundColor: '#fff7ed', border: '1px solid #ffedd5' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#c2410c' }}>
              ⚠️ KHẮC PHỤC LỖI HTTP 403 (FORBIDDEN):
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '13px', color: '#9a3412', mt: 0.5, lineHeight: 1.6 }}>
              Nếu bấm đồng bộ báo <b>Lỗi HTTP 403</b>, nguyên nhân duy nhất là khi cài đặt Apps Script mục <b>Who has access (Ai có quyền truy cập)</b> chưa chọn <b>"Bất kỳ ai" (Anyone)</b>.
              <br/>
              👉 <b>Cách sửa nhanh trong 10 giây:</b> Vào lại Apps Script ➔ Bấm góc phải <b>Triển khai (Deploy)</b> ➔ <b>Quản lý các bản triển khai (Manage deployments)</b> ➔ Bấm biểu tượng <b>Cây bút sửa (Edit icon ✏️)</b> ➔ Đổi <i>Who has access</i> thành <b>Anyone (Bất kỳ ai)</b> ➔ Bấm <b>Triển khai (Deploy)</b> là xong ngay!
            </Typography>
          </Alert>

          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
            📋 Các bước triển khai trong 30 giây:
          </Typography>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: '13px', lineHeight: '1.8', color: '#334155' }}>
            <li>Mở file Google Sheet: <a href="https://docs.google.com/spreadsheets/d/10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY/edit#gid=0" target="_blank" rel="noreferrer"><b>Mở Google Sheet 10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY</b></a></li>
            <li>Trên thanh menu chọn: <b>Tiện ích mở rộng (Extensions)</b> ➔ <b>Apps Script</b>.</li>
            <li>Xóa toàn bộ mã mặc định và dán đoạn code bên dưới vào. Bấm <b>Lưu (Save icon 💾)</b>.</li>
            <li>Bấm nút góc phải trên <b>Triển khai (Deploy)</b> ➔ <b>Triển khai dưới dạng ứng dụng web (New deployment &rarr; Web App)</b>.</li>
            <li>Cấu hình:
              <ul>
                <li>Mô tả: <b>Admin Sync API</b></li>
                <li>Thực thi dưới dạng (Execute as): <b>Tôi (Me)</b></li>
                <li>Ai có quyền truy cập (Who has access): <b>Bất kỳ ai (Anyone)</b></li>
              </ul>
            </li>
            <li>Bấm <b>Triển khai (Deploy)</b> ➔ Cấp quyền truy cập ➔ Copy đường dẫn <b>URL ứng dụng Web (Web App URL)</b> và dán vào ô cấu hình Web App URL!</li>
          </ol>

          <Box sx={{ position: 'relative', mt: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={() => {
                const code = `function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var users = contents.users || [];
    var headers = ["ID", "MSNV", "Họ và Tên", "Mail", "User", "Mật Khẩu", "Quyền", "Ứng dụng được xem", "Trạng thái"];
    
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    if (users.length > 0) {
      var rows = users.map(function(u, idx) {
        return [
          u["ID"] || (idx + 1),
          u["MSNV"] || "",
          u["Họ và Tên"] || "",
          u["Mail"] || "",
          u["User"] || "",
          u["Mật Khẩu"] || "",
          u["Quyền"] || "user",
          u["Ứng dụng được xem"] || "",
          u["Trạng thái"] || "Active"
        ];
      });
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Đã đồng bộ " + users.length + " tài khoản lên Google Sheet thành công!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Apps Script API đang hoạt động!" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
                navigator.clipboard.writeText(code);
                alert("📋 Đã sao chép mã Google Apps Script vào bộ nhớ tạm!");
              }}
              sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, fontWeight: 800, borderRadius: 2 }}
            >
              📋 Copy Code Apps Script
            </Button>
            <Paper sx={{ p: 2, backgroundColor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px', borderRadius: 2.5, overflowX: 'auto', maxHeight: 300 }}>
              <pre style={{ margin: 0 }}>{`function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var users = contents.users || [];
    var headers = ["ID", "MSNV", "Họ và Tên", "Mail", "User", "Mật Khẩu", "Quyền", "Ứng dụng được xem", "Trạng thái"];
    
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    if (users.length > 0) {
      var rows = users.map(function(u, idx) {
        return [
          u["ID"] || (idx + 1),
          u["MSNV"] || "",
          u["Họ và Tên"] || "",
          u["Mail"] || "",
          u["User"] || "",
          u["Mật Khẩu"] || "",
          u["Quyền"] || "user",
          u["Ứng dụng được xem"] || "",
          u["Trạng thái"] || "Active"
        ];
      });
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Đã đồng bộ " + users.length + " tài khoản lên Google Sheet thành công!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Apps Script API đang hoạt động!" }))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppsScriptGuideModal;
