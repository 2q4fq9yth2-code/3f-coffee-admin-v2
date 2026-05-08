<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">☕</span>
          <div class="logo-text">
            <span class="logo-name">三楼咖啡</span>
            <span class="logo-sub">管理后台</span>
          </div>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        class="sidebar-menu"
        background-color="#2d2438"
        text-color="#c9c2d4"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>

        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <template #title>商品管理</template>
        </el-menu-item>

        <el-menu-item index="/members">
          <el-icon><User /></el-icon>
          <template #title>会员管理</template>
        </el-menu-item>

        <el-menu-item index="/inventory">
          <el-icon><Box /></el-icon>
          <template #title>库存管理</template>
        </el-menu-item>

        <el-menu-item index="/finance">
          <el-icon><Money /></el-icon>
          <template #title>财务管理</template>
        </el-menu-item>

        <el-menu-item index="/coupons">
          <el-icon><Ticket /></el-icon>
          <template #title>优惠券</template>
        </el-menu-item>

        <el-menu-item index="/tables">
          <el-icon><Grid /></el-icon>
          <template #title>桌台管理</template>
        </el-menu-item>

        <el-divider style="border-color: #3d3248; margin: 8px 16px" />

        <el-menu-item index="/pos">
          <el-icon><Shop /></el-icon>
          <template #title>收银台</template>
        </el-menu-item>

        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>

      <!-- 收起按钮 -->
      <div class="sidebar-footer">
        <el-button
          text
          class="collapse-btn"
          @click="isCollapse = !isCollapse"
        >
          <el-icon size="18">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </el-button>
      </div>
    </aside>

    <!-- 主体区域 -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="topbar-right">
          <!-- 今日日期 -->
          <span class="topbar-date">{{ today }}</span>

          <!-- 员工信息 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="staff-info">
              <el-avatar :size="32" class="staff-avatar">
                {{ staffName?.[0] || 'A' }}
              </el-avatar>
              <span class="staff-name">{{ staffName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapse = ref(false)
const today = dayjs().format('YYYY年MM月DD日 dddd')

const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)
const staffName = computed(() => authStore.staffInfo?.name || authStore.staffInfo?.username || '管理员')

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      authStore.logout()
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    router.push('/settings')
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

// ==========================================
// 侧边栏
// ==========================================
.sidebar {
  width: 220px;
  min-width: 220px;
  background: #2d2438;
  display: flex;
  flex-direction: column;
  transition: width 0.25s, min-width 0.25s;
  overflow: hidden;

  &.is-collapse {
    width: 64px;
    min-width: 64px;
  }
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid #3d3248;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.logo-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo-name {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
}

.logo-sub {
  font-size: 11px;
  color: #8a8298;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #4a3d5c;
    border-radius: 2px;
  }
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #3d3248;
  display: flex;
  justify-content: flex-start;
}

.collapse-btn {
  color: #8a8298 !important;
  &:hover {
    color: #ffffff !important;
    background: transparent !important;
  }
}

// ==========================================
// 主体区域
// ==========================================
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 顶部栏
.topbar {
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.topbar-left {
  .el-breadcrumb {
    font-size: 14px;
  }
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.topbar-date {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.staff-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: var(--transition);

  &:hover {
    background: var(--color-primary-light);
  }
}

.staff-avatar {
  background: var(--color-primary);
  color: #ffffff;
  font-weight: 600;
}

.staff-name {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
}

// 内容区
.content {
  flex: 1;
  overflow-y: auto;
  background: var(--color-bg);
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
