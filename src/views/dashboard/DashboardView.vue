<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <div class="page-title">工作台</div>
        <div class="page-subtitle">{{ today }} · 加油，今天又是美好的一天</div>
      </div>
      <el-button type="primary" @click="$router.push('/pos')">
        <el-icon><Shop /></el-icon>
        快速开单
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon primary">💰</div>
        <div class="stat-info">
          <div class="stat-value">¥{{ stats.todayRevenue || 0 }}</div>
          <div class="stat-label">今日营收</div>
          <div class="stat-trend" :class="stats.revenueTrend > 0 ? 'up' : 'down'">
            {{ stats.revenueTrend > 0 ? '↑' : '↓' }}
            {{ Math.abs(stats.revenueTrend || 0) }}% 较昨日
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon success">📋</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayOrders || 0 }}</div>
          <div class="stat-label">今日订单</div>
          <div class="stat-trend" :class="stats.ordersTrend > 0 ? 'up' : 'down'">
            {{ stats.ordersTrend > 0 ? '↑' : '↓' }}
            {{ Math.abs(stats.ordersTrend || 0) }}% 较昨日
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon warning">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayCustomers || 0 }}</div>
          <div class="stat-label">今日顾客</div>
          <div class="stat-trend up" v-if="(stats.customerTrend || 0) > 0">
            ↑ {{ stats.customerTrend }}% 新客率
          </div>
          <div class="stat-trend" v-else>—</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon info">🎯</div>
        <div class="stat-info">
          <div class="stat-value">¥{{ stats.avgOrderValue || 0 }}</div>
          <div class="stat-label">平均客单价</div>
          <div class="stat-trend" :class="stats.avgTrend > 0 ? 'up' : 'down'">
            {{ stats.avgTrend > 0 ? '↑' : '↓' }}
            {{ Math.abs(stats.avgTrend || 0) }}% 较昨日
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="dashboard-grid">
      <!-- 销售趋势图 -->
      <div class="card-section chart-card">
        <div class="card-header">
          <span class="card-title">销售趋势（近7天）</span>
          <el-radio-group v-model="chartPeriod" size="small">
            <el-radio-button label="7天" />
            <el-radio-button label="30天" />
          </el-radio-group>
        </div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>

      <!-- 订单分布图 -->
      <div class="card-section pie-card">
        <div class="card-header">
          <span class="card-title">订单状态分布</span>
        </div>
        <div ref="pieChartRef" class="chart-container pie"></div>
      </div>
    </div>

    <!-- 底部区 -->
    <div class="dashboard-bottom">
      <!-- 待处理事项 -->
      <div class="card-section todo-card">
        <div class="card-header">
          <span class="card-title">待处理</span>
        </div>
        <div class="todo-list">
          <div
            class="todo-item"
            @click="$router.push('/orders?status=pending')"
          >
            <div class="todo-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="todo-info">
              <div class="todo-count">{{ pendingOrders }}</div>
              <div class="todo-label">待付款订单</div>
            </div>
          </div>

          <div class="todo-item" @click="$router.push('/inventory?alert=true')">
            <div class="todo-icon danger">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="todo-info">
              <div class="todo-count">{{ lowStockItems }}</div>
              <div class="todo-label">库存不足商品</div>
            </div>
          </div>

          <div class="todo-item" @click="$router.push('/orders?status=ready')">
            <div class="todo-icon success">
              <el-icon><Bell /></el-icon>
            </div>
            <div class="todo-info">
              <div class="todo-count">{{ readyOrders }}</div>
              <div class="todo-label">待取餐订单</div>
            </div>
          </div>

          <div class="todo-item" @click="$router.push('/orders?status=preparing')">
            <div class="todo-icon info">
              <el-icon><Cooking /></el-icon>
            </div>
            <div class="todo-info">
              <div class="todo-count">{{ preparingOrders }}</div>
              <div class="todo-label">制作中订单</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新订单 -->
      <div class="card-section recent-orders">
        <div class="card-header">
          <span class="card-title">最新订单</span>
          <el-button text type="primary" @click="$router.push('/orders')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <el-table :data="recentOrders" size="small" :show-header="true">
          <el-table-column label="订单号" prop="orderNo" width="160" />
          <el-table-column label="商品" prop="items" min-width="140">
            <template #default="{ row }">
              <span class="order-items">{{ row.itemsText || row.items?.join(', ') || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="total" width="90">
            <template #default="{ row }">
              <span class="amount">¥{{ row.total }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" prop="status" width="100">
            <template #default="{ row }">
              <span :class="['order-status', row.status]">
                {{ statusMap[row.status] || row.status }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="时间" prop="createTime" min-width="150">
            <template #default="{ row }">
              {{ row.createTime || row.createTimeStr || '—' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { ordersApi } from '@/api'

const today = dayjs().format('YYYY年MM月DD日 dddd')
const chartPeriod = ref('7天')

// 统计数据
const stats = ref({
  todayRevenue: 0,
  todayOrders: 0,
  todayCustomers: 0,
  avgOrderValue: 0,
  revenueTrend: 0,
  ordersTrend: 0,
  customerTrend: 0,
  avgTrend: 0,
})

const pendingOrders = ref(0)
const readyOrders = ref(0)
const preparingOrders = ref(0)
const lowStockItems = ref(0)
const recentOrders = ref([])

const trendChartRef = ref()
const pieChartRef = ref()
let trendChart = null
let pieChart = null

const statusMap = {
  pending: '待付款',
  paid: '已付款',
  preparing: '制作中',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
}

async function loadDashboard() {
  try {
    // 加载统计数据
    const statsRes = await ordersApi.list({ date: dayjs().format('YYYY-MM-DD'), limit: 7 })
    const list = statsRes.data?.list || statsRes.data || []
    
    // 计算今日数据
    const todayStr = dayjs().format('YYYY-MM-DD')
    const todayOrders = list.filter(o => (o.date || o.createTime || '').startsWith(todayStr))
    
    stats.value.todayOrders = todayOrders.length
    stats.value.todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    stats.value.avgOrderValue = stats.value.todayOrders > 0
      ? (stats.value.todayRevenue / stats.value.todayOrders).toFixed(2)
      : 0
    stats.value.todayCustomers = new Set(todayOrders.map(o => o.openid)).size

    // 加载最新订单
    const recentRes = await ordersApi.list({ limit: 10 })
    recentOrders.value = (recentRes.data?.list || recentRes.data || recentRes || []).slice(0, 8)

    // 模拟待处理数据
    pendingOrders.value = recentOrders.value.filter(o => o.status === 'pending').length
    readyOrders.value = recentOrders.value.filter(o => o.status === 'ready').length
    preparingOrders.value = recentOrders.value.filter(o => o.status === 'preparing').length
    lowStockItems.value = 3

    // 渲染图表
    await nextTick()
    renderTrendChart()
    renderPieChart()
  } catch (err) {
    console.error('加载仪表盘数据失败', err)
    // 使用演示数据
    stats.value = {
      todayRevenue: '1,286.50',
      todayOrders: 24,
      todayCustomers: 18,
      avgOrderValue: '53.60',
      revenueTrend: 12.5,
      ordersTrend: 8.3,
      customerTrend: 15,
      avgTrend: 3.2,
    }
    pendingOrders.value = 3
    readyOrders.value = 2
    preparingOrders.value = 5
    lowStockItems.value = 3
    recentOrders.value = []
    await nextTick()
    renderTrendChart()
    renderPieChart()
  }
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  if (trendChart) trendChart.dispose()
  
  trendChart = echarts.init(trendChartRef.value)
  
  // 模拟近7天数据
  const days = Array.from({ length: 7 }, (_, i) => {
    return dayjs().subtract(6 - i, 'day').format('MM-DD')
  })
  const revenue = [986, 1156, 1088, 1320, 1286, 1450, 1286].map(v => v.toFixed(2))
  const orders = [18, 21, 20, 24, 23, 27, 24]

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e8e0ee',
      textStyle: { color: '#2a2a2a' },
    },
    legend: {
      data: ['营收(元)', '订单数'],
      bottom: 0,
      textStyle: { color: '#6b6572' },
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: '#e8e0ee' } },
      axisLabel: { color: '#6b6572' },
    },
    yAxis: [
      { type: 'value', name: '营收', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f0ecf5' } }, axisLabel: { color: '#6b6572' } },
      { type: 'value', name: '订单', axisLine: { show: false }, splitLine: { show: false }, axisLabel: { color: '#6b6572' } },
    ],
    series: [
      {
        name: '营收(元)',
        type: 'bar',
        barWidth: '35%',
        itemStyle: { color: '#e8dff0', borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { color: '#c4a7d7' } },
        data: revenue,
      },
      {
        name: '订单数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#9b7bb8', width: 2 },
        itemStyle: { color: '#9b7bb8' },
        data: orders,
      },
    ],
  }
  trendChart.setOption(option)
}

function renderPieChart() {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()
  
  pieChart = echarts.init(pieChartRef.value)

  const option = {
    tooltip: { trigger: 'item', backgroundColor: '#fff', borderColor: '#e8e0ee', textStyle: { color: '#2a2a2a' } },
    legend: { bottom: 0, textStyle: { color: '#6b6572' }, itemWidth: 12, itemHeight: 12 },
    color: ['#6aab8e', '#7ba8c4', '#9b7bb8', '#e8a87c', '#d4736a', '#c4a7d7'],
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontWeight: 'bold', fontSize: 13 },
      },
      data: [
        { value: 18, name: '已完成' },
        { value: 12, name: '制作中' },
        { value: 8, name: '待取餐' },
        { value: 5, name: '待付款' },
        { value: 3, name: '已取消' },
        { value: 1, name: '已退款' },
      ],
    }],
  }
  pieChart.setOption(option)
}

let resizeObserver = null

onMounted(() => {
  loadDashboard()
  resizeObserver = new ResizeObserver(() => {
    trendChart?.resize()
    pieChart?.resize()
  })
  if (trendChartRef.value) resizeObserver.observe(trendChartRef.value)
  if (pieChartRef.value) resizeObserver.observe(pieChartRef.value)
})

onUnmounted(() => {
  trendChart?.dispose()
  pieChart?.dispose()
  resizeObserver?.disconnect()
})
</script>

<style lang="scss" scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card,
.pie-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.chart-container {
  height: 240px;
  &.pie { height: 200px; }
}

.dashboard-bottom {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: pointer;
  transition: var(--transition);

  &:hover {
    background: var(--color-primary-light);
  }
}

.todo-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;

  &.pending { background: #fef3ec; color: #d4884a; }
  &.danger  { background: #fceaea; color: #d4736a; }
  &.success { background: #e8f5f0; color: #6aab8e; }
  &.info    { background: #ecf4f9; color: #7ba8c4; }
}

.todo-count {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.todo-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.order-items {
  font-size: 12px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
  display: block;
}

.recent-orders {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
}
</style>
