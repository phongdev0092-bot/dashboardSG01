import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const EmployeeDrawer = ({
  open,
  onClose,
  selectedEmployee,
  activeTab,
  setActiveTab,
  loadingDetails,
  empDetails
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', md: 950 }, p: 3 } }}
    >
      {selectedEmployee && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#202124' }}>
                {selectedEmployee.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#5f6368' }}>
                Account: <strong>{selectedEmployee.account}</strong> | Mã NV: <strong>{selectedEmployee.code}</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mt: 0.5 }}>
                Đội Trưởng: {selectedEmployee.team_lead} | Vùng: {selectedEmployee.region}
              </Typography>
            </Box>
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Triển Khai (TK) (${empDetails?.tk_tickets?.length || 0})`} />
            <Tab label={`Bảo Trì (BT) (${empDetails?.bt_tickets?.length || 0})`} />
            <Tab label={`CLL30N (Ca Lặp) (${empDetails?.cll_tickets?.length || 0})`} />
            <Tab label={`CLPS 7N BT (${empDetails?.clps7n_tickets?.length || empDetails?.cll_tickets?.filter(t => t.is_clps_7n_bt)?.length || 0})`} />
          </Tabs>

          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : activeTab === 0 ? (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Gói / Loại Giao Dịch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TG Tạo / Hoàn Tất</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>RT</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Đúng Hẹn</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empDetails?.tk_tickets?.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {t.contract_no}
                        {t.is_gsafe && <Chip label="Gsafe" size="small" color="error" sx={{ ml: 1, height: 18, fontSize: '10px' }} />}
                        {t.is_swap && <Chip label="Swap" size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: '10px' }} />}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{t.service_package}</Typography>
                        <Typography variant="caption" sx={{ color: '#5f6368' }}>{t.tx_type}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block' }}>Tạo: {t.dt_created}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>Xong: {t.dt_complete}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          const rtNum = t.rt_hours ?? (t.rt_fmt ? parseFloat(String(t.rt_fmt).replace('H', '')) : 0);
                          const isOver72 = rtNum > 72.0;
                          return (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 800,
                                color: isOver72 ? '#ffffff' : (rtNum > 18.0 ? '#d32f2f' : '#1a73e8'),
                                backgroundColor: isOver72 ? '#d32f2f' : 'transparent',
                                px: isOver72 ? 1 : 0,
                                py: isOver72 ? 0.3 : 0,
                                borderRadius: isOver72 ? '6px' : 0,
                                display: 'inline-block',
                                boxShadow: isOver72 ? '0 2px 4px rgba(211,47,47,0.3)' : 'none'
                              }}
                            >
                              {t.rt_fmt || '-'}
                            </Typography>
                          );
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        {t.dung_hen === 1 ? (
                          <Chip label="Đúng" size="small" color="success" sx={{ height: 20 }} />
                        ) : (
                          <Chip label="Trễ" size="small" color="error" sx={{ height: 20 }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : activeTab === 1 ? (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TG Tạo / Hoàn Tất</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>RT</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Đúng Hẹn</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empDetails?.bt_tickets?.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{t.contract_no}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{t.customer_name}</Typography>
                        {t.tx_type && <Typography variant="caption" sx={{ color: '#00897b', display: 'block' }}>{t.tx_type}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block' }}>Tạo: {t.dt_created}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>Xong: {t.dt_complete}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          const rtNum = t.rt_hours ?? (t.rt_fmt ? parseFloat(String(t.rt_fmt).replace('H', '')) : 0);
                          const isOver24 = rtNum > 24.0;
                          return (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 800,
                                color: isOver24 ? '#ffffff' : (rtNum > 8.0 ? '#d32f2f' : '#00897b'),
                                backgroundColor: isOver24 ? '#d32f2f' : 'transparent',
                                px: isOver24 ? 1 : 0,
                                py: isOver24 ? 0.3 : 0,
                                borderRadius: isOver24 ? '6px' : 0,
                                display: 'inline-block',
                                boxShadow: isOver24 ? '0 2px 4px rgba(211,47,47,0.3)' : 'none'
                              }}
                            >
                              {t.rt_fmt || '-'}
                            </Typography>
                          );
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        {t.dung_hen === 1 ? (
                          <Chip label="Đúng" size="small" color="success" sx={{ height: 20 }} />
                        ) : (
                          <Chip label="Trễ" size="small" color="error" sx={{ height: 20 }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : activeTab === 2 ? (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TG Hoàn Tất CLPS</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tình Trạng Đầu Vào</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hướng Xử Lý</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empDetails?.cll_tickets?.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {t.contract_no}
                        {t.is_clps_7n_bt && <Chip label="CLPS 7N BT" size="small" sx={{ ml: 1, height: 18, fontSize: '10px', backgroundColor: '#f3e5f5', color: '#7b1fa2', fontWeight: 700 }} />}
                      </TableCell>
                      <TableCell>{t.customer_name || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.dt_complete || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{t.tinh_trang_dau_vao || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#1a73e8', fontWeight: 500 }}>{t.huong_xu_ly || '-'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!empDetails?.cll_tickets || empDetails.cll_tickets.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#5f6368' }}>
                        Không có ca lặp CLL30N trong khoảng thời gian này
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Số HĐ</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Khách Hàng</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TG Hoàn Tất CLPS</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tình Trạng Đầu Vào</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hướng Xử Lý</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(empDetails?.clps7n_tickets || empDetails?.cll_tickets?.filter(t => t.is_clps_7n_bt))?.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: '#5f6368' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {t.contract_no}
                        <Chip label="CLPS 7N BT" size="small" sx={{ ml: 1, height: 18, fontSize: '10px', backgroundColor: '#f3e5f5', color: '#7b1fa2', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>{t.customer_name || '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.dt_complete || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{t.tinh_trang_dau_vao || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#7b1fa2', fontWeight: 500 }}>{t.huong_xu_ly || '-'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!empDetails?.clps7n_tickets?.length && !empDetails?.cll_tickets?.some(t => t.is_clps_7n_bt)) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#5f6368' }}>
                        Không có phiếu CLPS 7N BT trong khoảng thời gian này
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default EmployeeDrawer;
