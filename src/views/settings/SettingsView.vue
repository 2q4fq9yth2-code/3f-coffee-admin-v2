<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">系统设置</div>
        <div class="page-subtitle">店铺配置与个人信息</div>
      </div>
    </div>

    <div class="settings-grid">
      <!-- 个人信息 -->
      <div class="card-section settings-card">
        <div class="card-header">
          <span class="card-title">个人信息</span>
        </div>
        <div class="settings-form">
          <div class="avatar-section">
            <el-avatar :size="72" class="staff-avatar-lg">{{ staffInitial }}</el-avatar>
            <div class="avatar-info">
              <div class="staff-name-lg">{{ staffInfo?.name || staffInfo?.username || '管理员' }}</div>
              <div class="staff-role">{{ roleName }}</div>
            </div>
          </div>
          <el-form label-width="80px" style="margin-top: 20px">
            <el-form-item label="账号">
              <el-input :model-value="staffInfo?.username || 'admin'" disabled />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="profile.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profile.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="角色">
              <el-select v-model="profile.role" style="width: 100%">
                <el-option label="店长" value="owner" />
                <el-option label="店员" value="staff" />
                <el-option label="财务" value="finance" />
              </el-select>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="saveProfile" style="margin-top: 12px">保存修改</el-button>
        </div>
      </div>

      <!-- 店铺设置 -->
      <div class="card-section settings-card">
        <div class="card-header">
          <span class="card-title">店铺设置</span>
        </div>
        <el-form label-width="90px">
          <el-form-item label="店铺名称">
            <el-input v-model="shop.name" />
          </el-form-item>
          <el-form-item label="店铺地址">
            <el-input v-model="shop.address" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="shop.phone" />
          </el-form-item>
          <el-form-item label="营业时间">
            <el-time-picker
              v-model="shop.businessHours"
              is-range
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="HH:mm"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="公告">
            <el-input v-model="shop.notice" type="textarea" :rows="3" placeholder="店铺公告（选填）" />
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="saveShop">保存设置</el-button>
      </div>

      <!-- 打印设置 -->
      <div class="card-section settings-card">
        <div class="card-header">
          <span class="card-title">打印设置</span>
        </div>
        <el-form label-width="90px">
          <el-form-item label="小票机 SN">
            <el-input v-model="print.receiptSN" placeholder="小票机 SN" />
          </el-form-item>
          <el-form-item label="标签机 SN">
            <el-input v-model="print.labelSN" placeholder="标签机 SN" />
          </el-form-item>
          <el-form-item label="打印联数">
            <el-input-number v-model="print.copies" :min="1" :max="3" />
          </el-form-item>
          <el-form-item label="自动打印">
            <el-switch v-model="print.autoPrint" />
          </el-form-item>
        </el-form>
        <el-button @click="testPrint">测试打印</el-button>
      </div>

      <!-- 其他设置 -->
      <div class="card-section settings-card">
        <div class="card-header">
          <span class="card-title">其他</span>
        </div>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">微信小程序</div>
              <div class="setting-desc">管理小程序配置</div>
            </div>
            <el-button size="small" text>前往</el-button>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">云开发控制台</div>
              <div class="setting-desc">管理云函数、云数据库</div>
            </div>
            <el-button size="small" text>前往</el-button>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">清除缓存</div>
              <div class="setting-desc">清除本地缓存数据</div>
            </div>
            <el-button size="small" text type="danger" @click="clearCache">清除</el-button>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">版本信息</div>
              <div class="setting-desc">当前版本 v1.0.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const staffInfo = computed(() => authStore.staffInfo)
const staffInitial = computed(() => (staffInfo.value?.name || staffInfo.value?.username || 'A')[0])
const roleName = computed(() => ({ owner: '店长', staff: '店员', finance: '财务' }[staffInfo.value?.role]) || '管理员')

const profile = reactive({
  name: staffInfo.value?.name || '',
  phone: '',
  role: staffInfo.value?.role || 'owner',
})

const shop = reactive({
  name: '三楼咖啡 Third Floor Coffee',
  address: '北京市朝阳区三里屯路19号',
  phone: '010-88888888',
  businessHours: null,
  notice: '欢迎光临，请扫码点单～',
})

const print = reactive({
  receiptSN: '920506883',
  labelSN: '960237675',
  copies: 1,
  autoPrint: true,
})

function saveProfile() {
  ElMessage.success('个人信息已保存')
}

function saveShop() {
  ElMessage.success('店铺设置已保存')
}

function testPrint() {
  ElMessage.success('测试打印已发送')
}

function clearCache() {
  localStorage.clear()
  ElMessage.success('缓存已清除，请刷新页面')
}
</script>

<style lang="scss" scoped>
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.settings-card {
  .card-header { margin-bottom: 16px; }
  .card-title { font-size: 15px; font-weight: 600; }
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.staff-avatar-lg {
  background: var(--color-primary);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}

.staff-name-lg {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.staff-role {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.settings-list {
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid var(--color-border-light);
    &:last-child { border-bottom: none; }
  }
  .setting-label { font-size: 14px; font-weight: 500; color: var(--color-text); }
  .setting-desc { font-size: 12px; color: var(--color-text-light); margin-top: 2px; }
}
</style>
