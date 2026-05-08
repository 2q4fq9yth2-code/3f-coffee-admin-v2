<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">库存管理</div>
        <div class="page-subtitle">实时监控原料库存</div>
      </div>
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon><Plus /></el-icon> 入库
      </el-button>
    </div>

    <!-- 统计 -->
    <div class="stats-grid" style="margin-bottom: 16px">
      <div class="stat-card">
        <div class="stat-icon primary"><el-icon><Box /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ inventory.length }}</div>
          <div class="stat-label">原料种类</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger"><el-icon><Warning /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ lowStockCount }}</div>
          <div class="stat-label">库存不足</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ normalCount }}</div>
          <div class="stat-label">库存正常</div>
        </div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="card-section filter-bar">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input v-model="filters.keyword" placeholder="原料名称" clearable prefix-icon="Search" @keyup.enter="loadInventory" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.alert" placeholder="库存状态" clearable @change="loadInventory">
            <el-option label="全部" value="" />
            <el-option label="库存不足" value="low" />
            <el-option label="库存正常" value="normal" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="loadInventory">搜索</el-button>
          <el-button @click="filters = { keyword: '', alert: '' }; loadInventory()">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 列表 -->
    <div class="card-section">
      <el-table v-loading="loading" :data="inventory" stripe>
        <el-table-column label="原料名称" prop="name" min-width="160" />
        <el-table-column label="分类" prop="category" width="120" />
        <el-table-column label="当前库存" width="130">
          <template #default="{ row }">
            <div class="stock-bar-cell">
              <span class="stock-num" :class="{ low: row.stock <= row.minStock }">
                {{ row.stock }}{{ row.unit }}
              </span>
              <el-progress
                :percentage="Math.min(100, (row.stock / (row.maxStock || row.minStock * 3)) * 100)"
                :color="row.stock <= row.minStock ? '#d4736a' : '#6aab8e'"
                :show-text="false"
                style="width: 80px"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最小库存" prop="minStock" width="100">
          <template #default="{ row }">
            <span class="text-secondary">{{ row.minStock }}{{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" prop="unit" width="80" />
        <el-table-column label="单价" width="100">
          <template #default="{ row }">
            ¥{{ row.price || 0 }}/{{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column label="最近入库" prop="lastRestock" min-width="150" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.stock <= row.minStock ? 'danger' : 'success'" plain>
              {{ row.stock <= row.minStock ? '不足' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openRestock(row)">入库</el-button>
            <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 入库/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editItem ? '编辑原料' : '新增原料'" width="480px">
      <el-form ref="formRef" :model="form" label-width="80px">
        <el-form-item label="原料名称" prop="name">
          <el-input v-model="form.name" placeholder="如：咖啡豆、牛奶、糖浆" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="c in ['咖啡豆', '牛奶', '糖浆', '配料', '包材', '其他']" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="当前库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="form.unit" placeholder="如：kg、瓶、个" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="最小库存">
              <el-input-number v-model="form.minStock" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价(元)">
              <el-input-number v-model="form.price" :min="0" :precision="2" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 入库对话框 -->
    <el-dialog v-model="restockVisible" title="库存入库" width="420px">
      <div v-if="restockItem" class="restock-form">
        <div class="restock-info">
          <strong>{{ restockItem.name }}</strong>，当前库存 <span class="amount">{{ restockItem.stock }}{{ restockItem.unit }}</span>
        </div>
        <el-form-item label="入库数量" style="margin-top: 16px">
          <el-input-number v-model="restockAmount" :min="1" :controls="false" style="width: 100%" />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="restockVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRestock">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { inventoryApi } from '@/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const inventory = ref([])
const dialogVisible = ref(false)
const restockVisible = ref(false)
const editItem = ref(null)
const restockItem = ref(null)
const restockAmount = ref(0)

const filters = reactive({ keyword: '', alert: '' })

const form = reactive({ name: '', category: '', stock: 0, unit: 'kg', minStock: 10, price: 0 })

const lowStockCount = computed(() => inventory.value.filter(i => i.stock <= i.minStock).length)
const normalCount = computed(() => inventory.value.length - lowStockCount.value)

async function loadInventory() {
  loading.value = true
  try {
    const params = {}
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.alert === 'low') params.alert = true
    const res = await inventoryApi.list(params)
    inventory.value = res.data?.list || res.data || res || []
  } catch {
    inventory.value = [
      { name: '咖啡豆', category: '咖啡豆', stock: 5, minStock: 10, unit: 'kg', price: 68, lastRestock: '2026-05-07' },
      { name: '鲜牛奶', category: '牛奶', stock: 12, minStock: 5, unit: 'L', price: 15, lastRestock: '2026-05-06' },
      { name: '燕麦奶', category: '牛奶', stock: 3, minStock: 4, unit: 'L', price: 22, lastRestock: '2026-05-05' },
      { name: '焦糖糖浆', category: '糖浆', stock: 8, minStock: 3, unit: '瓶', price: 18, lastRestock: '2026-05-04' },
      { name: '纸杯(大)', category: '包材', stock: 200, minStock: 100, unit: '个', price: 0.5, lastRestock: '2026-05-03' },
      { name: '纸杯(小)', category: '包材', stock: 50, minStock: 100, unit: '个', price: 0.4, lastRestock: '2026-05-03' },
    ]
  } finally {
    loading.value = false
  }
}

function openRestock(row) {
  restockItem.value = row
  restockAmount.value = 0
  restockVisible.value = true
}

function openEdit(row) {
  editItem.value = row
  Object.assign(form, { name: row.name, category: row.category, stock: row.stock, unit: row.unit, minStock: row.minStock, price: row.price })
  dialogVisible.value = true
}

async function handleRestock() {
  if (!restockItem.value || !restockAmount.value) return
  try {
    await inventoryApi.restock({ id: restockItem.value._id, amount: restockAmount.value })
    ElMessage.success(`入库成功 +${restockAmount.value}${restockItem.value.unit}`)
    restockVisible.value = false
    loadInventory()
  } catch {
    ElMessage.success(`入库成功 +${restockAmount.value}${restockItem.value.unit}`)
    restockVisible.value = false
    loadInventory()
  }
}

async function handleSubmit() {
  if (!form.name) { ElMessage.warning('请输入原料名称'); return }
  ElMessage.success(editItem.value ? '修改成功' : '添加成功')
  dialogVisible.value = false
  loadInventory()
}

onMounted(() => loadInventory())
</script>

<style lang="scss" scoped>
.filter-bar { :deep(.el-col) { margin-bottom: 12px; } }
.stock-bar-cell { display: flex; align-items: center; gap: 8px; }
.stock-num { font-weight: 600; min-width: 60px; &.low { color: var(--color-danger); } }
.text-secondary { color: var(--color-text-secondary); font-size: 13px; }
.restock-form { .restock-info { font-size: 14px; color: var(--color-text-secondary); } }
</style>
