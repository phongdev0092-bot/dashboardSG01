import React from 'react';
import {
  Box,
  Paper,
  Grid,
  FormLabel,
  TextField,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { AddLichTrucRowModal } from '../modals/AddLichTrucRowModal';

export const LichTrucChiTietView = ({
  isEditable = false,
  importInputRef,
  handleImportCsvFile,
  ltCtMonth,
  setLtCtMonth,
  ltCtYear,
  setLtCtYear,
  ltCtDoiTruong,
  setLtCtDoiTruong,
  options,
  fetchLichTrucChiTiet,
  sortBlockEnabled,
  setSortBlockEnabled,
  addRowOpen,
  setAddRowOpen,
  handleAddRowSubmit,
  handleExportLichTrucCSV,
  ltCtData,
  editingRowNumber,
  editingRowValues,
  setEditingRowValues,
  handleStartEditRow,
  handleCancelEditRow,
  handleSaveEditRow,
  handleDeleteRow
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* HIDDEN CSV INPUT */}
      {isEditable && (
        <input
          type="file"
          accept=".csv"
          ref={importInputRef}
          style={{ display: 'none' }}
          onChange={handleImportCsvFile}
        />
      )}

      {/* TOOLBAR */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3} md={isEditable ? 1.5 : 2}>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Tháng</FormLabel>
            <TextField select fullWidth size="small" value={ltCtMonth} onChange={(e) => setLtCtMonth(Number(e.target.value))}>
              <MenuItem value={0}>Tất cả</MenuItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3} md={isEditable ? 1.5 : 2}>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Năm</FormLabel>
            <TextField select fullWidth size="small" value={ltCtYear} onChange={(e) => setLtCtYear(Number(e.target.value))}>
              <MenuItem value={0}>Tất cả</MenuItem>
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={isEditable ? 2.5 : 3}>
            <FormLabel sx={{ fontSize: '12px', fontWeight: 700, color: '#3c4043', display: 'block', mb: 0.5 }}>Đội Trưởng</FormLabel>
            <TextField select fullWidth size="small" value={ltCtDoiTruong} onChange={(e) => setLtCtDoiTruong(e.target.value)}>
              <MenuItem value="__ALL__">-- Tất cả --</MenuItem>
              {(options?.team_leads || []).map((tl) => (
                <MenuItem key={tl} value={tl}>{tl}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3} md={1.2}>
            <Button variant="contained" color="primary" fullWidth onClick={fetchLichTrucChiTiet} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5 }}>
              Lọc
            </Button>
          </Grid>

          <Grid item xs={12} sm={4} md={isEditable ? 1.8 : 2}>
            <Button variant="outlined" color="primary" fullWidth onClick={() => setSortBlockEnabled(!sortBlockEnabled)} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5, fontSize: '12px' }}>
              🔤 Sort Block: {sortBlockEnabled ? 'Bật' : 'Tắt'}
            </Button>
          </Grid>

          {isEditable && (
            <Grid item xs={12} sm={4} md={1.2}>
              <Button variant="contained" color="info" fullWidth onClick={() => setAddRowOpen(true)} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5 }}>
                ➕ Thêm
              </Button>
            </Grid>
          )}

          {isEditable && (
            <Grid item xs={12} sm={4} md={1.2}>
              <Button variant="outlined" color="secondary" fullWidth onClick={() => importInputRef?.current && importInputRef.current.click()} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5 }}>
                📥 Import
              </Button>
            </Grid>
          )}

          <Grid item xs={12} sm={4} md={isEditable ? 1.6 : 1.8}>
            <Button variant="contained" color="success" fullWidth onClick={handleExportLichTrucCSV} startIcon={<DownloadIcon />} sx={{ borderRadius: 2, height: 40, fontWeight: 700, mt: 2.5, backgroundColor: '#1e8e3e' }}>
              Xuất CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* STICKY DATA TABLE FOR 31 DAYS */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
        <TableContainer sx={{ maxHeight: 680 }}>
          <Table stickyHeader size="small">
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, zIndex: 4, backgroundColor: '#f1f5f9', minWidth: 100 }}>CodeStaff</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 100, zIndex: 4, backgroundColor: '#f1f5f9', minWidth: 150 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 250, zIndex: 4, backgroundColor: '#f1f5f9', minWidth: 130 }}>Partner</TableCell>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 380, zIndex: 4, backgroundColor: '#f1f5f9', minWidth: 180, boxShadow: '2px 0 5px rgba(0,0,0,0.08)' }}>Block</TableCell>
                
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <TableCell key={d} align="center" sx={{ fontWeight: 700, minWidth: 45, px: 0.5 }}>
                    Day{d}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Đội Trưởng</TableCell>
                {isEditable && <TableCell align="center" sx={{ fontWeight: 700, minWidth: 120 }}>Thao Tác</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {ltCtData?.data
                ?.slice()
                .sort((a, b) => {
                  if (!sortBlockEnabled) return 0;
                  const blockA = String(a.values[3] || '');
                  const blockB = String(b.values[3] || '');
                  return blockA.localeCompare(blockB, 'vi', { numeric: true, sensitivity: 'base' });
                })
                .map((rowObj) => {
                  const isEditing = isEditable && editingRowNumber === rowObj.row;

                  return (
                    <TableRow key={rowObj.row} hover sx={{ backgroundColor: isEditing ? '#eff6ff' : 'inherit' }}>
                      
                      {/* CodeStaff */}
                      <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, backgroundColor: isEditing ? '#eff6ff' : '#ffffff', zIndex: 2 }}>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editingRowValues[0] || ''}
                            onChange={(e) => {
                              const copy = [...editingRowValues];
                              copy[0] = e.target.value;
                              setEditingRowValues(copy);
                            }}
                            sx={{ width: 90 }}
                          />
                        ) : rowObj.values[0]}
                      </TableCell>

                      {/* Name */}
                      <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 100, backgroundColor: isEditing ? '#eff6ff' : '#ffffff', zIndex: 2 }}>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editingRowValues[1] || ''}
                            onChange={(e) => {
                              const copy = [...editingRowValues];
                              copy[1] = e.target.value;
                              setEditingRowValues(copy);
                            }}
                            sx={{ width: 140 }}
                          />
                        ) : rowObj.values[1]}
                      </TableCell>

                      {/* Partner */}
                      <TableCell sx={{ color: '#5f6368', position: 'sticky', left: 250, backgroundColor: isEditing ? '#eff6ff' : '#ffffff', zIndex: 2 }}>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editingRowValues[2] || ''}
                            onChange={(e) => {
                              const copy = [...editingRowValues];
                              copy[2] = e.target.value;
                              setEditingRowValues(copy);
                            }}
                            sx={{ width: 120 }}
                          />
                        ) : rowObj.values[2]}
                      </TableCell>

                      {/* Block */}
                      <TableCell sx={{ fontWeight: 700, color: '#1a73e8', position: 'sticky', left: 380, backgroundColor: isEditing ? '#eff6ff' : '#ffffff', zIndex: 2, boxShadow: '2px 0 5px rgba(0,0,0,0.08)' }}>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editingRowValues[3] || ''}
                            onChange={(e) => {
                              const copy = [...editingRowValues];
                              copy[3] = e.target.value;
                              setEditingRowValues(copy);
                            }}
                            sx={{ width: 160 }}
                          />
                        ) : rowObj.values[3]}
                      </TableCell>
                      
                      {/* Day1..Day31 */}
                      {(isEditing ? editingRowValues.slice(4, 35) : rowObj.values.slice(4, 35)).map((shiftVal, sIdx) => {
                        const isCa1 = String(shiftVal).toUpperCase() === 'CA1';
                        return (
                          <TableCell key={sIdx} align="center" sx={{ px: 0.3 }}>
                            {isEditing ? (
                              <TextField
                                select
                                size="small"
                                value={String(shiftVal).toUpperCase() === 'CA1' ? 'CA1' : 'O'}
                                onChange={(e) => {
                                  const copy = [...editingRowValues];
                                  copy[4 + sIdx] = e.target.value;
                                  setEditingRowValues(copy);
                                }}
                                sx={{ width: 55, '& .MuiSelect-select': { py: 0.3, px: 0.5, fontSize: '11px' } }}
                              >
                                <MenuItem value="CA1">Ca1</MenuItem>
                                <MenuItem value="O">O</MenuItem>
                              </TextField>
                            ) : (
                              <Chip
                                label={isCa1 ? 'Ca1' : 'O'}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  backgroundColor: isCa1 ? '#dcfce7' : '#f3f4f6',
                                  color: isCa1 ? '#16a34a' : '#6b7280',
                                  borderRadius: '6px'
                                }}
                              />
                            )}
                          </TableCell>
                        );
                      })}
                      
                      {/* Đội Trưởng */}
                      <TableCell sx={{ fontWeight: 600 }}>{rowObj.doiTruong}</TableCell>

                      {/* Thao tác CRUD */}
                      {isEditable && (
                        <TableCell align="center">
                          {isEditing ? (
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Button size="small" variant="contained" color="primary" onClick={handleSaveEditRow} sx={{ minWidth: 40, px: 1, py: 0.2, fontSize: '11px', fontWeight: 700 }}>
                                💾
                              </Button>
                              <Button size="small" variant="outlined" onClick={handleCancelEditRow} sx={{ minWidth: 40, px: 1, py: 0.2, fontSize: '11px' }}>
                                ❌
                              </Button>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Button size="small" variant="outlined" color="primary" onClick={() => handleStartEditRow(rowObj)} sx={{ minWidth: 40, px: 1, py: 0.2, fontSize: '11px', fontWeight: 700 }}>
                                ✏️
                              </Button>
                              <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteRow(rowObj.row)} sx={{ minWidth: 40, px: 1, py: 0.2, fontSize: '11px' }}>
                                🗑️
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {isEditable && (<AddLichTrucRowModal open={addRowOpen} onClose={() => setAddRowOpen(false)} onSubmit={handleAddRowSubmit} />)}
    </Box>
  );
};

export default LichTrucChiTietView;
