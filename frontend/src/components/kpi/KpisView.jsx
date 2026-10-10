import React, { useMemo, useState, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Grid,
  FormLabel,
  TextField,
  MenuItem,
  Button,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  Chip,
  CircularProgress,
  LinearProgress,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Build as MaintenanceIcon,
  Timer as TimerIcon,
  Paid as PaidIcon,
  Percent as PercentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterAlt as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  InfoOutlined as InfoIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  Event as EventIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Public as PublicIcon,
  LocationCity as LocationCityIcon,
  GridView as GridViewIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { DebouncedSearchInput, MultiSelectFilter } from '../common';

const nf = new Intl.NumberFormat('vi-VN');
const cellB = { borderRight: '1px solid #f0f0f0' };
const dvCell = { px: 1, py: 0.5, backgroundColor: '#fffbfe' };

const EmployeeRow = memo(function EmployeeRow({ emp, idx, onOpen }) {
  return (
    <TableRow hover>
      <TableCell align="center" sx={cellB}>{idx + 1}</TableCell>
      <TableCell sx={cellB}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#202124' }}>{emp.name}</Typography>
        <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 600 }}>{emp.account}</Typography>
        <Typography variant="caption" sx={{ color: '#5f6368', ml: 1 }}>({emp.code})</Typography>
      </TableCell>

      <TableCell sx={cellB}>
        {emp.team_lead === 'Chưa xác nhận' ? (
          <Chip label="⚠️ Chưa xác nhận" size="small" sx={{ height: 22, fontSize: '11px', fontWeight: 800, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }} />
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#3c4043' }}>{emp.team_lead}</Typography>
        )}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25, alignItems: 'center' }}>
          {emp.region && <Chip label={emp.region} size="small" sx={{ height: 18, fontSize: '10px', backgroundColor: '#e8f0fe', color: '#1a73e8' }} />}
          {emp.block && <Chip label={emp.block} size="small" sx={{ height: 18, fontSize: '10px', backgroundColor: '#f1f5f9', color: '#475569' }} />}
        </Box>
      </TableCell>

      {/* CHĂM SÓC KHÁCH HÀNG */}
      {/* 1. % Công Nợ */}
      <TableCell align="center" sx={dvCell}>
        {emp.dv_ti_le_da_tt !== null && emp.dv_ti_le_da_tt !== undefined ? (
          <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '12px', color: emp.dv_ti_le_da_tt >= 95 ? '#2e7d32' : '#c62828' }}>
            {emp.dv_ti_le_da_tt.toFixed(2)}%
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: '#bdbdbd', fontSize: '11px' }}>—</Typography>
        )}
      </TableCell>

      {/* 2. RM Kế Hoạch Tháng */}
      <TableCell align="center" sx={dvCell}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#e65100', fontSize: '12px' }}>
          {emp.dv_roi_mang_kh !== null && emp.dv_roi_mang_kh !== undefined
            ? nf.format(emp.dv_roi_mang_kh)
            : <span style={{ color: '#bdbdbd', fontSize: '11px' }}>—</span>}
        </Typography>
      </TableCell>

      {/* 3. Rời Mạng Dự Kiến */}
      <TableCell align="center" sx={dvCell}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#b71c1c', fontSize: '12px' }}>
          {emp.dv_roi_mang_du_kien !== null && emp.dv_roi_mang_du_kien !== undefined
            ? nf.format(emp.dv_roi_mang_du_kien)
            : <span style={{ color: '#bdbdbd', fontSize: '11px' }}>—</span>}
        </Typography>
      </TableCell>

      {/* 4. % RM Hiện Tại */}
      <TableCell align="center" sx={{ ...dvCell, borderRight: '1px solid #f8bbd0' }}>
        {emp.dv_pct_rm_hien_tai !== null && emp.dv_pct_rm_hien_tai !== undefined ? (
          <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '12px', color: emp.dv_pct_rm_hien_tai <= 1.5 ? '#2e7d32' : '#c62828' }}>
            {emp.dv_pct_rm_hien_tai.toFixed(2)}%
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: '#bdbdbd', fontSize: '11px' }}>—</Typography>
        )}
      </TableCell>

      {/* Volume Columns */}
      <TableCell align="center">
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a73e8' }}>
          {emp.tk_kpi_volume || 0}
        </Typography>
        {(emp.tk_gt_72h || 0) > 0 ? (
          <Box sx={{ mt: 0.3 }}>
            <Chip
              label={`>72H: ${emp.tk_gt_72h}`}
              size="small"
              sx={{ height: 18, fontSize: '10px', fontWeight: 800, backgroundColor: '#d32f2f', color: '#ffffff' }}
            />
          </Box>
        ) : (
          <Typography variant="caption" sx={{ display: 'block', fontSize: '10.5px', color: '#9e9e9e', fontWeight: 500, mt: 0.2 }}>
            {`>72H: 0`}
          </Typography>
        )}
      </TableCell>

      <TableCell align="center">
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#00897b' }}>
          {emp.bt_volume || 0}
        </Typography>
        {(emp.bt_gt_24h || 0) > 0 ? (
          <Box sx={{ mt: 0.3 }}>
            <Chip
              label={`>24H: ${emp.bt_gt_24h}`}
              size="small"
              sx={{ height: 18, fontSize: '10px', fontWeight: 800, backgroundColor: '#d32f2f', color: '#ffffff' }}
            />
          </Box>
        ) : (
          <Typography variant="caption" sx={{ display: 'block', fontSize: '10.5px', color: '#9e9e9e', fontWeight: 500, mt: 0.2 }}>
            {`>24H: 0`}
          </Typography>
        )}
      </TableCell>

      <TableCell align="center" sx={{ borderRight: '1px solid #d2e3fc' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#5f6368' }}>
          {emp.tk_swap_volume || 0}
        </Typography>
      </TableCell>

      {/* Progress RT Columns */}
      <TableCell align="center">
        {emp.rt_tk_hours !== null && emp.rt_tk_hours !== undefined && !isNaN(emp.rt_tk_hours) && emp.rt_tk_hours > 72.0 ? (
          <Chip
            label={emp.rt_tk_fmt || '-'}
            size="small"
            sx={{ height: 22, fontSize: '11px', fontWeight: 900, backgroundColor: '#d32f2f', color: '#ffffff', boxShadow: '0 2px 4px rgba(211,47,47,0.4)' }}
          />
        ) : (
          <Typography variant="body2" sx={{
            fontWeight: 800,
            color: (emp.rt_tk_hours !== null && emp.rt_tk_hours !== undefined && !isNaN(emp.rt_tk_hours))
              ? (emp.rt_tk_hours <= 18.0 ? '#2e7d32' : '#d32f2f')
              : '#5f6368'
          }}>
            {emp.rt_tk_fmt || '-'}
          </Typography>
        )}
      </TableCell>

      <TableCell align="center" sx={{ borderRight: '1px solid #ffe0b2' }}>
        {emp.rt_bt_hours !== null && emp.rt_bt_hours !== undefined && !isNaN(emp.rt_bt_hours) && emp.rt_bt_hours > 24.0 ? (
          <Chip
            label={emp.rt_bt_fmt || '-'}
            size="small"
            sx={{ height: 22, fontSize: '11px', fontWeight: 900, backgroundColor: '#d32f2f', color: '#ffffff', boxShadow: '0 2px 4px rgba(211,47,47,0.4)' }}
          />
        ) : (
          <Typography variant="body2" sx={{
            fontWeight: 800,
            color: (emp.rt_bt_hours !== null && emp.rt_bt_hours !== undefined && !isNaN(emp.rt_bt_hours))
              ? (emp.rt_bt_hours <= 8.0 ? '#2e7d32' : '#d32f2f')
              : '#5f6368'
          }}>
            {emp.rt_bt_fmt || '-'}
          </Typography>
        )}
      </TableCell>

      {/* CLL30N Column */}
      <TableCell align="center" sx={{ backgroundColor: '#fcf8fe', borderRight: '1px solid #e1bee7' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: emp.cll30n_status === 'PASS' ? '#2e7d32' : '#d32f2f' }}>
            {emp.cll30n_pct || 0}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#5f6368', fontSize: '10px' }}>
            {emp.kh_cls_count > 0 ? `(${emp.cll30n_count || 0}/${emp.kh_cls_count} HĐ)` : `(${emp.cll30n_count || 0} HĐ)`}
          </Typography>
        </Box>
      </TableCell>

      {/* CLPS 7N BT Column */}
      <TableCell align="center" sx={{ backgroundColor: '#fcf8fe', borderRight: '1px solid #e1bee7' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: emp.clps7n_status === 'PASS' ? '#2e7d32' : '#d32f2f' }}>
            {emp.clps7n_pct || 0}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#5f6368', fontSize: '10px' }}>
            {emp.kh_cls_count > 0 ? `(${emp.clps7n_count || 0}/${emp.kh_cls_count} HĐ)` : `(${emp.clps7n_count || 0} HĐ)`}
          </Typography>
        </Box>
      </TableCell>

      {/* Total Đúng Hẹn Percentage Column */}
      <TableCell align="center" sx={{ backgroundColor: '#f6fbf7' }}>
        <Chip
          label={emp.total_dung_hen_pct >= 97.2 ? `${emp.total_dung_hen_pct || 0}% Đạt` : `${emp.total_dung_hen_pct || 0}% Không Đạt`}
          size="small"
          color={emp.total_dung_hen_pct >= 97.2 ? 'success' : 'error'}
          sx={{ fontWeight: 800, borderRadius: '12px' }}
        />
      </TableCell>

      <TableCell align="center" sx={{ color: emp.tk_dung_hen_pct >= 97.2 ? '#2e7d32' : '#d32f2f', fontWeight: 800 }}>
        {emp.tk_dung_hen_pct || 0}%
      </TableCell>
      <TableCell align="center" sx={{ color: emp.bt_dung_hen_pct >= 97.2 ? '#2e7d32' : '#d32f2f', fontWeight: 800, borderRight: '1px solid #ceead6' }}>
        {emp.bt_dung_hen_pct || 0}%
      </TableCell>

      <TableCell align="center">
        <Button
          size="small"
          variant="outlined"
          onClick={() => onOpen(emp)}
          sx={{ borderRadius: '12px', textTransform: 'none', px: 1.5, fontSize: '11px', fontWeight: 700 }}
        >
          Xem Chi Tiết
        </Button>
      </TableCell>
    </TableRow>
  );
});

function KpisView({
  summary,
  setDetailModalOpen,
  fetchDichVu,
  setBtDetailModalOpen,
  setClps7nDetailModalOpen,
  datePreset,
  setDatePreset,
  handleDatePreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedRegion,
  setSelectedRegion,
  selectedTeamLead,
  setSelectedTeamLead,
  selectedPhuong,
  setSelectedPhuong,
  selectedBlock,
  setSelectedBlock,
  options,
  searchQuery,
  setSearchQuery,
  order,
  orderBy,
  handleRequestSort,
  loading,
  sortedEmployees,
  handleOpenEmployee,
  dichVuData,
  dichVuLoading,
  filteredBlocks = [],
  filteredPhuongs = [],
  error,
}) {
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTeamLead && selectedTeamLead.length > 0) count += selectedTeamLead.length;
    if (selectedRegion && selectedRegion.length > 0) count += 1;
    if (selectedPhuong && selectedPhuong.length > 0) count += selectedPhuong.length;
    if (selectedBlock && selectedBlock.length > 0) count += selectedBlock.length;
    if (searchQuery && searchQuery.trim().length > 0) count += 1;
    if (datePreset !== 'month_to_yesterday') count += 1;
    return count;
  }, [selectedTeamLead, selectedRegion, selectedPhuong, selectedBlock, searchQuery, datePreset]);

  const [visibleCount, setVisibleCount] = useState(50);
  React.useEffect(() => setVisibleCount(50), [sortedEmployees]);

  const dv = useMemo(() => {
    let sTT = 0, nTT = 0, rmKH = 0, rmDK = 0, sRM = 0, nRM = 0;
    const rows = dichVuData || [];
    for (const r of rows) {
      if (r.ti_le_da_tt != null) { sTT += r.ti_le_da_tt; nTT++; }
      if (r.roi_mang_kh != null) rmKH += r.roi_mang_kh;
      if (r.roi_mang_du_kien != null) rmDK += r.roi_mang_du_kien;
      if (r.pct_rm_hien_tai != null) { sRM += r.pct_rm_hien_tai; nRM++; }
    }
    return { count: rows.length, avgTT: nTT ? sTT / nTT : null, rmKH, rmDK, avgRM: nRM ? sRM / nRM : null };
  }, [dichVuData]);

  const regionValue = useMemo(
    () => (selectedRegion ? (Array.isArray(selectedRegion) ? selectedRegion : selectedRegion.split('|').filter(Boolean)) : []),
    [selectedRegion]
  );
  const teamLeadOptions = useMemo(() => options.team_leads || [], [options.team_leads]);
  const regionOptions = useMemo(() => options.regions || [], [options.regions]);

  const handleResetAllFilters = () => {
    handleDatePreset('month_to_yesterday');
    setSelectedTeamLead([]);
    setSelectedRegion('');
    setSelectedPhuong([]);
    setSelectedBlock([]);
    setSearchQuery('');
  };

  return (
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* OVERALL KPI METRIC CARDS ROW - FULL WIDTH GRID */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 2, width: '100%' }}>
                  
                  {/* Card 1: Triển khai */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #d2e3fc', borderLeft: '6px solid #1a73e8', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#1a73e8', fontWeight: 800 }}>
                          TRIỂN KHAI (TK)
                        </Typography>
                        <AssignmentIcon sx={{ color: '#1a73e8', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a73e8', letterSpacing: '-1px' }}>
                        {summary.tk_total_volume ?? ((summary.tk_volume_kpi || 0) + (summary.tk_swap_volume || 0) + (summary.tk_gsafe_volume || 0))}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.5 }}>
                        Tính KPI: <strong>{summary.tk_volume_kpi || 0}</strong> (✅ {summary.tk_dung_hen_1 || 0} | ❌ {summary.tk_dung_hen_0 || 0})
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                        <Chip
                          label={`🔥 >72H: ${summary.tk_gt_72h || 0} phiếu`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '11px',
                            height: 22,
                            backgroundColor: (summary.tk_gt_72h || 0) > 0 ? '#d32f2f' : '#f5f5f5',
                            color: (summary.tk_gt_72h || 0) > 0 ? '#ffffff' : '#616161'
                          }}
                        />
                        {(summary.tk_swap_volume || 0) > 0 && (
                          <Chip
                            label={`Swap: ${summary.tk_swap_volume}`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '11px',
                              height: 22,
                              backgroundColor: '#f3e8ff',
                              color: '#7c3aed',
                              border: '1px solid #d8b4fe'
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 700, display: 'block', mt: 0.8 }}>
                        Đúng hẹn TK: {summary.tk_dung_hen_pct || 0}%
                      </Typography>

                      <Button
                        size="small"
                        startIcon={<InfoIcon sx={{ fontSize: '15px !important' }} />}
                        onClick={() => setDetailModalOpen(true)}
                        sx={{
                          mt: 1,
                          p: 0,
                          textTransform: 'none',
                          fontWeight: 700,
                          color: '#1a73e8',
                          fontSize: '12px',
                          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                        }}
                      >
                        Chi tiết loại giao dịch
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Card 2: Bảo trì */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #b2dfdb', borderLeft: '6px solid #00897b', backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#00897b', fontWeight: 800 }}>
                          BẢO TRÌ (BT)
                        </Typography>
                        <MaintenanceIcon sx={{ color: '#00897b', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#00897b', letterSpacing: '-1px' }}>
                        {summary.bt_volume || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.5 }}>
                        ✅ Đúng: <strong>{summary.bt_dung_hen_1 || 0}</strong> | ❌ Trễ: <strong>{summary.bt_dung_hen_0 || 0}</strong>
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={`⚠️ >24H: ${summary.bt_gt_24h || 0} phiếu`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '11px',
                            height: 22,
                            backgroundColor: (summary.bt_gt_24h || 0) > 0 ? '#d32f2f' : '#f5f5f5',
                            color: (summary.bt_gt_24h || 0) > 0 ? '#ffffff' : '#616161'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#00897b', fontWeight: 700, display: 'block', mt: 0.8 }}>
                        Đúng hẹn BT: {summary.bt_dung_hen_pct || 0}%
                      </Typography>

                      <Button
                        size="small"
                        startIcon={<InfoIcon sx={{ fontSize: '15px !important' }} />}
                        onClick={() => setBtDetailModalOpen(true)}
                        sx={{
                          mt: 1,
                          p: 0,
                          textTransform: 'none',
                          fontWeight: 700,
                          color: '#00897b',
                          fontSize: '12px',
                          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                        }}
                      >
                        Chi tiết loại phiếu bảo trì
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Card 3: RT-TK */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #d2e3fc', borderLeft: `6px solid ${summary.rt_tk_status === 'PASS' ? '#2e7d32' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#1967d2', fontWeight: 800 }}>
                          {"RT-TK (<= 18H)"}
                        </Typography>
                        <TimerIcon sx={{ color: summary.rt_tk_status === 'PASS' ? '#2e7d32' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.rt_tk_status === 'PASS' ? '#2e7d32' : '#d32f2f', letterSpacing: '-1px' }}>
                        {summary.rt_tk_fmt || '-'}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={summary.rt_tk_status === 'PASS' ? "ĐẠT (<= 18H)" : "KHÔNG ĐẠT (> 18H)"}
                          size="small"
                          color={summary.rt_tk_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Card 4: RT-BT */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #ffe0b2', borderLeft: `6px solid ${summary.rt_bt_status === 'PASS' ? '#2e7d32' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#e65100', fontWeight: 800 }}>
                          {"RT-BT (<= 8H)"}
                        </Typography>
                        <TimerIcon sx={{ color: summary.rt_bt_status === 'PASS' ? '#2e7d32' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.rt_bt_status === 'PASS' ? '#2e7d32' : '#d32f2f', letterSpacing: '-1px' }}>
                        {summary.rt_bt_fmt || '-'}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={summary.rt_bt_status === 'PASS' ? "ĐẠT (<= 8H)" : "KHÔNG ĐẠT (> 8H)"}
                          size="small"
                          color={summary.rt_bt_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Card 5: CLL30N */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${summary.cll30n_status === 'PASS' ? '#e1bee7' : '#ffcdd2'}`, borderLeft: `6px solid ${summary.cll30n_status === 'PASS' ? '#7b1fa2' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#7b1fa2', fontWeight: 800 }}>
                          {"CLL30N (<= 7%)"}
                        </Typography>
                        <TrendingUpIcon sx={{ color: summary.cll30n_status === 'PASS' ? '#7b1fa2' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.cll30n_status === 'PASS' ? '#7b1fa2' : '#d32f2f', letterSpacing: '-1px' }}>
                        {`${summary.cll30n_pct || 0}%`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.2 }}>
                        {`HĐ: ${summary.cll30n_count || 0} / ${summary.kh_cls_count || summary.cll30n_count || 0}`}
                      </Typography>
                      <Box sx={{ mt: 0.8 }}>
                        <Chip
                          label={summary.cll30n_status === 'PASS' ? "ĐẠT (<= 7%)" : "KHÔNG ĐẠT (> 7%)"}
                          size="small"
                          color={summary.cll30n_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Card 6: CLPS 7N BT */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${summary.clps7n_status === 'PASS' ? '#e1bee7' : '#ffcdd2'}`, borderLeft: `6px solid ${summary.clps7n_status === 'PASS' ? '#7b1fa2' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: '#7b1fa2', fontWeight: 800 }}>
                          {"CLPS 7N BT (<= 3%)"}
                        </Typography>
                        <TrendingUpIcon sx={{ color: summary.clps7n_status === 'PASS' ? '#7b1fa2' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.clps7n_status === 'PASS' ? '#7b1fa2' : '#d32f2f', letterSpacing: '-1px' }}>
                        {`${summary.clps7n_pct || 0}%`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.2 }}>
                        {`HĐ: ${summary.clps7n_count || 0} / ${summary.kh_cls_count || summary.cll30n_count || 0}`}
                      </Typography>
                      <Box sx={{ mt: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Chip
                          label={summary.clps7n_status === 'PASS' ? "ĐẠT (<= 3%)" : "KHÔNG ĐẠT (> 3%)"}
                          size="small"
                          color={summary.clps7n_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                        <Button
                          size="small"
                          startIcon={<InfoIcon sx={{ fontSize: '14px !important' }} />}
                          onClick={() => setClps7nDetailModalOpen(true)}
                          sx={{
                            p: 0,
                            textTransform: 'none',
                            fontWeight: 700,
                            color: '#7b1fa2',
                            fontSize: '11px',
                            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                          }}
                        >
                          Chi tiết
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Card 6: TỔNG ĐÚNG HẸN */}
                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${summary.dung_hen_status === 'PASS' ? '#c8e6c9' : '#ffcdd2'}`, borderLeft: `6px solid ${summary.dung_hen_status === 'PASS' ? '#2e7d32' : '#d32f2f'}`, backgroundColor: '#ffffff', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="overline" sx={{ color: summary.dung_hen_status === 'PASS' ? '#1b5e20' : '#b71c1c', fontWeight: 800 }}>
                          TỔNG ĐÚNG HẸN
                        </Typography>
                        <CheckCircleIcon sx={{ color: summary.dung_hen_status === 'PASS' ? '#2e7d32' : '#d32f2f', fontSize: 22 }} />
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: summary.dung_hen_status === 'PASS' ? '#1b5e20' : '#b71c1c', letterSpacing: '-1px' }}>
                        {summary.total_dung_hen_pct || 0}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500, display: 'block', mt: 0.2 }}>
                        Tổng Khối Lượng: {summary.total_work_volume || 0} Phiếu
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 600, display: 'block', mt: 0.2 }}>
                        🔥 TK &gt;72H: <strong style={{ color: (summary.tk_gt_72h || 0) > 0 ? '#d32f2f' : 'inherit' }}>{summary.tk_gt_72h || 0}</strong> | ⚠️ BT &gt;24H: <strong style={{ color: (summary.bt_gt_24h || 0) > 0 ? '#d32f2f' : 'inherit' }}>{summary.bt_gt_24h || 0}</strong>
                      </Typography>
                      <Box sx={{ mt: 0.8 }}>
                        <Chip
                          label={summary.dung_hen_status === 'PASS' ? "ĐẠT (>= 97.2%)" : "KHÔNG ĐẠT (< 97.2%)"}
                          size="small"
                          color={summary.dung_hen_status === 'PASS' ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                </Box>

                {/* ========================================================================= */}
                {/* CHĂM SÓC KHÁCH HÀNG SECTION                                               */}
                {/* ========================================================================= */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Section Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 5, height: 28, borderRadius: 2, backgroundColor: '#0277bd' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#01579b', letterSpacing: '0.5px' }}>
                        📡 CHĂM SÓC KHÁCH HÀNG
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500 }}>
                        (Công nợ & Rời mạng — từ Sheet theo dõi dịch vụ)
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={fetchDichVu}
                      disabled={dichVuLoading}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '12px', color: '#0277bd', borderColor: '#0277bd' }}
                    >
                      {dichVuLoading ? '⏳ Đang tải...' : '🔄 Cập nhật'}
                    </Button>
                  </Box>

                  {/* 4 Metric Cards */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    {/* Card: % Công Nợ */}
                    <Card elevation={0} sx={{ borderRadius: 3, backgroundColor: '#ffffff', height: '100%', border: `1px solid ${dv.avgTT !== null && dv.avgTT >= 95 ? '#c8e6c9' : '#ffccbc'}`, borderLeft: `6px solid ${dv.avgTT !== null && dv.avgTT >= 95 ? '#2e7d32' : '#bf360c'}` }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="overline" sx={{ color: '#0288d1', fontWeight: 800, fontSize: '10px' }}>
                            % CÔNG NỢ (J)
                          </Typography>
                          <PaidIcon sx={{ color: dv.avgTT !== null && dv.avgTT >= 95 ? '#2e7d32' : '#bf360c', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: dv.avgTT !== null && dv.avgTT >= 95 ? '#1b5e20' : '#bf360c', letterSpacing: '-0.5px' }}>
                          {dichVuLoading ? '...' : dv.avgTT !== null ? `${dv.avgTT.toFixed(2)}%` : '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                          Trung bình % công nợ
                        </Typography>
                        <Chip
                          label={dv.avgTT !== null ? (dv.avgTT >= 95 ? 'ĐẠT (≥ 95%)' : 'CHƯA ĐẠT (< 95%)') : 'Chưa có dữ liệu'}
                          size="small"
                          color={dv.avgTT !== null && dv.avgTT >= 95 ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '10px', height: 20, mt: 0.8 }}
                        />
                      </CardContent>
                    </Card>

                    {/* Card: RM Kế Hoạch Tháng */}
                    <Card elevation={0} sx={{ borderRadius: 3, backgroundColor: '#ffffff', height: '100%', border: '1px solid #fff9c4', borderLeft: '6px solid #f9a825' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="overline" sx={{ color: '#f57f17', fontWeight: 800, fontSize: '10px' }}>
                            RM KẾ HOẠCH THÁNG (M)
                          </Typography>
                          <TrendingDownIcon sx={{ color: '#f9a825', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#e65100', letterSpacing: '-0.5px' }}>
                          {dichVuLoading ? '...' : dv.count > 0 ? nf.format(dv.rmKH) : '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                          Tổng RM kế hoạch tháng
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Card: Rời Mạng Dự Kiến */}
                    <Card elevation={0} sx={{ borderRadius: 3, backgroundColor: '#ffffff', height: '100%', border: '1px solid #fce4ec', borderLeft: '6px solid #c62828' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="overline" sx={{ color: '#c62828', fontWeight: 800, fontSize: '10px' }}>
                            RỜI MẠNG DỰ KIẾN (T)
                          </Typography>
                          <TrendingDownIcon sx={{ color: '#c62828', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#b71c1c', letterSpacing: '-0.5px' }}>
                          {dichVuLoading ? '...' : dv.count > 0 ? nf.format(dv.rmDK) : '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                          Tổng rời mạng dự kiến
                        </Typography>
                        {dv.count > 0 && dv.rmKH > 0 && (
                          <Typography variant="caption" sx={{ color: dv.rmDK > dv.rmKH ? '#d32f2f' : '#2e7d32', fontWeight: 700, display: 'block', mt: 0.3 }}>
                            {dv.rmDK > dv.rmKH ? `⬆️ Vượt KH: +${nf.format(dv.rmDK - dv.rmKH)}` : `✅ Trong KH: ${nf.format(dv.rmKH - dv.rmDK)} buffer`}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>

                    {/* Card: % RM Hiện Tại */}
                    <Card elevation={0} sx={{ borderRadius: 3, backgroundColor: '#ffffff', height: '100%', border: `1px solid ${dv.avgRM !== null && dv.avgRM <= 1.5 ? '#c8e6c9' : '#ffccbc'}`, borderLeft: `6px solid ${dv.avgRM !== null && dv.avgRM <= 1.5 ? '#2e7d32' : '#d32f2f'}` }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="overline" sx={{ color: '#0288d1', fontWeight: 800, fontSize: '10px' }}>
                            % RM HIỆN TẠI (U)
                          </Typography>
                          <PercentIcon sx={{ color: dv.avgRM !== null && dv.avgRM <= 1.5 ? '#2e7d32' : '#d32f2f', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: dv.avgRM !== null && dv.avgRM <= 1.5 ? '#1b5e20' : '#b71c1c', letterSpacing: '-0.5px' }}>
                          {dichVuLoading ? '...' : dv.avgRM !== null ? `${dv.avgRM.toFixed(2)}%` : '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                          Trung bình % RM hiện tại
                        </Typography>
                        <Chip
                          label={dv.avgRM !== null ? (dv.avgRM <= 1.5 ? 'ĐẠT (≤ 1.5%)' : 'CHƯA ĐẠT (> 1.5%)') : 'Chưa có dữ liệu'}
                          size="small"
                          color={dv.avgRM !== null && dv.avgRM <= 1.5 ? 'success' : 'error'}
                          sx={{ fontWeight: 800, fontSize: '10px', height: 20, mt: 0.8 }}
                        />
                      </CardContent>
                    </Card>
                  </Box>

                  {!dichVuData && !dichVuLoading && (
                    <Box sx={{ textAlign: 'center', py: 2, color: '#9e9e9e' }}>
                      <Typography variant="body2">Chưa có dữ liệu Chăm Sóc Khách Hàng. Nhấn "Cập nhật" để tải.</Typography>
                    </Box>
                  )}
                </Box>

                {/* FILTER BAR PANEL */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 3,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2.2,
                  }}
                >
                  {/* Top Bar: Lọc Nhanh & Đặt lại bộ lọc */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1.5,
                      pb: 1.5,
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    {/* Left: Quick Date Presets */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 800,
                          color: '#1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.6,
                          fontSize: '13px',
                          mr: 0.5,
                        }}
                      >
                        <FilterIcon sx={{ fontSize: 18, color: '#1a73e8' }} /> Lọc Nhanh:
                      </Typography>

                      {[
                        { key: 'month_to_yesterday', label: 'Đầu tháng -> Hôm qua (Mặc định)' },
                        { key: 'all', label: 'Tất cả' },
                        { key: 'today', label: 'Hôm nay' },
                        { key: 'yesterday', label: 'Hôm qua' },
                        { key: 'week', label: '7 Ngày qua' },
                      ].map((btn) => (
                        <Button
                          key={btn.key}
                          size="small"
                          variant={datePreset === btn.key ? 'contained' : 'outlined'}
                          color="primary"
                          onClick={() => handleDatePreset(btn.key)}
                          sx={{
                            borderRadius: '20px',
                            px: 1.8,
                            py: 0.4,
                            fontSize: '12px',
                            textTransform: 'none',
                            fontWeight: datePreset === btn.key ? 700 : 500,
                            boxShadow: datePreset === btn.key ? '0 2px 6px rgba(26,115,232,0.3)' : 'none',
                          }}
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </Box>

                    {/* Right: Trạng thái & Nút Đặt lại tất cả */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {activeFilterCount > 0 && (
                        <Chip
                          label={`Đang lọc: ${activeFilterCount} mục`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '11px', height: 24, borderRadius: '6px' }}
                        />
                      )}
                      <Button
                        size="small"
                        variant="text"
                        color="secondary"
                        startIcon={<ResetIcon sx={{ fontSize: '16px !important' }} />}
                        onClick={handleResetAllFilters}
                        sx={{
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: '8px',
                          color: '#64748b',
                          px: 1.2,
                          py: 0.4,
                          '&:hover': {
                            color: '#d93025',
                            backgroundColor: '#fef2f2',
                          },
                        }}
                      >
                        Đặt lại mặc định
                      </Button>
                    </Box>
                  </Box>

                  {/* Tier 1: Khoảng Thời Gian & Tìm Kiếm */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '220px 220px 1fr',
                      },
                      gap: 2,
                      alignItems: 'flex-end',
                    }}
                  >
                    {/* Từ Ngày */}
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: '#1a73e8' }} />
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                          Từ Ngày (TG Hoàn tất)
                        </Typography>
                      </Box>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setDatePreset('custom');
                        }}
                        sx={{
                          '& .MuiInputBase-root': {
                            height: 40,
                            borderRadius: '10px',
                            backgroundColor: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            border: '1px solid #d1d5db',
                            '&:hover': { borderColor: '#1a73e8' },
                            '&.Mui-focused': { borderColor: '#1a73e8', boxShadow: '0 0 0 2px rgba(26,115,232,0.15)' },
                          },
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        }}
                      />
                    </Box>

                    {/* Đến Ngày */}
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6 }}>
                        <EventIcon sx={{ fontSize: 16, color: '#1a73e8' }} />
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                          Đến Ngày (TG Hoàn tất)
                        </Typography>
                      </Box>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setDatePreset('custom');
                        }}
                        sx={{
                          '& .MuiInputBase-root': {
                            height: 40,
                            borderRadius: '10px',
                            backgroundColor: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            border: '1px solid #d1d5db',
                            '&:hover': { borderColor: '#1a73e8' },
                            '&.Mui-focused': { borderColor: '#1a73e8', boxShadow: '0 0 0 2px rgba(26,115,232,0.15)' },
                          },
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        }}
                      />
                    </Box>

                    {/* Tìm Kiếm Inside Acc / NV */}
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6 }}>
                        <SearchIcon sx={{ fontSize: 16, color: '#1a73e8' }} />
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                          Tìm Kiếm Nhân Viên / Inside Acc
                        </Typography>
                      </Box>
                      <DebouncedSearchInput
                        fullWidth
                        size="small"
                        placeholder="Nhập tên nhân viên, mã NV hoặc account..."
                        value={searchQuery}
                        onChange={(val) => setSearchQuery(val)}
                        sx={{
                          '& .MuiInputBase-root': {
                            height: 40,
                            borderRadius: '10px',
                            backgroundColor: '#ffffff',
                            fontSize: '13px',
                            border: searchQuery ? '1.5px solid #1a73e8' : '1px solid #d1d5db',
                            '&:hover': { borderColor: '#1a73e8' },
                            '&.Mui-focused': { borderColor: '#1a73e8', boxShadow: '0 0 0 2px rgba(26,115,232,0.15)' },
                          },
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                            </InputAdornment>
                          ),
                          endAdornment: searchQuery ? (
                            <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.3, mr: 0.2 }}>
                              <ClearIcon sx={{ fontSize: 16, color: '#94a3b8', '&:hover': { color: '#ef4444' } }} />
                            </IconButton>
                          ) : null,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Tier 2: Phân Cấp Quản Lý Địa Bàn (4 cột đều nhau 100%!) */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: 'repeat(4, 1fr)',
                      },
                      gap: 2,
                    }}
                  >
                    {/* Cột 1: Đội Trưởng */}
                    <MultiSelectFilter
                      label="Lọc Theo Đội Trưởng"
                      icon={<SupervisorAccountIcon sx={{ fontSize: 16 }} />}
                      options={teamLeadOptions}
                      value={selectedTeamLead}
                      onChange={(arr) => {
                        setSelectedTeamLead(arr);
                        // Reset phường và block khi đổi đội trưởng để tránh lệch dữ liệu
                        setSelectedPhuong([]);
                        setSelectedBlock([]);
                      }}
                      placeholder="-- Tất cả Đội Trưởng --"
                      unit="đội trưởng"
                    />

                    {/* Cột 2: Vùng */}
                    <MultiSelectFilter
                      label="Lọc Theo Vùng"
                      icon={<PublicIcon sx={{ fontSize: 16 }} />}
                      options={regionOptions}
                      value={regionValue}
                      onChange={(arr) => {
                        setSelectedRegion(Array.isArray(arr) ? arr.join('|') : (arr || ''));
                      }}
                      placeholder="-- Tất cả Vùng --"
                      unit="vùng"
                    />

                    {/* Cột 3: Phường */}
                    <MultiSelectFilter
                      label="Lọc Theo Phường"
                      icon={<LocationCityIcon sx={{ fontSize: 16 }} />}
                      options={filteredPhuongs || []}
                      value={selectedPhuong}
                      onChange={(arr) => {
                        setSelectedPhuong(arr);
                        setSelectedBlock([]);
                      }}
                      placeholder={`-- Tất cả Phường ${selectedTeamLead.length ? `(${filteredPhuongs.length})` : ''} --`}
                      unit="phường"
                    />

                    {/* Cột 4: Block */}
                    <MultiSelectFilter
                      label="Lọc Theo Block"
                      icon={<GridViewIcon sx={{ fontSize: 16 }} />}
                      options={filteredBlocks || []}
                      value={selectedBlock}
                      onChange={(arr) => {
                        setSelectedBlock(arr);
                      }}
                      placeholder={`-- Tất cả Block ${selectedTeamLead.length || selectedPhuong.length ? `(${filteredBlocks.length})` : ''} --`}
                      unit="block"
                    />
                  </Box>
                </Paper>


                {/* MAIN DATATABLE PAPER */}
                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <Box sx={{ p: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#202124', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <span>BẢNG KPI CHI TIẾT THEO NHÂN VIÊN</span>
                      <Chip label={`${sortedEmployees.length} Nhân viên`} size="small" color="primary" sx={{ fontWeight: 700, borderRadius: '12px' }} />
                    </Typography>
                  </Box>

                  {loading && sortedEmployees.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
                  ) : error ? (
                    <Box sx={{ p: 5, textAlign: 'center', color: '#d93025' }}><Typography variant="h6">{error}</Typography></Box>
                  ) : (
                    <Box sx={{ position: 'relative' }}>
                      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }} />}
                      <TableContainer sx={{ maxHeight: 720, opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}>
                      <Table stickyHeader size="medium">
                        <TableHead>
                          <TableRow sx={{ height: '38px' }}>
                            <TableCell rowSpan={2} sx={{ top: 0, zIndex: 12, verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderRight: '1px solid #e0e0e0', borderBottom: '2px solid #cbd5e1', width: 60, textAlign: 'center' }}>
                              STT
                            </TableCell>
                            
                            <TableCell rowSpan={2} sx={{ top: 0, zIndex: 12, verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderRight: '1px solid #e0e0e0', borderBottom: '2px solid #cbd5e1', minWidth: 200 }}>
                              <TableSortLabel
                                active={orderBy === 'name' || orderBy === 'account'}
                                direction={orderBy === 'name' || orderBy === 'account' ? order : 'asc'}
                                onClick={() => handleRequestSort('account')}
                              >
                                Nhân Viên (Inside Acc)
                              </TableSortLabel>
                            </TableCell>

                            <TableCell rowSpan={2} sx={{ top: 0, zIndex: 12, verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderRight: '1px solid #e0e0e0', borderBottom: '2px solid #cbd5e1', minWidth: 170 }}>
                              <TableSortLabel
                                active={orderBy === 'team_lead'}
                                direction={orderBy === 'team_lead' ? order : 'asc'}
                                onClick={() => handleRequestSort('team_lead')}
                              >
                                Đội Trưởng / Vùng / Block
                              </TableSortLabel>
                            </TableCell>

                            {/* CHĂM SÓC KHÁCH HÀNG (4 cột: % Công Nợ, RM KH Tháng, RM Dự Kiến, % RM Hiện Tại) */}
                            <TableCell colSpan={4} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#fce4ec', color: '#c62828', borderRight: '1px solid #f8bbd0', borderBottom: '1px solid #f8bbd0', fontSize: '13px' }}>
                              CHĂM SÓC KHÁCH HÀNG
                            </TableCell>

                            <TableCell colSpan={3} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#e8f0fe', color: '#1a73e8', borderRight: '1px solid #d2e3fc', borderBottom: '1px solid #d2e3fc', fontSize: '13px' }}>
                              KHỐI LƯỢNG CÔNG VIỆC
                            </TableCell>

                            <TableCell colSpan={2} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#fff3e0', color: '#e65100', borderRight: '1px solid #ffe0b2', borderBottom: '1px solid #ffe0b2', fontSize: '13px' }}>
                              TIẾN ĐỘ (RT)
                            </TableCell>

                            <TableCell colSpan={2} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#f3e5f5', color: '#7b1fa2', borderRight: '1px solid #e1bee7', borderBottom: '1px solid #e1bee7', fontSize: '13px' }}>
                              CHẤT LƯỢNG (CLL)
                            </TableCell>

                            <TableCell colSpan={3} align="center" sx={{ top: 0, zIndex: 11, height: '38px', py: '6px', boxSizing: 'border-box', fontWeight: 800, backgroundColor: '#e6f4ea', color: '#1e8e3e', borderRight: '1px solid #ceead6', borderBottom: '1px solid #ceead6', fontSize: '13px' }}>
                              CAM KẾT TIẾN ĐỘ
                            </TableCell>

                            <TableCell rowSpan={2} align="center" sx={{ top: 0, zIndex: 12, verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f1f3f4', color: '#3c4043', borderBottom: '2px solid #cbd5e1', width: 100 }}>
                              Thao Tác
                            </TableCell>
                          </TableRow>

                          <TableRow sx={{ height: '44px' }}>
                            {/* CHĂM SÓC KHÁCH HÀNG - 4 sub-columns */}
                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff5f8', color: '#c2185b', px: 1, minWidth: 80 }}>
                              <TableSortLabel
                                active={orderBy === 'dv_ti_le_da_tt'}
                                direction={orderBy === 'dv_ti_le_da_tt' ? order : 'asc'}
                                onClick={() => handleRequestSort('dv_ti_le_da_tt')}
                              >
                                % Công Nợ
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff5f8', color: '#c2185b', px: 1, minWidth: 85 }}>
                              <TableSortLabel
                                active={orderBy === 'dv_roi_mang_kh'}
                                direction={orderBy === 'dv_roi_mang_kh' ? order : 'asc'}
                                onClick={() => handleRequestSort('dv_roi_mang_kh')}
                              >
                                RM Kế Hoạch Tháng
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff5f8', color: '#c2185b', px: 1, minWidth: 85 }}>
                              <TableSortLabel
                                active={orderBy === 'dv_roi_mang_du_kien'}
                                direction={orderBy === 'dv_roi_mang_du_kien' ? order : 'asc'}
                                onClick={() => handleRequestSort('dv_roi_mang_du_kien')}
                              >
                                Rời Mạng Dự Kiến
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff5f8', color: '#c2185b', px: 1, minWidth: 80, borderRight: '1px solid #f8bbd0' }}>
                              <TableSortLabel
                                active={orderBy === 'dv_pct_rm_hien_tai'}
                                direction={orderBy === 'dv_pct_rm_hien_tai' ? order : 'asc'}
                                onClick={() => handleRequestSort('dv_pct_rm_hien_tai')}
                              >
                                % RM Hiện Tại
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#f4f8fe', color: '#1a73e8' }}>
                              <TableSortLabel
                                active={orderBy === 'tk_kpi_volume'}
                                direction={orderBy === 'tk_kpi_volume' ? order : 'asc'}
                                onClick={() => handleRequestSort('tk_kpi_volume')}
                              >
                                Triển Khai (KPI)
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#f4f8fe', color: '#1a73e8' }}>
                              <TableSortLabel
                                active={orderBy === 'bt_volume'}
                                direction={orderBy === 'bt_volume' ? order : 'asc'}
                                onClick={() => handleRequestSort('bt_volume')}
                              >
                                Bảo Trì
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#f4f8fe', color: '#1a73e8', borderRight: '1px solid #d2e3fc' }}>
                              <TableSortLabel
                                active={orderBy === 'tk_swap_volume'}
                                direction={orderBy === 'tk_swap_volume' ? order : 'asc'}
                                onClick={() => handleRequestSort('tk_swap_volume')}
                              >
                                Swap
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff8e1', color: '#b06000' }}>
                              <TableSortLabel
                                active={orderBy === 'rt_tk_hours'}
                                direction={orderBy === 'rt_tk_hours' ? order : 'asc'}
                                onClick={() => handleRequestSort('rt_tk_hours')}
                              >
                                {"RT-TK (<=18H)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#fff8e1', color: '#b06000', borderRight: '1px solid #ffe0b2' }}>
                              <TableSortLabel
                                active={orderBy === 'rt_bt_hours'}
                                direction={orderBy === 'rt_bt_hours' ? order : 'asc'}
                                onClick={() => handleRequestSort('rt_bt_hours')}
                              >
                                {"RT-BT (<=8H)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 800, backgroundColor: '#f3e5f5', color: '#7b1fa2', borderRight: '1px solid #e1bee7' }}>
                              <TableSortLabel
                                active={orderBy === 'cll30n_pct'}
                                direction={orderBy === 'cll30n_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('cll30n_pct')}
                              >
                                {"CLL30N (%) (<=7%)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 800, backgroundColor: '#f3e5f5', color: '#7b1fa2', borderRight: '1px solid #e1bee7' }}>
                              <TableSortLabel
                                active={orderBy === 'clps7n_pct'}
                                direction={orderBy === 'clps7n_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('clps7n_pct')}
                              >
                                {"CLPS 7N BT (%) (<=3%)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 800, backgroundColor: '#e6f4ea', color: '#1e8e3e' }}>
                              <TableSortLabel
                                active={orderBy === 'total_dung_hen_pct'}
                                direction={orderBy === 'total_dung_hen_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('total_dung_hen_pct')}
                              >
                                {"TỔNG ĐÚNG HẸN (>=97.2%)"}
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#e6f4ea', color: '#1e8e3e' }}>
                              <TableSortLabel
                                active={orderBy === 'tk_dung_hen_pct'}
                                direction={orderBy === 'tk_dung_hen_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('tk_dung_hen_pct')}
                              >
                                Đúng Hẹn TK (%)
                              </TableSortLabel>
                            </TableCell>

                            <TableCell align="center" sx={{ top: '38px !important', zIndex: 11, borderBottom: '2px solid #cbd5e1', fontWeight: 700, backgroundColor: '#e6f4ea', color: '#1e8e3e', borderRight: '1px solid #ceead6' }}>
                              <TableSortLabel
                                active={orderBy === 'bt_dung_hen_pct'}
                                direction={orderBy === 'bt_dung_hen_pct' ? order : 'asc'}
                                onClick={() => handleRequestSort('bt_dung_hen_pct')}
                              >
                                Đúng Hẹn BT (%)
                              </TableSortLabel>
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody sx={{ '& tr:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
                          {sortedEmployees.slice(0, visibleCount).map((emp, idx) => (
                            <EmployeeRow key={emp.account} emp={emp} idx={idx} onOpen={handleOpenEmployee} />
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {visibleCount < sortedEmployees.length && (
                      <Box sx={{ textAlign: 'center', py: 1.5 }}>
                        <Button onClick={() => setVisibleCount(c => c + 100)}>
                          Xem thêm ({sortedEmployees.length - visibleCount} nhân viên)
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>

            </Box>
  );
}

export default React.memo(KpisView);
