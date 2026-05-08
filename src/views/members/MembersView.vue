<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">会员管理</div>
        <div class="page-subtitle">共 {{ total }} 位会员</div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid" style="margin-bottom: 16px">
      <div class="stat-card">
        <div class="stat-icon primary"><el-icon><User /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ total }}</div>
          <div class="stat-label">会员总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success"><el-icon><Money /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">¥{{ totalBalance }}</div>
          <div class="stat-label">储值总额</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning"><el-icon><Coin /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ totalPoints }}</div>
          <div class="stat-label">积分总额</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info"><el-icon><TrendCharts /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">¥{{ avgConsume }}</div>
          <div class="stat-label">人均消费</div>
        </div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="card-section filter-bar">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input v-model="filters.keyword" placeholder="手机号 / 昵称" clearable prefix-icon="Search" @keyup.enter="loadMembers" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.level" placeholder="会员等级" clearable @change="loadMembers">
            <el-option label="全部" value="" />
            <el-option label="普通会员" value="normal" />
            <el-option label="银卡会员" value="silver" />
            <el-option label="金卡会员" value="gold" />
            <el-option label="黑卡会员" value="black" />
          </el-select>
        </el-col>
        <el-col :span="10">
          <el-button type="primary" @click="loadMembers">搜索</el-button>
          <el-button @click="filters = { keyword: '', level: '' }; loadMembers()">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 会员列表 -->
    <div class="card-section">
      <el-table v-loading="loading" :data="members" stripe @row-click="openDetail">
        <el-table-column label="会员信息" min-width="200">
          <template #default="{ row }">
            <div class="member-cell">
              <el-avatar :size="40" class="member-avatar">{{ (row.name || row.nickname || '?')[0] }}</el-avatar>
              <div>
                <div class="member-name">{{ row.name || row.nickname || '匿名用户' }}</div>
                <div class="member-phone">{{ row.phone || row.mobile || '—' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="等级" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="levelType(row.level)" plain>
              {{ levelName(row.level) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="储值余额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ row.balance || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="积分" width="100">
          <template #default="{ row }">
            <span style="color: var(--color-warning)">{{ row.points || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="累计消费" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalConsume || row.consumeTotal || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="注册时间" prop="createTime" min-width="150" />

        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <div @click.stop>
              <el-button size="small" text type="primary" @click="openRecharge(row)">充值</el-button>
              <el-button size="small" text type="primary" @click="openDetail(row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadMembers"
        @current-change="loadMembers"
      />
    </div>

    <!-- 会员详情抽屉 -->
    <el-drawer v-model="detailVisible" title="会员详情" :size="420" direction="rtl">
      <div v-if="currentMember" class="member-detail">
        <div class="detail-section">
          <h4 class="detail-title">基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">昵称</span><span class="value">{{ currentMember.name || currentMember.nickname || '—' }}</span></div>
            <div class="detail-item"><span class="label">手机</span><span class="value">{{ currentMember.phone || '—' }}</span></div>
            <div class="detail-item"><span class="label">等级</span><span class="value"><el-tag size="small">{{ levelName(currentMember.level) }}</el-tag></span></div>
            <div class="detail-item"><span class="label">openid</span><span class="value" style="font-size:12px;word-break:break-all">{{ currentMember.openid || '—' }}</span></div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-title">账户信息</h4>
          <div class="balance-cards">
            <div class="balance-card">
              <div class="b-label">储值余额</div>
              <div class="b-value">¥{{ currentMember.balance || 0 }}</div>
            </div>
            <div class="balance-card">
              <div class="b-label">积分</div>
              <div class="b-value" style="color: var(--color-warning)">{{ currentMember.points || 0 }}</div>
            </div>
            <div class="balance-card">
              <div class="b-label">累计消费</div>
              <div class="b-value">¥{{ currentMember.totalConsume || 0 }}</div>
            </div>
            <div class="balance-card">
              <div class="b-label">订单总数</div>
              <div class="b-value">{{ currentMember.orderCount || 0 }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-title">时间信息</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">注册时间</span><span class="value">{{ currentMember.createTime || '—' }}</span></div>
            <div class="detail-item"><span class="label">最后消费</span><span class="value">{{ currentMember.lastConsumeTime || '—' }}</span></div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 充值对话框 -->
    <el-dialog v-model="rechargeVisible" title="会员充值" width="420">
      <div v-if="currentMember" class="recharge-form">
        <div class="recharge-member">
          正在为 <strong>{{ currentMember.name || currentMember.nickname }}</strong> 充值
        </div>
        <div class="recharge-options">
          <div
            v-for="plan in rechargePlans"
            :key="plan.amount"
            :class="['recharge-plan', { active: rechargeAmount === plan.amount }]"
            @click="rechargeAmount = plan.amount"
          >
            <div class="plan-amount">¥{{ plan.amount }}</div>
            <div class="plan-gift" v-if="plan.gift">送 ¥{{ plan.gift }}</div>
          </div>
        </div>
        <el-form-item label="自定义金额" style="margin-top: 16px">
          <el-input-number v-model="rechargeAmount" :min="1" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" :loading="recharging" @click="handleRecharge">确认充值</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { membersApi } from '@/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const members = ref([])
const total = ref(0)
const totalBalance = ref('0')
const totalPoints = ref('0')
const avgConsume = ref('0')
const detailVisible = ref(false)
const rechargeVisible = ref(false)
const currentMember = ref(null)
const recharging = ref(false)
const rechargeAmount = ref(100)

const filters = reactive({ keyword: '', level: '' })
const pagination = reactive({ page: 1, pageSize: 20 })

const rechargePlans = [
  { amount: 50, gift: 0 },
  { amount: 100, gift: 10 },
  { amount: 200, gift: 30 },
  { amount: 500, gift: 80 },
  { amount: 1000, gift: 200 },
]

const levelMap = { normal: '普通会员', silver: '银卡会员', gold: '金卡会员', black: '黑卡会员' }
const levelTypeMap = { normal: 'info', silver: 'primary', gold: 'warning', black: '' }
const levelName = (l) => levelMap[l] || '普通会员'
const levelType = (l) => levelTypeMap[l] || 'info'

async function loadMembers() {
  loading.value = true
  try {
    const params = { page: pagination.page, limit: pagination.pageSize }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.level) params.level = filters.level
    const res = await membersApi.list(params)
    const data = res.data?.list || res.data || res || []
    members.value = Array.isArray(data) ? data : []
    total.value = res.data?.total || members.value.length
    totalBalance.value = members.value.reduce((s, m) => s + (m.balance || 0), 0).toFixed(2)
    totalPoints.value = members.value.reduce((s, m) => s + (m.points || 0), 0)
    avgConsume.value = members.value.length > 0
      ? (members.value.reduce((s, m) => s + (m.totalConsume || 0), 0) / members.value.length).toFixed(2)
      : '0'
  } catch (err) {
    members.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function openDetail(row) {
  currentMember.value = row
  detailVisible.value = true
}

function openRecharge(row) {
  currentMember.value = row
  rechargeAmount.value = 100
  rechargeVisible.value = true
}

async function handleRecharge() {
  if (!currentMember.value || !rechargeAmount.value) return
  recharging.value = true
  try {
    await membersApi.recharge(currentMember.value._id || currentMember.value.openid, {
      amount: rechargeAmount.value,
    })
    ElMessage.success(`充值成功，¥${rechargeAmount.value}已到账`)
    rechargeVisible.value = false
    loadMembers()
  } catch (err) {
    ElMessage.error('充值失败')
  } finally {
    recharging.value = false
  }
}

onMounted(() => loadMembers())
</script>

<style lang="scss" scoped>
.filter-bar { :deep(.el-col) { margin-bottom: 12px; } }
.member-cell { display: flex; align-items: center; gap: 10px; }
.member-avatar { background: var(--color-primary); color: #fff; flex-shrink: 0; }
.member-name { font-weight: 600; }
.member-phone { font-size: 12px; color: var(--color-text-light); margin-top: 2px; }

.member-detail { padding: 0 4px; }
.detail-section { margin-bottom: 24px; }
.detail-title { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border-light); }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item {
  .label { font-size: 12px; color: var(--color-text-light); display: block; margin-bottom: 4px; }
  .value { font-size: 14px; color: var(--color-text); font-weight: 500; }
}

.balance-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.balance-card {
  background: var(--color-bg); padding: 14px; border-radius: var(--radius-md); text-align: center;
  .b-label { font-size: 12px; color: var(--color-text-light); margin-bottom: 6px; }
  .b-value { font-size: 20px; font-weight: 700; color: var(--color-text); }
}

.recharge-member { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 16px; }
.recharge-options { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.recharge-plan {
  border: 2px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 8px; text-align: center; cursor: pointer; transition: var(--transition);
  &:hover { border-color: var(--color-primary-light); }
  &.active { border-color: var(--color-primary); background: var(--color-primary-light); }
  .plan-amount { font-size: 16px; font-weight: 700; color: var(--color-text); }
  .plan-gift { font-size: 11px; color: var(--color-success); margin-top: 4px; }
}
</style>
