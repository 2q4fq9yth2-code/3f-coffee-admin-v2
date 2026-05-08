import request from './request'

export const dashboardApi = {
  // 获取工作台统计数据
  getStats: (params) => request.get('/stats/dashboard', { params }),
  // 获取今日订单概览
  getTodayOverview: () => request.get('/stats/today'),
  // 获取销售趋势（近7天）
  getSalesTrend: () => request.get('/stats/sales-trend'),
}

export const ordersApi = {
  list: (params) => request.get('/orders', { params }),
  detail: (id) => request.get(`/orders/${id}`),
  updateStatus: (id, data) => request.put(`/orders/${id}/status`, data),
  cancel: (id) => request.post(`/orders/${id}/cancel`),
  // 打印小票
  printReceipt: (id) => request.post(`/orders/${id}/print`),
}

export const productsApi = {
  list: (params) => request.get('/products', { params }),
  detail: (id) => request.get(`/products/${id}`),
  create: (data) => request.post('/products', data),
  update: (id, data) => request.put(`/products/${id}`, data),
  delete: (id) => request.delete(`/products/${id}`),
  // 批量更新库存
  batchUpdateStock: (data) => request.post('/products/batch-stock', data),
}

export const membersApi = {
  list: (params) => request.get('/members', { params }),
  detail: (id) => request.get(`/members/${id}`),
  update: (id, data) => request.put(`/members/${id}`, data),
  recharge: (id, data) => request.post(`/members/${id}/recharge`, data),
  getRechargeHistory: (id, params) => request.get(`/members/${id}/recharge-history`, { params }),
}

export const financeApi = {
  overview: (params) => request.get('/finance/overview', { params }),
  dailyReport: (params) => request.get('/finance/daily', { params }),
  monthlyReport: (params) => request.get('/finance/monthly', { params }),
  paymentStats: (params) => request.get('/finance/payments', { params }),
}

export const inventoryApi = {
  list: (params) => request.get('/inventory', { params }),
  update: (id, data) => request.put(`/inventory/${id}`, data),
  alertList: () => request.get('/inventory/alerts'),
  restock: (data) => request.post('/inventory/restock', data),
}

export const couponsApi = {
  list: (params) => request.get('/coupons', { params }),
  detail: (id) => request.get(`/coupons/${id}`),
  create: (data) => request.post('/coupons', data),
  update: (id, data) => request.put(`/coupons/${id}`, data),
  publish: (id) => request.post(`/coupons/${id}/publish`),
  disable: (id) => request.post(`/coupons/${id}/disable`),
}

export const tablesApi = {
  list: () => request.get('/tables'),
  detail: (id) => request.get(`/tables/${id}`),
  create: (data) => request.post('/tables', data),
  update: (id, data) => request.put(`/tables/${id}`, data),
  generateQR: (id) => request.get(`/tables/${id}/qr`),
}

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  logout: () => request.post('/auth/logout'),
  currentUser: () => request.get('/auth/current'),
}
