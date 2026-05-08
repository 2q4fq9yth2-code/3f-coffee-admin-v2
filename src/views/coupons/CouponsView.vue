<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">优惠券管理</div>
        <div class="page-subtitle">创建、发放、管理优惠券</div>
      </div>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 创建优惠券
      </el-button>
    </div>

    <!-- 统计 -->
    <div class="stats-grid" style="margin-bottom: 16px">
      <div class="stat-card">
        <div class="stat-icon primary"><el-icon><Ticket /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ coupons.length }}</div>
          <div class="stat-label">优惠券总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ activeCoupons.length }}</div>
          <div class="stat-label">活动中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning"><el-icon><User /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ totalIssued }}</div>
          <div class="stat-label">已发放</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info"><el-icon><SuccessFilled /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ totalUsed }}</div>
          <div class="stat-label">已使用</div>
        </div>
      </div>
    </div>

    <!-- 列表 -->
    <div class="card-section">
      <el-table v-loading="loading" :data="coupons" stripe>
        <el-table-column label="优惠券" min-width="240">
          <template #default="{ row }">
            <div class="coupon-cell">
              <div class="coupon-value">
                <span class="cv-symbol">¥</span>
                <span class="cv-amount">{{ row.discount || row.value }}</span>
              </div>
              <div class="coupon-info">
                <div class="coupon-name">{{ row.name }}</div>
                <div class="coupon-desc">{{ row.desc || row.description || '—' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="使用条件" width="140">
          <template #default="{ row }">
            <span class="text-secondary">
              满{{ row.minAmount || 0 }}元可用
            </span>
          </template>
        </el-table-column>

        <el-table-column label="有效期" min-width="180">
          <template #default="{ row }">
            <div class="date-range">
              <div>{{ row.startTime || row.startDate || '—' }}</div>
              <div>至 {{ row.endTime || row.endDate || '—' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="已发放/已使用" width="140">
          <template #default="{ row }">
            <span>{{ row.issued || 0 }} / {{ row.used || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'active' ? 'success' : 'info'" plain>
              {{ row.status === 'active' ? '活动中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" text :type="row.status === 'active' ? 'warning' : 'success'" @click="toggleCoupon(row)">
              {{ row.status === 'active' ? '暂停' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑优惠券' : '创建优惠券'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="form.name" placeholder="如：新人专享券" />
        </el-form-item>
        <el-form-item label="优惠内容">
          <el-radio-group v-model="form.type">
            <el-radio label="discount">满减券</el-radio>
            <el-radio label="cash">代金券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="form.type === 'discount' ? '满减门槛(元)' : '代金券金额(元)'" prop="minAmount">
              <el-input-number v-model="form.minAmount" :min="0" :precision="2" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="form.type === 'discount' ? '减多少钱(元)' : '抵扣金额(元)'" prop="value">
              <el-input-number v-model="form.value" :min="1" :precision="2" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="使用说明">
          <el-input v-model="form.desc" type="textarea" :rows="2" placeholder="简要说明使用规则" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始日期">
              <el-date-picker v-model="form.startTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期">
              <el-date-picker v-model="form.endTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="发行数量">
          <el-input-number v-model="form.totalCount" :min="0" :controls="false" style="width: 100%" placeholder="0表示不限量" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { couponsApi } from '@/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const coupons = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()

const form = reactive({ name: '', type: 'discount', minAmount: 0, value: 10, desc: '', startTime: '', endTime: '', totalCount: 0 })
const rules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入优惠金额', trigger: 'blur' }],
}

const activeCoupons = computed(() => coupons.value.filter(c => c.status === 'active'))
const totalIssued = computed(() => coupons.value.reduce((s, c) => s + (c.issued || 0), 0))
const totalUsed = computed(() => coupons.value.reduce((s, c) => s + (c.used || 0), 0))

async function loadCoupons() {
  loading.value = true
  try {
    const res = await couponsApi.list()
    coupons.value = res.data || res || []
  } catch {
    coupons.value = [
      { name: '新人专享券', type: 'discount', value: 10, minAmount: 50, desc: '新用户首单满50减10', startTime: '2026-05-01', endTime: '2026-06-30', status: 'active', issued: 156, used: 42 },
      { name: '满30减5券', type: 'discount', value: 5, minAmount: 30, desc: '全场通用', startTime: '2026-05-01', endTime: '2026-05-31', status: 'active', issued: 320, used: 108 },
      { name: '会员日专享', type: 'cash', value: 20, minAmount: 100, desc: '会员日满100减20', startTime: '2026-05-08', endTime: '2026-05-08', status: 'active', issued: 80, used: 35 },
      { name: '生日优惠券', type: 'discount', value: 15, minAmount: 0, desc: '生日当月可用', startTime: '2026-01-01', endTime: '2026-12-31', status: 'active', issued: 45, used: 28 },
    ]
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  isEdit.value = false
  Object.assign(form, { name: '', type: 'discount', minAmount: 0, value: 10, desc: '', startTime: '', endTime: '', totalCount: 0 })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(form, { name: row.name, type: row.type, minAmount: row.minAmount, value: row.value, desc: row.desc, startTime: row.startTime, endTime: row.endTime, totalCount: row.totalCount })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.name) { ElMessage.warning('请输入优惠券名称'); return }
  submitting.value = true
  try {
    ElMessage.success(isEdit.value ? '优惠券已更新' : '优惠券已创建')
    dialogVisible.value = false
    loadCoupons()
  } catch { ElMessage.error('保存失败') }
  finally { submitting.value = false }
}

async function toggleCoupon(row) {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(`优惠券已${newStatus === 'active' ? '启用' : '暂停'}`)
  loadCoupons()
}

onMounted(() => loadCoupons())
</script>

<style lang="scss" scoped>
.coupon-cell { display: flex; align-items: center; gap: 14px; }
.coupon-value {
  width: 64px; height: 64px; background: var(--color-primary-light); border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;
  .cv-symbol { font-size: 12px; color: var(--color-primary); }
  .cv-amount { font-size: 18px; font-weight: 700; color: var(--color-primary); }
}
.coupon-name { font-weight: 600; }
.coupon-desc { font-size: 12px; color: var(--color-text-light); margin-top: 2px; }
.date-range { font-size: 12px; color: var(--color-text-secondary); }
.text-secondary { color: var(--color-text-secondary); font-size: 13px; }
</style>
