import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  UploadFile as UploadFileIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  BuildCircle as BuildCircleIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  CalendarToday as CalendarTodayIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  CloudUpload as CloudUploadIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';

const MILESTONES = [
  { id: '8-10H', label: '8-10H', subtitle: 'Hạn <= 10:00' },
  { id: '10-12H', label: '10-12H', subtitle: 'Hạn <= 12:00' },
  { id: '12h30-13h30', label: '12h30-13h30', subtitle: 'Hạn <= 13:30' },
  { id: '13h30-15h30', label: '13h30-15h30', subtitle: 'Hạn <= 15:30' },
  { id: '15h30-17h30', label: '15h30-17h30', subtitle: 'Hạn <= 17:30' },
  { id: '17h30-19h30', label: '17h30-19h30', subtitle: 'Hạn <= 19:30' },
  { id: '19h30-21h30', label: '19h30-21h30', subtitle: 'Hạn <= 21:30' },
  { id: '21h30-23h', label: '21h30-23h', subtitle: 'Hạn <= 23:59' }
];

const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

export default function PhanTichMocGioView() {
  const [analysisType, setAnalysisType] = useState('COMPLETE_TIME'); // 'COMPLETE_TIME' | 'APPOINTMENT'
  const [sourceMode, setSourceMode] = useState('DATABASE'); // 'DATABASE' | 'UPLOAD'
  const [targetDate, setTargetDate] = useState('2026-09-12');
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Filters
  const [teamLeadFilter, setTeamLeadFilter] = useState('__ALL__');
  const [blockFilter, setBlockFilter] = useState('__ALL__');
  const [searchQuery, setSearchQuery] = useState('');
  const [allTeamLeads, setAllTeamLeads] = useState([]);
  const [allBlocks, setAllBlocks] = useState([]);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalTitle, setDetailModalTitle] = useState('');
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [modalSearch, setModalSearch] = useState('');

  // Upload States
  const [uploadTkFile, setUploadTkFile] = useState(null);
  const [uploadBtFile, setUploadBtFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const tkInputRef = useRef(null);
  const btInputRef = useRef(null);

  // Load list of available dates from DB
  useEffect(() => {
    fetchAvailableDates(analysisType);
  }, []);

  const fetchAvailableDates = async (type = analysisType) => {
    try {
      const res = await axios.get('/api/kpi/moc-gio/dates', {
        params: { analysis_type: type }
      });
      if (res.data && res.data.dates) {
        setAvailableDates(res.data.dates);
        // Nếu ngày hiện tại chưa có trong list, ưu tiên 2026-09-12 hoặc ngày max
        if (res.data.dates.includes('2026-09-12')) {
          setTargetDate('2026-09-12');
        } else if (res.data.max_date) {
          setTargetDate(res.data.max_date);
        }
      }
    } catch (err) {
      console.error('Fetch available dates error:', err);
    }
  };

  // Fetch report from database
  const fetchReport = async (curType = analysisType, curDate = targetDate) => {
    if (sourceMode === 'UPLOAD') return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/kpi/moc-gio/report', {
        params: {
          date: curDate,
          team_lead: teamLeadFilter,
          block: blockFilter,
          search: searchQuery,
          analysis_type: curType
        }
      });
      if (res.data && res.data.ok) {
        setReportData(res.data);
        // Luôn cập nhật danh sách Đội trưởng và Block từ API
        if (res.data.all_team_leads && res.data.all_team_leads.length > 0) {
          setAllTeamLeads(res.data.all_team_leads);
        } else if (allTeamLeads.length === 0 && res.data.employees) {
          const leads = Array.from(new Set(res.data.employees.map(e => e.doi_truong).filter(Boolean)));
          setAllTeamLeads(leads);
        }
        if (res.data.all_blocks && res.data.all_blocks.length > 0) {
          setAllBlocks(res.data.all_blocks);
        }
      } else {
        setError(res.data?.error || 'Không tải được báo cáo phân tích mốc giờ!');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Lỗi kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisTypeChange = (newType) => {
    if (newType === analysisType) return;
    setAnalysisType(newType);
    fetchAvailableDates(newType);
    fetchReport(newType, targetDate);
  };

  useEffect(() => {
    if (sourceMode === 'DATABASE') {
      fetchReport(analysisType, targetDate);
    }
  }, [targetDate, teamLeadFilter, blockFilter, sourceMode, analysisType]);

  // Handle Upload and Analyze
  const handleAnalyzeUploadedFiles = async () => {
    if (!uploadTkFile && !uploadBtFile) {
      alert('Vui lòng chọn ít nhất 1 file Data Triển Khai hoặc Data Bảo Trì!');
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    if (uploadTkFile) formData.append('tk_file', uploadTkFile);
    if (uploadBtFile) formData.append('bt_file', uploadBtFile);
    if (targetDate) formData.append('date', targetDate);
    if (teamLeadFilter) formData.append('team_lead', teamLeadFilter);
    if (blockFilter) formData.append('block', blockFilter);
    if (searchQuery) formData.append('search', searchQuery);
    formData.append('analysis_type', analysisType);

    try {
      const res = await axios.post('/api/kpi/moc-gio/analyze-files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.ok) {
        setReportData(res.data);
        if (res.data.all_team_leads && res.data.all_team_leads.length > 0) {
          setAllTeamLeads(res.data.all_team_leads);
        }
      } else {
        setError(res.data?.error || 'Lỗi khi phân tích file!');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Lỗi kết nối khi tải file!');
    } finally {
      setUploading(false);
    }
  };

  // Filtered employees: hỗ trợ tìm kiếm không dấu theo cả Họ tên, Đội Trưởng, Inside Account, Mã NV, Block
  const filteredEmployees = useMemo(() => {
    if (!reportData?.employees) return [];
    let list = reportData.employees;

    // Lọc theo dropdown Đội Trưởng
    if (teamLeadFilter && teamLeadFilter !== '__ALL__') {
      const tlNorm = removeAccents(teamLeadFilter);
      list = list.filter(e => e.doi_truong && removeAccents(e.doi_truong).includes(tlNorm));
    }

    // Lọc theo dropdown Block
    if (blockFilter && blockFilter !== '__ALL__') {
      const blkNorm = removeAccents(blockFilter);
      list = list.filter(e => e.block && removeAccents(e.block).includes(blkNorm));
    }

    // Lọc theo ô tìm kiếm chung
    if (searchQuery.trim()) {
      const qNorm = removeAccents(searchQuery);
      list = list.filter(
        e =>
          (e.name && removeAccents(e.name).includes(qNorm)) ||
          (e.inside_account && removeAccents(e.inside_account).includes(qNorm)) ||
          (e.ma_nv && removeAccents(e.ma_nv).includes(qNorm)) ||
          (e.block && removeAccents(e.block).includes(qNorm)) ||
          (e.doi_truong && removeAccents(e.doi_truong).includes(qNorm))
      );
    }
    return list;
  }, [reportData?.employees, teamLeadFilter, blockFilter, searchQuery]);

  // Computed dynamic metrics based on filtered employees
  const dynamicMetrics = useMemo(() => {
    if (!filteredEmployees || filteredEmployees.length === 0) {
      return {
        total_all: 0,
        total_tk: 0,
        total_bt: 0,
        total_tk_xanh: 0,
        total_tk_do: 0,
        total_bt_xanh: 0,
        total_bt_do: 0,
        active_employees: 0,
        peak_milestone: 'N/A',
        peak_count: 0
      };
    }
    const totalAll = filteredEmployees.reduce((sum, e) => sum + (e.total_all || 0), 0);
    const totalTk = filteredEmployees.reduce((sum, e) => sum + (e.total_tk || 0), 0);
    const totalBt = filteredEmployees.reduce((sum, e) => sum + (e.total_bt || 0), 0);
    const totalTkXanh = filteredEmployees.reduce((sum, e) => sum + (e.total_tk_xanh || 0), 0);
    const totalTkDo = filteredEmployees.reduce((sum, e) => sum + (e.total_tk_do || 0), 0);
    const totalBtXanh = filteredEmployees.reduce((sum, e) => sum + (e.total_bt_xanh || 0), 0);
    const totalBtDo = filteredEmployees.reduce((sum, e) => sum + (e.total_bt_do || 0), 0);

    let peakMoc = null;
    let peakCount = -1;
    MILESTONES.forEach(m => {
      const cnt = filteredEmployees.reduce((sum, e) => sum + (e.milestones?.[m.id]?.tong_moc || 0), 0);
      if (cnt > peakCount) {
        peakCount = cnt;
        peakMoc = m.id;
      }
    });

    return {
      total_all: totalAll,
      total_tk: totalTk,
      total_bt: totalBt,
      total_tk_xanh: totalTkXanh,
      total_tk_do: totalTkDo,
      total_bt_xanh: totalBtXanh,
      total_bt_do: totalBtDo,
      active_employees: filteredEmployees.length,
      peak_milestone: peakMoc || 'N/A',
      peak_count: peakCount > 0 ? peakCount : 0
    };
  }, [filteredEmployees]);

  const dynamicMilestoneSummary = useMemo(() => {
    const summary = {};
    MILESTONES.forEach(m => {
      const mid = m.id;
      const tkXanh = filteredEmployees.reduce((sum, e) => sum + (e.milestones?.[mid]?.tk_xanh || 0), 0);
      const tkDo = filteredEmployees.reduce((sum, e) => sum + (e.milestones?.[mid]?.tk_do || 0), 0);
      const btXanh = filteredEmployees.reduce((sum, e) => sum + (e.milestones?.[mid]?.bt_xanh || 0), 0);
      const btDo = filteredEmployees.reduce((sum, e) => sum + (e.milestones?.[mid]?.bt_do || 0), 0);
      summary[mid] = {
        tk_xanh: tkXanh,
        tk_do: tkDo,
        bt_xanh: btXanh,
        bt_do: btDo
      };
    });
    return summary;
  }, [filteredEmployees]);

  // Handle open detail modal when clicking a cell
  const handleCellClick = (emp, milestoneId = null, serviceType = null, colorType = null) => {
    if (!reportData?.detailed_records) return;
    const records = reportData.detailed_records.filter(r => {
      // Khớp nhân viên
      const matchEmp = r.inside_account === emp.inside_account || r.nhan_vien === emp.name;
      if (!matchEmp) return false;

      // Nếu có lọc theo loại dịch vụ (TK hoặc BT)
      if (serviceType && r.type !== serviceType) return false;

      // Nếu có lọc theo mốc giờ và màu
      if (milestoneId) {
        if (colorType === 'xanh') {
          return r.slot_xanh === milestoneId;
        } else if (colorType === 'do') {
          return r.slot_do === milestoneId;
        } else {
          return r.slot_xanh === milestoneId || r.slot_do === milestoneId;
        }
      }
      return true;
    });

    let title = `Chi tiết ca: ${emp.name} (${emp.inside_account})`;
    if (milestoneId) {
      title += ` - Mốc ${milestoneId}`;
    }
    if (serviceType) {
      title += ` - ${serviceType === 'TK' ? 'Triển Khai' : 'Bảo Trì'}`;
    }
    if (colorType) {
      title += ` [Mốc ${colorType === 'xanh' ? 'Xanh' : 'Đỏ'}]`;
    }

    setDetailModalTitle(title);
    setSelectedRecords(records);
    setModalSearch('');
    setDetailModalOpen(true);
  };

  // Filtered records in modal
  const filteredModalRecords = useMemo(() => {
    if (!modalSearch.trim()) return selectedRecords;
    const q = modalSearch.trim().toLowerCase();
    return selectedRecords.filter(
      r =>
        r.so_hd.toLowerCase().includes(q) ||
        r.ten_kh.toLowerCase().includes(q) ||
        r.loai_gd.toLowerCase().includes(q) ||
        r.block.toLowerCase().includes(q)
    );
  }, [selectedRecords, modalSearch]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!filteredEmployees || filteredEmployees.length === 0) {
      alert('Không có dữ liệu để xuất file Excel!');
      return;
    }

    const isAppt = (analysisType === 'APPOINTMENT');

    // Header hàng 1
    const headerRow1 = [
      'STT', 'Mã NV', 'Họ Tên KTV', 'Inside Account', 'Block', 'Đội Trưởng', 'Tổng Ca',
      'Tổng TK', 'Tổng BT'
    ];
    MILESTONES.forEach(m => {
      if (isAppt) {
        headerRow1.push(`${m.label} - TK Xanh (O/J)`, `${m.label} - TK Đỏ (I)`, `${m.label} - BT Hẹn (Q/K)`, `${m.label} - Tổng Mốc`);
      } else {
        headerRow1.push(`${m.label} - TK Xanh`, `${m.label} - TK Đỏ`, `${m.label} - BT Xanh`, `${m.label} - BT Đỏ`);
      }
    });

    const rows = filteredEmployees.map((emp, idx) => {
      const row = [
        idx + 1,
        emp.ma_nv || '',
        emp.name,
        emp.inside_account,
        emp.block,
        emp.doi_truong,
        emp.total_all,
        emp.total_tk,
        emp.total_bt
      ];
      MILESTONES.forEach(m => {
        const ms = emp.milestones[m.id] || {};
        if (isAppt) {
          row.push(ms.tk_xanh || 0, ms.tk_do || 0, ms.bt_do || 0, ms.tong_moc || 0);
        } else {
          row.push(ms.tk_xanh || 0, ms.tk_do || 0, ms.bt_xanh || 0, ms.bt_do || 0);
        }
      });
      return row;
    });

    // Hàng tổng cộng
    const totalRow = [
      'TỔNG', '', 'TẤT CẢ NHÂN VIÊN', '', '', '',
      reportData?.metrics?.total_all || 0,
      reportData?.metrics?.total_tk || 0,
      reportData?.metrics?.total_bt || 0
    ];
    MILESTONES.forEach(m => {
      const msSum = reportData?.milestone_summary?.[m.id] || {};
      if (isAppt) {
        totalRow.push(msSum.tk_xanh || 0, msSum.tk_do || 0, msSum.bt_do || 0, msSum.tong_moc || 0);
      } else {
        totalRow.push(msSum.tk_xanh || 0, msSum.tk_do || 0, msSum.bt_xanh || 0, msSum.bt_do || 0);
      }
    });
    rows.push(totalRow);

    const worksheet = XLSX.utils.aoa_to_sheet([headerRow1, ...rows]);
    const workbook = XLSX.utils.book_new();
    const sheetName = isAppt ? 'MocGio_TheoLichHen' : 'MocGio_TheoHoanTat';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const fileName = `BaoCao_MocGio_${isAppt ? 'TheoLichHen' : 'TheoHoanTat'}_${targetDate || 'all'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ========================================================================= */}
      {/* 1. WORKFLOW HEADER & INTRODUCTION */}
      {/* ========================================================================= */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(13, 71, 161, 0.2)'
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2.5,
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 32, color: '#ffffff' }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.3px' }}>
                  Phân Tích Tồn Mốc Giờ Hẹn
                </Typography>
                <Chip
                  label="Chuẩn SLA 8 Mốc Giờ"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '11px',
                    borderRadius: '6px'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5, maxWidth: 900 }}>
                Hỗ trợ 2 chế độ phân tích: <strong>Theo Thời Gian Hoàn Tất</strong> (tất cả bill lọc theo ngày hoàn tất HĐ) và <strong>Theo Lịch Hẹn</strong> (bỏ qua ngày hoàn tất, TK ưu tiên Cột O nếu có / I & J nếu O trống; BT ưu tiên Cột Q nếu có / Cột K nếu Q trống).
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportExcel}
              disabled={!filteredEmployees || filteredEmployees.length === 0}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#0d47a1',
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none',
                px: 2,
                '&:hover': { backgroundColor: '#ffffff' }
              }}
            >
              Xuất Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => fetchReport(analysisType, targetDate)}
              disabled={loading}
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              Làm Mới
            </Button>
          </Box>
        </Box>

        {/* 2 SUB-TABS (TAGS): THEO THỜI GIAN HOÀN TẤT & THEO LỊCH HẸN */}
        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <Tabs
            value={analysisType}
            onChange={(e, val) => handleAnalysisTypeChange(val)}
            textColor="inherit"
            sx={{
              minHeight: 46,
              backgroundColor: 'rgba(0, 0, 0, 0.18)',
              borderRadius: 3,
              p: 0.6,
              '& .MuiTabs-indicator': {
                height: '100%',
                borderRadius: 2.5,
                backgroundColor: '#ffffff',
                boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                zIndex: 1
              },
              '& .MuiTab-root': {
                minHeight: 44,
                zIndex: 2,
                fontWeight: 800,
                fontSize: '14px',
                textTransform: 'none',
                borderRadius: 2.5,
                transition: 'all 0.2s ease',
                flex: 1,
                color: 'rgba(255, 255, 255, 0.85)',
                '&.Mui-selected': {
                  color: '#0d47a1',
                  fontWeight: 900
                }
              }
            }}
          >
            <Tab
              value="COMPLETE_TIME"
              icon={<AssignmentTurnedInIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="1. Theo Thời Gian Hoàn Tất"
            />
            <Tab
              value="APPOINTMENT"
              icon={<AccessTimeIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="2. Theo Lịch Hẹn (Mốc Hẹn)"
            />
          </Tabs>
        </Box>

        {/* MỐC GIỜ CHUẨN PILLS */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ alignSelf: 'center', opacity: 0.85, fontWeight: 700, mr: 0.5 }}>
            8 MỐC HẸN CHUẨN:
          </Typography>
          {MILESTONES.map((m, idx) => (
            <Chip
              key={m.id}
              label={`${idx + 1}. ${m.label}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px'
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* BANNER HƯỚNG DẪN CHI TIẾT THEO CHẾ ĐỘ PHÂN TÍCH */}
      {analysisType === 'COMPLETE_TIME' ? (
        <Alert
          severity="info"
          icon={<AssignmentTurnedInIcon fontSize="inherit" />}
          sx={{
            borderRadius: 2.5,
            border: '1px solid #bbdefb',
            backgroundColor: '#f0f7ff',
            fontSize: '13px',
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <strong>Chế độ Theo Thời Gian Hoàn Tất:</strong> Phân tích tất cả hợp đồng đã hoàn tất trong ngày đã chọn.
          Triển Khai tính theo <strong>Cột I (Mốc Đỏ L1)</strong> & <strong>Cột J (Mốc Xanh L1)</strong>;
          Bảo Trì tính theo <strong>Cột M (Mốc Xanh L1)</strong> & <strong>Cột K (Mốc Đỏ L1)</strong>.
        </Alert>
      ) : (
        <Alert
          severity="warning"
          icon={<AccessTimeIcon fontSize="inherit" />}
          sx={{
            borderRadius: 2.5,
            border: '1px solid #ffe082',
            backgroundColor: '#fffdf0',
            fontSize: '13px',
            color: '#795548',
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <strong>Chế độ Theo Lịch Hẹn (Không quan tâm thời gian hoàn tất):</strong>
          <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5, lineHeight: 1.5 }}>
            <li>
              <strong>Triển Khai:</strong> Cột O (Mốc hẹn L2 xanh), Cột I (Mốc hẹn L1 đỏ), Cột J (Mốc hẹn L1 xanh). <em>Nếu Cột O có giá trị thì lấy Cột O làm mốc; nếu Cột O trống thì lấy Cột I và Cột J làm mốc thời gian.</em>
            </li>
            <li>
              <strong>Bảo Trì:</strong> Cột K (Mốc hẹn L1), Cột Q (Mốc hẹn L2). <em>Nếu Cột Q có giá trị thì lấy Cột Q; nếu Cột Q trống thì lấy Cột K làm giá trị mốc thời gian.</em>
            </li>
          </Box>
        </Alert>
      )}

      {/* ========================================================================= */}
      {/* 2. SOURCE MODE TABS & CONTROLS BAR */}
      {/* ========================================================================= */}
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* TAB CHỌN NGUỒN DỮ LIỆU */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Tabs
              value={sourceMode}
              onChange={(e, val) => setSourceMode(val)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                minHeight: 40,
                '& .MuiTab-root': {
                  minHeight: 40,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '13px'
                }
              }}
            >
              <Tab icon={<StorageIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Dữ liệu Hệ Thống" value="DATABASE" />
              <Tab icon={<CloudUploadIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Tải File Excel Phân Tích" value="UPLOAD" />
            </Tabs>
          </Grid>

          {/* CHỌN NGÀY */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              type="date"
              label={analysisType === 'APPOINTMENT' ? "Ngày lịch hẹn (Mốc hẹn)" : "Ngày hoàn tất HĐ"}
              size="small"
              fullWidth
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText={availableDates.includes(targetDate) ? "Đã có dữ liệu trong DB" : "Chọn ngày bất kỳ"}
            />
          </Grid>

          {/* CHỌN NHANH NGÀY MẪU */}
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#5f6368' }}>
                Chọn nhanh:
              </Typography>
              <Button
                variant={targetDate === '2026-09-12' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTargetDate('2026-09-12')}
                sx={{ borderRadius: 2, fontSize: '11px', textTransform: 'none', fontWeight: 700 }}
              >
                12/09/2026 (Mẫu)
              </Button>
              {availableDates.slice(-3).reverse().map((d) => (
                <Button
                  key={d}
                  variant={targetDate === d ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setTargetDate(d)}
                  sx={{ borderRadius: 2, fontSize: '11px', textTransform: 'none', fontWeight: 600 }}
                >
                  {d.split('-').reverse().join('/')}
                </Button>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* NẾU CHỌN TAB UPLOAD FILE */}
        {sourceMode === 'UPLOAD' && (
          <Box sx={{ mt: 2.5, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2.5, border: '1px dashed #b0bec5' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1565c0' }}>
              📁 Tải file Data Triển Khai & Bảo Trì để phân tích nóng:
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    ref={tkInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => setUploadTkFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<UploadFileIcon />}
                    onClick={() => tkInputRef.current?.click()}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {uploadTkFile ? uploadTkFile.name : 'Data Triển Khai (Cột I & J)'}
                  </Button>
                  {uploadTkFile && (
                    <IconButton size="small" onClick={() => setUploadTkFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    ref={btInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => setUploadBtFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<UploadFileIcon />}
                    onClick={() => btInputRef.current?.click()}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {uploadBtFile ? uploadBtFile.name : 'Data Bảo Trì (Cột M & K)'}
                  </Button>
                  {uploadBtFile && (
                    <IconButton size="small" onClick={() => setUploadBtFile(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={uploading || (!uploadTkFile && !uploadBtFile)}
                  onClick={handleAnalyzeUploadedFiles}
                  sx={{ backgroundColor: '#1565c0', fontWeight: 700, textTransform: 'none' }}
                >
                  {uploading ? <CircularProgress size={20} color="inherit" /> : 'Phân Tích File'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* BỘ LỌC ĐỘI TRƯỞNG, BLOCK, TÌM KIẾM */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <TextField
              select
              label="Đội trưởng"
              size="small"
              fullWidth
              value={teamLeadFilter}
              onChange={(e) => setTeamLeadFilter(e.target.value)}
            >
              <MenuItem value="__ALL__">-- Tất cả Đội trưởng --</MenuItem>
              {allTeamLeads.map((tl) => (
                <MenuItem key={tl} value={tl}>{tl}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <TextField
              select
              label="Block"
              size="small"
              fullWidth
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
            >
              <MenuItem value="__ALL__">-- Tất cả Block --</MenuItem>
              {allBlocks.map((blk) => (
                <MenuItem key={blk} value={blk}>{blk}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 6 }}>
            <TextField
              placeholder="Tìm kiếm KTV theo Họ tên, Đội Trưởng, Inside Account, Mã NV, Block..."
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#757575', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* ERROR ALERT */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* LOADING SPINNER */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
          <CircularProgress size={44} sx={{ color: '#1565c0' }} />
          <Typography variant="body2" sx={{ mt: 2, color: '#5f6368', fontWeight: 600 }}>
            Đang phân tích các mốc hẹn Triển Khai & Bảo Trì...
          </Typography>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* 3. METRIC SUMMARY CARDS */}
      {/* ========================================================================= */}
      {!loading && reportData && (
        <Grid container spacing={2}>
          {/* TỔNG HỢP ĐỒNG / TỔNG CA */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', backgroundColor: '#f0f7ff' }}>
              <Typography variant="caption" sx={{ color: '#0d47a1', fontWeight: 800, textTransform: 'uppercase' }}>
                {analysisType === 'APPOINTMENT' ? 'Tổng Ca Lịch Hẹn' : 'Tổng HĐ Hoàn Tất'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0d47a1', my: 0.5 }}>
                {dynamicMetrics?.total_all || 0}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 700 }}>
                  TK: {dynamicMetrics?.total_tk || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#0288d1', fontWeight: 700 }}>
                  BT: {dynamicMetrics?.total_bt || 0}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* TRIỂN KHAI */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}>
              <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 800, textTransform: 'uppercase' }}>
                {analysisType === 'APPOINTMENT' ? 'Triển Khai (Cột O / I & J)' : 'Triển Khai (Cột I & J)'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#2e7d32', my: 0.5 }}>
                {dynamicMetrics?.total_tk || 0}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={analysisType === 'APPOINTMENT' ? `Xanh (O/J): ${dynamicMetrics?.total_tk_xanh || 0}` : `Xanh: ${dynamicMetrics?.total_tk_xanh || 0}`}
                  size="small"
                  sx={{ backgroundColor: '#e8f5e9', color: '#1b5e20', fontWeight: 700, fontSize: '10px', height: 20 }}
                />
                <Chip
                  label={analysisType === 'APPOINTMENT' ? `Đỏ (I): ${dynamicMetrics?.total_tk_do || 0}` : `Đỏ: ${dynamicMetrics?.total_tk_do || 0}`}
                  size="small"
                  sx={{ backgroundColor: '#ffebee', color: '#b71c1c', fontWeight: 700, fontSize: '10px', height: 20 }}
                />
              </Box>
            </Card>
          </Grid>

          {/* BẢO TRÌ */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}>
              <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 800, textTransform: 'uppercase' }}>
                {analysisType === 'APPOINTMENT' ? 'Bảo Trì (Cột Q / K)' : 'Bảo Trì (Cột M & K)'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0288d1', my: 0.5 }}>
                {dynamicMetrics?.total_bt || 0}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                {analysisType === 'APPOINTMENT' ? (
                  <Chip
                    label={`Hẹn Q/K: ${dynamicMetrics?.total_bt_do || 0}`}
                    size="small"
                    sx={{ backgroundColor: '#e0f2f1', color: '#00695c', fontWeight: 700, fontSize: '10px', height: 20 }}
                  />
                ) : (
                  <>
                    <Chip
                      label={`Xanh: ${dynamicMetrics?.total_bt_xanh || 0}`}
                      size="small"
                      sx={{ backgroundColor: '#e8f5e9', color: '#1b5e20', fontWeight: 700, fontSize: '10px', height: 20 }}
                    />
                    <Chip
                      label={`Đỏ: ${dynamicMetrics?.total_bt_do || 0}`}
                      size="small"
                      sx={{ backgroundColor: '#ffebee', color: '#b71c1c', fontWeight: 700, fontSize: '10px', height: 20 }}
                    />
                  </>
                )}
              </Box>
            </Card>
          </Grid>

          {/* MỐC GIỜ CAO ĐIỂM NHẤT */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', backgroundColor: '#fff8e1' }}>
              <Typography variant="caption" sx={{ color: '#f57f17', fontWeight: 800, textTransform: 'uppercase' }}>
                {analysisType === 'APPOINTMENT' ? 'Mốc Hẹn Đỉnh Điểm' : 'Mốc Cao Điểm Nhất'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#e65100', my: 0.5 }}>
                {dynamicMetrics?.peak_milestone || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#bf360c', fontWeight: 700 }}>
                {dynamicMetrics?.peak_count || 0} {analysisType === 'APPOINTMENT' ? 'ca theo lịch hẹn' : 'ca hoàn tất'}
              </Typography>
            </Card>
          </Grid>

          {/* NHÂN VIÊN PHÁT SINH CA */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}>
              <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 800, textTransform: 'uppercase' }}>
                KTV Hoạt Động
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#37474f', my: 0.5 }}>
                {filteredEmployees.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#78909c', fontWeight: 600 }}>
                Ngày: {reportData.selected_date_display || targetDate}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN MULTI-TIER MATRIX TABLE */}
      {/* ========================================================================= */}
      {!loading && reportData && (
        <Card elevation={0} sx={{ borderRadius: 3.5, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fcfcfc', borderBottom: '1px solid #e0e0e0' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#202124' }}>
                Bảng Phân Tích Mốc Giờ Hẹn Theo Từng KTV
              </Typography>
              <Typography variant="caption" sx={{ color: '#5f6368' }}>
                Click vào số lượng bất kỳ để xem chi tiết danh sách hợp đồng & lịch hẹn L1 (Xanh / Đỏ).
              </Typography>
            </Box>
            <Chip
              label={`Tìm thấy ${filteredEmployees.length} KTV`}
              size="small"
              sx={{ fontWeight: 700, backgroundColor: '#e3f2fd', color: '#1565c0' }}
            />
          </Box>

          <TableContainer sx={{ maxHeight: 680 }}>
            <Table stickyHeader size="small" sx={{ borderCollapse: 'separate', minWidth: 1600 }}>
              {/* HEADER TẦNG 1 & TẦNG 2 */}
              <TableHead>
                {/* TẦNG 1: CÁC CỘT CHÍNH VÀ 8 MỐC GIỜ */}
                <TableRow>
                  <TableCell
                    rowSpan={2}
                    sx={{
                      fontWeight: 800,
                      backgroundColor: '#f1f3f4',
                      minWidth: 45,
                      textAlign: 'center',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      borderRight: '1px solid #dcdcdc'
                    }}
                  >
                    STT
                  </TableCell>
                  <TableCell
                    rowSpan={2}
                    sx={{
                      fontWeight: 800,
                      backgroundColor: '#f1f3f4',
                      minWidth: 180,
                      position: 'sticky',
                      left: 45,
                      zIndex: 10,
                      borderRight: '1px solid #dcdcdc'
                    }}
                  >
                    Nhân Viên Kỹ Thuật
                  </TableCell>
                  <TableCell
                    rowSpan={2}
                    sx={{
                      fontWeight: 800,
                      backgroundColor: '#f1f3f4',
                      minWidth: 130,
                      borderRight: '1px solid #dcdcdc'
                    }}
                  >
                    Block
                  </TableCell>
                  <TableCell
                    rowSpan={2}
                    sx={{
                      fontWeight: 800,
                      backgroundColor: '#f1f3f4',
                      minWidth: 130,
                      borderRight: '1px solid #dcdcdc'
                    }}
                  >
                    Đội Trưởng
                  </TableCell>
                  <TableCell
                    rowSpan={2}
                    sx={{
                      fontWeight: 800,
                      backgroundColor: '#e8f0fe',
                      color: '#1a73e8',
                      minWidth: 80,
                      textAlign: 'center',
                      borderRight: '2px solid #b0bec5'
                    }}
                  >
                    Tổng Ca
                  </TableCell>

                  {/* 8 MỐC GIỜ (MỖI MỐC COLSPAN 4: TK XANH, TK ĐỎ, BT XANH, BT ĐỎ) */}
                  {MILESTONES.map((m, idx) => (
                    <TableCell
                      key={m.id}
                      colSpan={4}
                      sx={{
                        fontWeight: 800,
                        backgroundColor: idx % 2 === 0 ? '#f8f9fa' : '#ffffff',
                        color: '#202124',
                        textAlign: 'center',
                        borderRight: '2px solid #b0bec5',
                        borderBottom: '1px solid #e0e0e0',
                        fontSize: '13px'
                      }}
                    >
                      {m.label}
                    </TableCell>
                  ))}
                </TableRow>

                {/* TẦNG 2: TRIỂN KHAI & BẢO TRÌ */}
                <TableRow>
                  {MILESTONES.map((m, idx) => (
                    <React.Fragment key={`${m.id}_sub`}>
                      <TableCell
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#f1f8e9' : '#e8f5e9',
                          color: '#2e7d32',
                          fontWeight: 700,
                          fontSize: '11px',
                          textAlign: 'center',
                          minWidth: 42,
                          borderRight: '1px solid #e0e0e0'
                        }}
                      >
                        {analysisType === 'APPOINTMENT' ? 'TK Xanh (O/J)' : 'TK Xanh'}
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#ffebee' : '#fbe9e7',
                          color: '#c62828',
                          fontWeight: 700,
                          fontSize: '11px',
                          textAlign: 'center',
                          minWidth: 42,
                          borderRight: '1px solid #cfd8dc'
                        }}
                      >
                        {analysisType === 'APPOINTMENT' ? 'TK Đỏ (I)' : 'TK Đỏ'}
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#e0f2f1' : '#e8f5e9',
                          color: '#00695c',
                          fontWeight: 700,
                          fontSize: '11px',
                          textAlign: 'center',
                          minWidth: 42,
                          borderRight: '1px solid #e0e0e0'
                        }}
                      >
                        {analysisType === 'APPOINTMENT' ? 'BT Hẹn (Q/K)' : 'BT Xanh'}
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#fce4ec' : '#ffebee',
                          color: analysisType === 'APPOINTMENT' ? '#0d47a1' : '#880e4f',
                          fontWeight: 700,
                          fontSize: '11px',
                          textAlign: 'center',
                          minWidth: 42,
                          borderRight: '2px solid #b0bec5'
                        }}
                      >
                        {analysisType === 'APPOINTMENT' ? 'Tổng Mốc' : 'BT Đỏ'}
                      </TableCell>
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHead>

              {/* TABLE BODY */}
              <TableBody>
                {filteredEmployees.map((emp, idx) => (
                  <TableRow
                    key={emp.inside_account}
                    hover
                    sx={{
                      '&:nth-of-type(even)': { backgroundColor: '#fafbfc' },
                      '&:hover': { backgroundColor: '#f0f4ff !important' }
                    }}
                  >
                    {/* STT */}
                    <TableCell
                      sx={{
                        textAlign: 'center',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: '#ffffff',
                        fontWeight: 600,
                        borderRight: '1px solid #e0e0e0',
                        fontSize: '12px'
                      }}
                    >
                      {idx + 1}
                    </TableCell>

                    {/* TÊN NHÂN VIÊN */}
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 45,
                        backgroundColor: '#ffffff',
                        borderRight: '1px solid #e0e0e0',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCellClick(emp)}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a73e8', lineHeight: 1.2 }}>
                          {emp.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', mt: 0.3 }}>
                          <Typography variant="caption" sx={{ color: '#5f6368', fontSize: '10.5px' }}>
                            {emp.inside_account}
                          </Typography>
                          {emp.ma_nv && (
                            <Chip label={emp.ma_nv} size="small" sx={{ height: 16, fontSize: '9.5px', borderRadius: '4px' }} />
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* BLOCK */}
                    <TableCell sx={{ fontSize: '11.5px', borderRight: '1px solid #e0e0e0', color: '#3c4043' }}>
                      {emp.block}
                    </TableCell>

                    {/* ĐỘI TRƯỞNG */}
                    <TableCell sx={{ fontSize: '11.5px', borderRight: '1px solid #e0e0e0', color: '#3c4043' }}>
                      {emp.doi_truong}
                    </TableCell>

                    {/* TỔNG CA */}
                    <TableCell
                      sx={{
                        textAlign: 'center',
                        fontWeight: 800,
                        color: '#0d47a1',
                        backgroundColor: '#f5f9ff',
                        borderRight: '2px solid #b0bec5',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                      onClick={() => handleCellClick(emp)}
                    >
                      {emp.total_all}
                    </TableCell>

                    {/* 8 MỐC GIỜ COLUMNS */}
                    {MILESTONES.map((m, mIdx) => {
                      const ms = emp.milestones[m.id] || {};
                      const tkXanh = ms.tk_xanh || 0;
                      const tkDo = ms.tk_do || 0;
                      const btXanh = ms.bt_xanh || 0;
                      const btDo = ms.bt_do || 0;
                      const tongMoc = (tkXanh + tkDo + btDo);

                      if (analysisType === 'APPOINTMENT') {
                        return (
                          <React.Fragment key={`${emp.inside_account}_${m.id}`}>
                            {/* TK XANH (O/J) */}
                            <TableCell
                              sx={{
                                textAlign: 'center',
                                fontWeight: tkXanh > 0 ? 800 : 400,
                                color: tkXanh > 0 ? '#1b5e20' : '#bdbdbd',
                                backgroundColor: tkXanh > 0 ? '#e8f5e9' : 'transparent',
                                cursor: tkXanh > 0 ? 'pointer' : 'default',
                                borderRight: '1px solid #e0e0e0',
                                fontSize: '12px'
                              }}
                              onClick={() => tkXanh > 0 && handleCellClick(emp, m.id, 'TK', 'xanh')}
                            >
                              {tkXanh > 0 ? tkXanh : '-'}
                            </TableCell>

                            {/* TK ĐỎ (I) */}
                            <TableCell
                              sx={{
                                textAlign: 'center',
                                fontWeight: tkDo > 0 ? 800 : 400,
                                color: tkDo > 0 ? '#b71c1c' : '#bdbdbd',
                                backgroundColor: tkDo > 0 ? '#ffebee' : 'transparent',
                                cursor: tkDo > 0 ? 'pointer' : 'default',
                                borderRight: '1px solid #cfd8dc',
                                fontSize: '12px'
                              }}
                              onClick={() => tkDo > 0 && handleCellClick(emp, m.id, 'TK', 'do')}
                            >
                              {tkDo > 0 ? tkDo : '-'}
                            </TableCell>

                            {/* BT HẸN (Q/K) */}
                            <TableCell
                              sx={{
                                textAlign: 'center',
                                fontWeight: btDo > 0 ? 800 : 400,
                                color: btDo > 0 ? '#004d40' : '#bdbdbd',
                                backgroundColor: btDo > 0 ? '#e0f2f1' : 'transparent',
                                cursor: btDo > 0 ? 'pointer' : 'default',
                                borderRight: '1px solid #e0e0e0',
                                fontSize: '12px'
                              }}
                              onClick={() => btDo > 0 && handleCellClick(emp, m.id, 'BT', 'do')}
                            >
                              {btDo > 0 ? btDo : '-'}
                            </TableCell>

                            {/* TỔNG MỐC */}
                            <TableCell
                              sx={{
                                textAlign: 'center',
                                fontWeight: tongMoc > 0 ? 900 : 400,
                                color: tongMoc > 0 ? '#0d47a1' : '#bdbdbd',
                                backgroundColor: tongMoc > 0 ? '#f0f4ff' : 'transparent',
                                cursor: tongMoc > 0 ? 'pointer' : 'default',
                                borderRight: '2px solid #b0bec5',
                                fontSize: '12px'
                              }}
                              onClick={() => tongMoc > 0 && handleCellClick(emp, m.id, null, null)}
                            >
                              {tongMoc > 0 ? tongMoc : '-'}
                            </TableCell>
                          </React.Fragment>
                        );
                      }

                      // COMPLETE_TIME mode:
                      return (
                        <React.Fragment key={`${emp.inside_account}_${m.id}`}>
                          {/* TK XANH */}
                          <TableCell
                            sx={{
                              textAlign: 'center',
                              fontWeight: tkXanh > 0 ? 800 : 400,
                              color: tkXanh > 0 ? '#1b5e20' : '#bdbdbd',
                              backgroundColor: tkXanh > 0 ? '#e8f5e9' : 'transparent',
                              cursor: tkXanh > 0 ? 'pointer' : 'default',
                              borderRight: '1px solid #e0e0e0',
                              fontSize: '12px'
                            }}
                            onClick={() => tkXanh > 0 && handleCellClick(emp, m.id, 'TK', 'xanh')}
                          >
                            {tkXanh > 0 ? tkXanh : '-'}
                          </TableCell>

                          {/* TK ĐỎ */}
                          <TableCell
                            sx={{
                              textAlign: 'center',
                              fontWeight: tkDo > 0 ? 800 : 400,
                              color: tkDo > 0 ? '#b71c1c' : '#bdbdbd',
                              backgroundColor: tkDo > 0 ? '#ffebee' : 'transparent',
                              cursor: tkDo > 0 ? 'pointer' : 'default',
                              borderRight: '1px solid #cfd8dc',
                              fontSize: '12px'
                            }}
                            onClick={() => tkDo > 0 && handleCellClick(emp, m.id, 'TK', 'do')}
                          >
                            {tkDo > 0 ? tkDo : '-'}
                          </TableCell>

                          {/* BT XANH */}
                          <TableCell
                            sx={{
                              textAlign: 'center',
                              fontWeight: btXanh > 0 ? 800 : 400,
                              color: btXanh > 0 ? '#004d40' : '#bdbdbd',
                              backgroundColor: btXanh > 0 ? '#e0f2f1' : 'transparent',
                              cursor: btXanh > 0 ? 'pointer' : 'default',
                              borderRight: '1px solid #e0e0e0',
                              fontSize: '12px'
                            }}
                            onClick={() => btXanh > 0 && handleCellClick(emp, m.id, 'BT', 'xanh')}
                          >
                            {btXanh > 0 ? btXanh : '-'}
                          </TableCell>

                          {/* BT ĐỎ */}
                          <TableCell
                            sx={{
                              textAlign: 'center',
                              fontWeight: btDo > 0 ? 800 : 400,
                              color: btDo > 0 ? '#880e4f' : '#bdbdbd',
                              backgroundColor: btDo > 0 ? '#fce4ec' : 'transparent',
                              cursor: btDo > 0 ? 'pointer' : 'default',
                              borderRight: '2px solid #b0bec5',
                              fontSize: '12px'
                            }}
                            onClick={() => btDo > 0 && handleCellClick(emp, m.id, 'BT', 'do')}
                          >
                            {btDo > 0 ? btDo : '-'}
                          </TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                ))}

                {/* HÀNG TỔNG CỘNG TOÀN CHI NHÁNH */}
                {filteredEmployees.length > 0 && (
                  <TableRow sx={{ backgroundColor: '#e8f0fe', position: 'sticky', bottom: 0, zIndex: 5 }}>
                    <TableCell
                      colSpan={4}
                      sx={{
                        fontWeight: 900,
                        color: '#0d47a1',
                        textAlign: 'right',
                        pr: 3,
                        position: 'sticky',
                        left: 0,
                        backgroundColor: '#e8f0fe',
                        borderRight: '1px solid #90caf9'
                      }}
                    >
                      TỔNG CỘNG TOÀN BỘ:
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 900,
                        color: '#0d47a1',
                        textAlign: 'center',
                        fontSize: '14px',
                        borderRight: '2px solid #64b5f6',
                        backgroundColor: '#d0e1fd'
                      }}
                    >
                      {dynamicMetrics?.total_all || 0}
                    </TableCell>

                    {MILESTONES.map((m) => {
                      const msSum = dynamicMilestoneSummary?.[m.id] || {};
                      const sumTkX = msSum.tk_xanh || 0;
                      const sumTkD = msSum.tk_do || 0;
                      const sumBtX = msSum.bt_xanh || 0;
                      const sumBtD = msSum.bt_do || 0;
                      const sumTongMoc = (sumTkX + sumTkD + sumBtD);

                      if (analysisType === 'APPOINTMENT') {
                        return (
                          <React.Fragment key={`sum_${m.id}`}>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#1b5e20', borderRight: '1px solid #c8e6c9' }}>
                              {sumTkX}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#b71c1c', borderRight: '1px solid #ffcdd2' }}>
                              {sumTkD}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#004d40', borderRight: '1px solid #b2dfdb' }}>
                              {sumBtD}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#0d47a1', borderRight: '2px solid #64b5f6', backgroundColor: '#e3f2fd' }}>
                              {sumTongMoc}
                            </TableCell>
                          </React.Fragment>
                        );
                      }

                      return (
                        <React.Fragment key={`sum_${m.id}`}>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#1b5e20', borderRight: '1px solid #c8e6c9' }}>
                            {sumTkX}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#b71c1c', borderRight: '1px solid #ffcdd2' }}>
                            {sumTkD}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#004d40', borderRight: '1px solid #b2dfdb' }}>
                            {sumBtX}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#880e4f', borderRight: '2px solid #64b5f6' }}>
                            {sumBtD}
                          </TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL CHI TIẾT TỪNG CA HỢP ĐỒNG (CLICK-TO-INSPECT) */}
      {/* ========================================================================= */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1565c0' }}>
              {detailModalTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: '#5f6368' }}>
              Tổng cộng: <strong>{filteredModalRecords.length}</strong> hợp đồng
            </Typography>
          </Box>
          <IconButton onClick={() => setDetailModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          <Box sx={{ mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm theo Số HĐ, Tên KH, Loại GD, Block..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#757575', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 800, backgroundColor: '#f1f3f4' } }}>
                  <TableCell>STT</TableCell>
                  <TableCell>Số HĐ</TableCell>
                  <TableCell>Tên Khách Hàng</TableCell>
                  <TableCell>Loại HĐ</TableCell>
                  <TableCell>Loại Giao Dịch</TableCell>
                  <TableCell>TG Hoàn Tất</TableCell>
                  <TableCell>{analysisType === 'APPOINTMENT' ? 'Mốc Xanh (Cột O / J)' : 'Mốc Hẹn Xanh L1'}</TableCell>
                  <TableCell>{analysisType === 'APPOINTMENT' ? 'Mốc Đỏ / Lịch Hẹn (Cột I / Q / K)' : 'Mốc Hẹn Đỏ L1'}</TableCell>
                  <TableCell>Block</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredModalRecords.map((r, idx) => (
                  <TableRow key={r.id || idx} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0d47a1' }}>
                          {r.so_hd}
                        </Typography>
                        <Tooltip title="Sao chép số HĐ">
                          <IconButton size="small" onClick={() => copyToClipboard(r.so_hd)}>
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.ten_kh || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.type_label}
                        size="small"
                        color={r.type === 'TK' ? 'primary' : 'info'}
                        sx={{ height: 20, fontSize: '10px', fontWeight: 800 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#555' }}>{r.loai_gd}</TableCell>
                    <TableCell sx={{ fontSize: '11.5px', fontWeight: 600 }}>{r.thoi_gian_hoan_tat}</TableCell>
                    <TableCell>
                      {r.moc_hen_xanh ? (
                        <Chip
                          label={`${r.moc_hen_xanh} (${r.slot_xanh})`}
                          size="small"
                          sx={{ backgroundColor: '#e8f5e9', color: '#1b5e20', fontWeight: 700, fontSize: '10px' }}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {r.moc_hen_do ? (
                        <Chip
                          label={`${r.moc_hen_do} (${r.slot_do})`}
                          size="small"
                          sx={{ backgroundColor: '#ffebee', color: '#b71c1c', fontWeight: 700, fontSize: '10px' }}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px' }}>{r.block}</TableCell>
                  </TableRow>
                ))}
                {filteredModalRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 3, color: '#757575' }}>
                      Không có hợp đồng nào phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setDetailModalOpen(false)} sx={{ borderRadius: 2 }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
