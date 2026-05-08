<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <div class="page-title">订单管理</div>
        <div class="page-subtitle">共 {{ total }} 个订单</div>
      </div>
      <div class="header-actions">
        <el-button @click="exportOrders">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="card-section filter-bar">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input
            v-model="filters.keyword"
            placeholder="订单号 / 手机号 / 备注"
            clearable
            prefix-icon="Search"
            @clear="loadOrders"
            @keyup.enter="loadOrders"
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.status" placeholder="订单状态" clearable @change="loadOrders">
            <el-option label="全部状态" value="" />
            <el-option label="待付款" value="pending" />
            <el-option label="已付款" value="paid" />
            <el-option label="制作中" value="preparing" />
            <el-option label="待取餐" value="ready" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadOrders"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="loadOrders">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 订单列表 -->
    <div class="card-section orders-list">
      <el-table
        v-loading="loading"
        :data="orders"
        @row-click="openDetail"
        row-class-name="order-row"
        stripe
      >
        <el-table-column label="订单信息" min-width="200">
          <template #default="{ row }">
            <div class="order-info">
              <div class="order-no">#{{ row.orderNo || row._id?.slice(-8).toUpperCase() }}</div>
              <div class="order-time">{{ row.createTime || row.date || '—' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="order-products">
              <div
                v-for="(item, idx) in (row.items || []).slice(0, 2)"
                :key="idx"
                class="product-item"
              >
                <span>{{ item.name || item.productName || '商品' }}</span>
                <span class="qty">x{{ item.quantity || 1 }}</span>
              </div>
              <div v-if="(row.items?.length || 0) > 2" class="more-items">
                还有 {{ row.items.length - 2 }} 件
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="顾客" width="130">
          <template #default="{ row }">
            <div class="customer-info">
              <div>{{ row.phone || row.nickname || row.userName || '散客' }}</div>
              <div class="member-tag" v-if="row.memberId">
                <el-icon><Star /></el-icon> 会员
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            <div class="amount-text">
              <span class="amount">¥{{ row.total || row.amount || 0 }}</span>
              <div class="pay-method" v-if="row.payMethod">{{ row.payMethod }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === '堂食' ? 'primary' : 'success'" plain>
              {{ row.type || row.orderType || '小程序' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="['order-status', row.status]">
              {{ statusMap[row.status] || row.status || '未知' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="action-btns" @click.stop>
              <el-button size="small" text type="primary" @click="openDetail(row)">
                详情
              </el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, row)">
                <el-button size="small" text type="primary">
                  操作 <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="print" v-if="row.status !== 'pending'">
                      <el-icon><Printer /></el-icon> 打印小票
                    </el-dropdown-item>
                    <el-dropdown-item command="update" v-if="row.status !== 'completed' && row.status !== 'cancelled' && row.status !== 'refunded'">
                      <el-icon><Edit /></el-icon> 修改状态
                    </el-dropdown-item>
                    <el-dropdown-item command="cancel" v-if="row.status === 'pending' || row.status === 'paid'" divided>
                      <el-icon><Close /></el-icon> 取消订单
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadOrders"
        @current-change="loadOrders"
      />
    </div>

    <!-- 订单详情抽屉 -->
    <el-drawer
      v-model="detailVisible"
      title="订单详情"
      :size="440"
      direction="rtl"
    >
      <div v-if="currentOrder" class="order-detail">
        <div class="detail-section">
          <h4 class="detail-title">基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">订单号</span>
              <span class="value">#{{ currentOrder.orderNo || currentOrder._id?.slice(-8).toUpperCase() }}</span>
            </div>
            <div class="detail-item">
              <span class="label">订单状态</span>
              <span :class="['order-status', currentOrder.status]">
                {{ statusMap[currentOrder.status] || currentOrder.status }}
              </span>
            </div>
            <div class="detail-item">
              <span class="label">下单时间</span>
              <span class="value">{{ currentOrder.createTime || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">订单类型</span>
              <span class="value">{{ currentOrder.type || currentOrder.orderType || '小程序' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-title">顾客信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">顾客</span>
              <span class="value">{{ currentOrder.phone || currentOrder.nickname || currentOrder.userName || '散客' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">备注</span>
              <span class="value remark">{{ currentOrder.note || currentOrder.remark || '无' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-title">商品清单</h4>
          <div class="product-list">
            <div
              v-for="(item, idx) in (currentOrder.items || [])"
              :key="idx"
              class="product-row"
            >
              <span class="p-name">{{ item.name || item.productName || '商品' }}</span>
              <span class="p-spec" v-if="item.spec">规格：{{ item.spec }}</span>
              <span class="p-price">¥{{ item.price || 0 }}</span>
              <span class="p-qty">x{{ item.quantity || 1 }}</span>
              <span class="p-subtotal">¥{{ ((item.price || 0) * (item.quantity || 1)).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-title">费用明细</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">商品合计</span>
              <span class="value">¥{{ currentOrder.subtotal || (currentOrder.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0).toFixed(2) }}</span>
            </div>
            <div class="detail-item" v-if="currentOrder.discount">
              <span class="label">优惠</span>
              <span class="value amount negative">-¥{{ currentOrder.discount }}</span>
            </div>
            <div class="detail-item total">
              <span class="label">实付金额</span>
              <span class="value amount positive">¥{{ currentOrder.total || currentOrder.amount || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="label">支付方式</span>
              <span class="value">{{ currentOrder.payMethod || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-actions" v-if="currentOrder.status !== 'completed' && currentOrder.status !== 'cancelled' && currentOrder.status !== 'refunded'">
          <el-button
            v-if="currentOrder.status === 'pending'"
            type="primary"
            @click="handleAction('update', currentOrder, 'paid')"
          >
            确认收款
          </el-button>
          <el-button
            v-if="currentOrder.status === 'paid'"
            type="primary"
            @click="handleAction('update', currentOrder, 'preparing')"
          >
            开始制作
          </el-button>
          <el-button
            v-if="currentOrder.status === 'preparing'"
            type="primary"
            @click="handleAction('update', currentOrder, 'ready')"
          >
            完成制作
          </el-button>
          <el-button
            v-if="currentOrder.status === 'ready'"
            type="success"
            @click="handleAction('update', currentOrder, 'completed')"
          >
            完成取餐
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 状态更新对话框 -->
    <el-dialog v-model="statusDialogVisible" title="修改订单状态" width="400">
      <el-form label-width="80">
        <el-form-item label="新状态">
          <el-select v-model="newStatus" style="width: 100%">
            <el-option label="待付款" value="pending" />
            <el-option label="已付款" value="paid" />
            <el-option label="制作中" value="preparing" />
            <el-option label="待取餐" value="ready" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStatusChange">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ordersApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'

const route = useRoute()
const loading = ref(false)
const orders = ref([])
const total = ref(0)
const detailVisible = ref(false)
const currentOrder = ref(null)
const statusDialogVisible = ref(false)
const newStatus = ref('')

const statusMap = {
  pending: '待付款',
  paid: '已付款',
  preparing: '制作中',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
}

const filters = reactive({
  keyword: '',
  status: (route.query.status) || '',
  dateRange: [],
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
})

async function loadOrders() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
    }
    if (filters.status) params.status = filters.status
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.dateRange?.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }

    const res = await ordersApi.list(params)
    const data = res.data?.list || res.data || res || []
    orders.value = Array.isArray(data) ? data : []
    total.value = res.data?.total || orders.value.length
  } catch (err) {
    console.error('加载订单失败', err)
    orders.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.dateRange = []
  pagination.page = 1
  loadOrders()
}

function openDetail(row) {
  currentOrder.value = row
  detailVisible.value = true
}

async function handleAction(cmd, row, directStatus) {
  if (cmd === 'print') {
    try {
      await ordersApi.printReceipt(row._id || row.orderNo)
      ElMessage.success('正在打印...')
    } catch (err) {
      ElMessage.error('打印失败')
    }
  } else if (cmd === 'update') {
    currentOrder.value = row
    newStatus.value = directStatus || 'paid'
    statusDialogVisible.value = true
  } else if (cmd === 'cancel') {
    ElMessageBox.confirm('确定要取消此订单吗？', '提示', {
      confirmButtonText: '确定取消',
      cancelButtonText: '否',
      type: 'warning',
    }).then(async () => {
      try {
        await ordersApi.cancel(row._id || row.orderNo)
        ElMessage.success('订单已取消')
        loadOrders()
      } catch (err) {
        ElMessage.error('取消失败')
      }
    }).catch(() => {})
  }
}

async function confirmStatusChange() {
  if (!currentOrder.value || !newStatus.value) return
  try {
    await ordersApi.updateStatus(currentOrder.value._id || currentOrder.value.orderNo, {
      status: newStatus.value,
    })
    ElMessage.success('状态已更新')
    statusDialogVisible.value = false
    loadOrders()
    detailVisible.value = false
  } catch (err) {
    ElMessage.error('更新失败')
  }
}

function exportOrders() {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  loadOrders()
})
</script>

<style lang="scss" scoped>
.filter-bar {
  margin-bottom: 0;
  :deep(.el-col) { margin-bottom: 12px; }
}

.orders-list {
  :deep(.order-row) { cursor: pointer; }
}

.order-info {
  .order-no {
    font-weight: 600;
    color: var(--color-text);
    font-size: 13px;
  }
  .order-time {
    font-size: 12px;
    color: var(--color-text-light);
    margin-top: 2px;
  }
}

.order-products {
  .product-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-text);
    line-height: 1.6;
    .qty { color: var(--color-text-light); font-size: 12px; }
  }
  .more-items {
    font-size: 12px;
    color: var(--color-primary);
  }
}

.customer-info {
  .member-tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    color: var(--color-primary);
    margin-top: 2px;
  }
}

.pay-method {
  font-size: 11px;
  color: var(--color-text-light);
  margin-top: 2px;
}

.action-btns {
  display: flex;
  gap: 4px;
  align-items: center;
}

// 详情抽屉
.order-detail {
  padding: 0 4px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  &.total {
    grid-column: 1 / -1;
    background: var(--color-primary-light);
    padding: 12px;
    border-radius: var(--radius-sm);
    .value { font-size: 18px; }
  }

  .label {
    font-size: 12px;
    color: var(--color-text-light);
    display: block;
    margin-bottom: 4px;
  }

  .value {
    font-size: 14px;
    color: var(--color-text);
    font-weight: 500;

    &.remark {
      font-size: 13px;
      color: var(--color-text-secondary);
    }
  }
}

.product-list {
  .product-row {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 8px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border-light);
    font-size: 13px;

    &:last-child { border-bottom: none; }

    .p-name { font-weight: 500; }
    .p-spec { font-size: 11px; color: var(--color-text-light); }
    .p-price { color: var(--color-text-secondary); }
    .p-qty { color: var(--color-text-light); }
    .p-subtotal { font-weight: 600; color: var(--color-text); }
  }
}

.detail-actions {
  display: flex;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
</style>
