<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">财务管理</div>
        <div class="page-subtitle">收入、支出、利润全面掌控</div>
      </div>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="loadData"
      />
    </div>

    <!-- 收入统计卡片 -->
    <div class="stats-grid" style="margin-bottom: 16px">
      <div class="stat-card">
        <div class="stat-icon primary"><el-icon><Money /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">¥{{ stats.totalRevenue }}</div>
          <div class="stat-label">总营收</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success"><el-icon><TrendCharts /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">¥{{ stats.todayRevenue }}</div>
          <div class="stat-label">今日营收</div>
          <div class="stat-trend up">↑ {{ stats.revenueGrowth }}%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning"><el-icon><Wallet /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">¥{{ stats.totalCost }}</div>
          <div class="stat-label">总成本</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info"><el-icon><Coin /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">¥{{ stats.profit }}</div>
          <div class="stat-label">净利润</div>
          <div class="stat-trend up">利润率 {{ stats.profitRate }}%</div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="card-section" style="margin-bottom: 16px">
      <div class="card-header">
        <span class="card-title">每日营收趋势</span>
      </div>
      <div ref="chartRef" class="finance-chart"></div>
    </div>

    <!-- 明细表格 -->
    <div class="card-section">
      <div class="card-header">
        <span class="card-title">收支明细</span>
        <el-button text type="primary" @click="exportData">
          <el-icon><Download /></el-icon> 导出
        </el-button>
      </div>
      <el-table :data="records" size="small" stripe>
        <el-table-column label="日期" prop="date" width="120" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === '收入' ? 'success' : 'danger'" plain>
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源/科目" prop="source" min-width="160" />
        <el-table-column label="订单号" prop="orderNo" width="150" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span :class="['amount', row.type === '收入' ? 'positive' : 'negative']">
              {{ row.type === '收入' ? '+' : '-' }}¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" prop="payMethod" width="100" />
        <el-table-column label="备注" prop="remark" min-width="150" />
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadRecords"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const dateRange = ref([dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')])
const chartRef = ref()
let chart = null

const stats = ref({ totalRevenue: '0', todayRevenue: '0', revenueGrowth: '0', totalCost: '0', profit: '0', profitRate: '0' })
const records = ref([])
const total = ref(0)
const pagination = reactive({ page: 1, pageSize: 20 })

async function loadData() {
  stats.value = {
    totalRevenue: '12,580.50',
    todayRevenue: '1,286.50',
    revenueGrowth: '12.5',
    totalCost: '4,210.00',
    profit: '8,370.50',
    profitRate: '66.5',
  }
  await loadRecords()
  await nextTick()
  renderChart()
}

async function loadRecords() {
  records.value = [
    { date: '2026-05-08', type: '收入', source: '小程序点单', orderNo: 'ORD2026050801', amount: '86.00', payMethod: '微信支付', remark: '' },
    { date: '2026-05-08', type: '收入', source: '小程序点单', orderNo: 'ORD2026050802', amount: '42.00', payMethod: '微信支付', remark: '' },
    { date: '2026-05-08', type: '收入', source: '会员储值', orderNo: '', amount: '200.00', payMethod: '微信支付', remark: '会员充值赠送' },
    { date: '2026-05-08', type: '支出', source: '原材料采购', orderNo: '', amount: '580.00', payMethod: '—', remark: '咖啡豆进货' },
    { date: '2026-05-07', type: '收入', source: '小程序点单', orderNo: 'ORD2026050701', amount: '126.00', payMethod: '储值卡', remark: '' },
    { date: '2026-05-07', type: '收入', source: '小程序点单', orderNo: 'ORD2026050702', amount: '56.00', payMethod: '微信支付', remark: '' },
    { date: '2026-05-07', type: '支出', source: '耗材采购', orderNo: '', amount: '120.00', payMethod: '—', remark: '纸杯纸袋' },
  ]
  total.value = records.value.length
}

function renderChart() {
  if (!chartRef.value) return
  if (chart) chart.dispose()
  chart = echarts.init(chartRef.value)

  const days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'))
  const data = [986, 1156, 1088, 1320, 1286, 1450, 1286]

  chart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#e8e0ee', textStyle: { color: '#2a2a2a' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#e8e0ee' } }, axisLabel: { color: '#6b6572' } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f0ecf5' } }, axisLabel: { color: '#6b6572' } },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#9b7bb8', width: 3 },
      itemStyle: { color: '#9b7bb8' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(155,123,184,0.3)' }, { offset: 1, color: 'rgba(155,123,184,0)' }] } },
    }],
  })
}

function exportData() {
  // TODO: 导出Excel
}

let ro = null
onMounted(() => { loadData(); ro = new ResizeObserver(() => chart?.resize()); if (chartRef.value) ro.observe(chartRef.value) })
onUnmounted(() => { chart?.dispose(); ro?.disconnect() })
</script>

<style lang="scss" scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-title { font-size: 15px; font-weight: 600; }
.finance-chart { height: 260px; }
</style>
