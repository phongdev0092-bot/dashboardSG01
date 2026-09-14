import re

file_path = r'd:\Tool KPI\frontend\src\App.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variables for WebApp URL & Guide Modal
state_target = "const [adminUsers, setAdminUsers] = useState([]);"
state_replacement = """const [adminUsers, setAdminUsers] = useState([]);
  const [webAppUrl, setWebAppUrl] = useState('');
  const [appsScriptGuideOpen, setAppsScriptGuideOpen] = useState(false);"""

content = content.replace(state_target, state_replacement)

# 2. Update fetchAdminUsers & add handlers
fetch_target = """  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data) setAdminUsers(res.data);
    } catch (err) {
      console.error("Fetch admin users error:", err);
    } finally {
      setAdminUsersLoading(false);
    }
  };"""

fetch_replacement = """  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data) setAdminUsers(res.data);
      const cfgRes = await axios.get('/api/admin/users/config-webapp');
      if (cfgRes.data && cfgRes.data.url) {
        setWebAppUrl(cfgRes.data.url);
      }
    } catch (err) {
      console.error("Fetch admin users error:", err);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const handleSaveWebAppUrl = async () => {
    try {
      const res = await axios.post('/api/admin/users/config-webapp', { url: webAppUrl });
      if (res.data && res.data.ok) {
        alert("✅ Đã lưu Google Apps Script Web App URL thành công!");
      } else {
        alert("❌ Không thể lưu Web App URL!");
      }
    } catch (err) {
      alert("❌ Lỗi kết nối server khi lưu Web App URL!");
    }
  };

  const handleSyncSheetNow = async () => {
    if (!webAppUrl.trim()) {
      alert("⚠️ Vui lòng nhập Google Apps Script Web App URL trước khi bấm đồng bộ!");
      return;
    }
    try {
      const res = await axios.post('/api/admin/users/sync-sheet');
      if (res.data && res.data.ok) {
        alert(res.data.msg || "✅ Đồng bộ thành công!");
      } else {
        alert("❌ Lỗi đồng bộ: " + (res.data?.msg || "Vui lòng kiểm tra lại Web App URL!"));
      }
    } catch (err) {
      alert("❌ Lỗi kết nối server khi đồng bộ Google Sheet!");
    }
  };"""

content = content.replace(fetch_target, fetch_replacement)

# 3. Add WebApp config card above Admin Users Table in Tag Phân Quyền
tag_phanquyen_target = """                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1e293b' }}>
                            🔑 Bảng Quản Lý Tài Khoản User & Phân Quyền (Sheet Admin)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Sheet ID: <code>10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY</code> | GID: 0
                          </Typography>
                        </Box>"""

tag_phanquyen_replacement = """                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1e293b' }}>
                            🔑 Bảng Quản Lý Tài Khoản User & Phân Quyền (Sheet Admin)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Sheet ID: <code>10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY</code> | GID: 0
                          </Typography>
                        </Box>

                      </Box>

                      {/* GOOGLE APPS SCRIPT WEB APP SYNC CONFIGURATION PANEL */}
                      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1e293b' }}>
                            ⚡ Cấu Hình Đồng Bộ Tự Động Với Google Sheet Web App (ID: 10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY - GID 0)
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setAppsScriptGuideOpen(true)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, fontSize: '12px' }}
                          >
                            📜 Hướng Dẫn & Copy Mã Apps Script Code
                          </Button>
                        </Box>

                        <Grid container spacing={1.5} alignItems="center">
                          <Grid item xs={12} sm={8} md={8}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Google Apps Script Web App URL"
                              placeholder="Dán link https://script.google.com/macros/s/AKfycb.../exec vào đây"
                              value={webAppUrl}
                              onChange={(e) => setWebAppUrl(e.target.value)}
                              sx={{ backgroundColor: '#ffffff', '& .MuiInputBase-root': { borderRadius: 2 } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4} md={4} sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleSaveWebAppUrl}
                              sx={{ borderRadius: 2, fontWeight: 800, whiteSpace: 'nowrap' }}
                            >
                              💾 Lưu URL
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              onClick={handleSyncSheetNow}
                              sx={{ borderRadius: 2, fontWeight: 800, whiteSpace: 'nowrap' }}
                            >
                              🔄 Đồng Bộ Sheet Ngay
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>"""

content = content.replace(tag_phanquyen_target, tag_phanquyen_replacement)

# 4. Add AppsScriptGuideModal dialog before closing Box of App
guide_modal_code = """
        {/* GOOGLE APPS SCRIPT GUIDE & CODE MODAL */}
        <Dialog open={appsScriptGuideOpen} onClose={() => setAppsScriptGuideOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: '#1d4ed8', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            📜 Hướng Dẫn Tải & Tạo Google Apps Script Web App Đồng Bộ Sheet
            <IconButton onClick={() => setAppsScriptGuideOpen(false)} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Đường dẫn export CSV của Google Sheet chỉ cho phép đọc. Để ghi toàn bộ danh sách tài khoản (MSNV, Họ Tên, Email, Mật Khẩu, Quyền, Trang Thái) tự động lên Google Sheet <b>10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY</b> (GID 0), hãy làm theo 5 bước bên dưới:
                </Typography>
              </Alert>

              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                📋 Các bước triển khai trong 30 giây:
              </Typography>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: '13px', lineHeight: '1.8', color: '#334155' }}>
                <li>Mở file Google Sheet: <a href="https://docs.google.com/spreadsheets/d/10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY/edit#gid=0" target="_blank" rel="noreferrer"><b>Mở Google Sheet 10Y5WBM9PDng_AsiyNxgFbEUac8XFBviRc21G0ar6erY</b></a></li>
                <li>Trên thanh menu chọn: <b>Tiện ích mở rộng (Extensions)</b> ➔ <b>Apps Script</b>.</li>
                <li>Xóa toàn bộ mã mặc định và dán đoạn code bên dưới vào. Bấm <b>Lưu (Save icon 💾)</b>.</li>
                <li>Bấm nút góc phải trên <b>Triển khai (Deploy)</b> ➔ <b>Triển khai dưới dạng ứng dụng web (New deployment -> Web App)</b>.</li>
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
            <Button onClick={() => setAppsScriptGuideOpen(false)} variant="contained">Đóng</Button>
          </DialogActions>
        </Dialog>
"""

# Insert modal right before theme provider closing or end of return
last_dialog_target = "        {/* HR DELETE CONFIRM MODAL */}"
content = content.replace(last_dialog_target, guide_modal_code + "\n\n" + last_dialog_target)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("UI modification completed successfully.")
