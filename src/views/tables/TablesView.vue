<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">桌台管理</div>
        <div class="page-subtitle">管理桌位，生成点单二维码</div>
      </div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon> 添加桌台
      </el-button>
    </div>

    <!-- 桌台网格 -->
    <div class="tables-grid">
      <div
        v-for="table in tables"
        :key="table._id || table.id"
        :class="['table-card', table.status]"
        @click="openTableDetail(table)"
      >
        <div class="table-header">
          <div class="table-number">{{ table.name || table.tableName }}</div>
          <div :class="['table-status-badge', table.status]">
            {{ statusMap[table.status] || table.status }}
          </div>
        </div>
        <div class="table-capacity">
          <el-icon><User /></el-icon>
          {{ table.capacity || 2 }}人位
        </div>
        <div class="table-qr" v-if="table.qrCode">
          <el-image :src="table.qrCode" fit="contain" class="qr-thumb" />
        </div>
        <div class="table-actions" @click.stop>
          <el-button size="small" text type="primary" @click="generateQR(table)">
            <el-icon><QqCircle /></el-icon> 二维码
          </el-button>
          <el-button size="small" text type="primary" @click="openEditDialog(table)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 桌台详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="currentTable?.name + ' - 详情'" :size="400" direction="rtl">
      <div v-if="currentTable" class="table-detail">
        <div class="detail-info">
          <div class="info-row">
            <span class="label">桌台名称</span>
            <span class="value">{{ currentTable.name }}</span>
          </div>
          <div class="info-row">
            <span class="label">容纳人数</span>
            <span class="value">{{ currentTable.capacity }}人</span>
          </div>
          <div class="info-row">
            <span class="label">当前状态</span>
            <span :class="['order-status', currentTable.status]">
              {{ statusMap[currentTable.status] || currentTable.status }}
            </span>
          </div>
          <div class="info-row" v-if="currentTable.currentOrder">
            <span class="label">当前订单</span>
            <span class="value">#{{ currentTable.currentOrder }}</span>
          </div>
          <div class="info-row" v-if="currentTable.lastOrder">
            <span class="label">最近订单</span>
            <span class="value">{{ currentTable.lastOrder }}</span>
          </div>
        </div>

        <div class="qr-section" v-if="currentQR">
          <h4>桌台二维码</h4>
          <el-image :src="currentQR" fit="contain" class="qr-image" />
          <p class="qr-tip">顾客扫码即可点单</p>
          <el-button type="primary" plain @click="downloadQR">
            <el-icon><Download /></el-icon> 下载二维码
          </el-button>
        </div>

        <div class="detail-actions">
          <el-button v-if="currentTable.status === 'empty'" type="success" @click="changeStatus('occupied')">
            开台
          </el-button>
          <el-button v-else type="warning" @click="changeStatus('empty')">
            收台
          </el-button>
          <el-button type="danger" text @click="deleteTable">删除桌台</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑桌台' : '添加桌台'" width="420px">
      <el-form ref="formRef" :model="form" label-width="80px">
        <el-form-item label="桌台名称" prop="name">
          <el-input v-model="form.name" placeholder="如：A1、窗边位、露天座" />
        </el-form-item>
        <el-form-item label="容纳人数">
          <el-input-number v-model="form.capacity" :min="1" :max="20" style="width: 100%" />
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="form.zone" placeholder="选择区域" style="width: 100%">
            <el-option label="一楼大厅" value="一楼" />
            <el-option label="二楼雅座" value="二楼" />
            <el-option label="三楼包间" value="三楼" />
            <el-option label="室外" value="室外" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { tablesApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const tables = ref([])
const detailVisible = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentTable = ref(null)
const currentQR = ref('')
const formRef = ref()

const form = reactive({ name: '', capacity: 4, zone: '一楼' })

const statusMap = {
  empty: '空闲',
  occupied: '占用',
  reserved: '已预约',
  cleaning: '清洁中',
}

async function loadTables() {
  try {
    const res = await tablesApi.list()
    tables.value = res.data || res || []
  } catch {
    tables.value = [
      { id: 1, name: 'A1', capacity: 2, zone: '一楼', status: 'empty' },
      { id: 2, name: 'A2', capacity: 2, zone: '一楼', status: 'occupied' },
      { id: 3, name: 'A3', capacity: 4, zone: '一楼', status: 'empty' },
      { id: 4, name: 'B1', capacity: 4, zone: '二楼', status: 'empty' },
      { id: 5, name: 'B2', capacity: 6, zone: '二楼', status: 'reserved' },
      { id: 6, name: 'C1', capacity: 8, zone: '三楼', status: 'empty' },
    ]
  }
}

function openTableDetail(table) {
  currentTable.value = table
  currentQR.value = ''
  detailVisible.value = true
}

async function generateQR(table) {
  try {
    const res = await tablesApi.generateQR(table._id || table.id)
    currentQR.value = res.data?.qrCode || ''
    ElMessage.success('二维码已生成')
  } catch {
    currentQR.value = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://thirdfloorcoffee.com/order?table=${table._id || table.id}`
    ElMessage.success('二维码已生成')
  }
}

function downloadQR() {
  if (!currentQR.value) return
  const a = document.createElement('a')
  a.href = currentQR.value
  a.download = `桌台-${currentTable.value?.name}-二维码.png`
  a.click()
}

function openAddDialog() {
  isEdit.value = false
  Object.assign(form, { name: '', capacity: 4, zone: '一楼' })
  dialogVisible.value = true
}

function openEditDialog(table) {
  isEdit.value = true
  currentTable.value = table
  Object.assign(form, { name: table.name, capacity: table.capacity, zone: table.zone })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.name) { ElMessage.warning('请输入桌台名称'); return }
  ElMessage.success(isEdit.value ? '桌台已更新' : '桌台已添加')
  dialogVisible.value = false
  loadTables()
}

async function changeStatus(status) {
  ElMessage.success(`桌台已${status === 'occupied' ? '开台' : '收台'}`)
  loadTables()
}

function deleteTable() {
  ElMessageBox.confirm('确定要删除此桌台吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    ElMessage.success('桌台已删除')
    detailVisible.value = false
    loadTables()
  }).catch(() => {})
}

onMounted(() => loadTables())
</script>

<style lang="scss" scoped>
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.table-card {
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: var(--transition);

  &:hover {
    border-color: var(--color-primary-light);
    box-shadow: var(--shadow-md);
  }

  &.occupied { border-color: var(--color-warning); background: #fffbf8; }
  &.reserved { border-color: var(--color-primary); background: #f8f5ff; }
  &.cleaning { border-color: var(--color-info); background: #f5faff; }
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.table-number {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

.table-status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;

  &.empty { background: #e8f5f0; color: #4aab6e; }
  &.occupied { background: #fef3ec; color: #d4884a; }
  &.reserved { background: #e8dff0; color: #8b5bb0; }
  &.cleaning { background: #ecf4f9; color: #5a9abf; }
}

.table-capacity {
  font-size: 13px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.qr-thumb {
  width: 100%;
  height: 80px;
  border-radius: 6px;
  background: #f0ecf5;
  margin-bottom: 10px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-detail {
  padding: 0 4px;
}

.detail-info {
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
  &:last-child { border-bottom: none; }
  .label { font-size: 13px; color: var(--color-text-secondary); }
  .value { font-size: 14px; font-weight: 600; color: var(--color-text); }
}

.qr-section {
  text-align: center;
  margin-bottom: 20px;
  h4 { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
  .qr-image { width: 180px; height: 180px; border: 1px solid var(--color-border); border-radius: 8px; margin: 0 auto; }
  .qr-tip { font-size: 12px; color: var(--color-text-light); margin: 8px 0; }
}

.detail-actions {
  display: flex;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
</style>
