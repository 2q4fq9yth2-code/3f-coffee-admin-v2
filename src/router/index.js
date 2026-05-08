import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/components/Layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '工作台', icon: 'Odometer' },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrdersView.vue'),
        meta: { title: '订单管理', icon: 'List' },
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/products/ProductsView.vue'),
        meta: { title: '商品管理', icon: 'Goods' },
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/members/MembersView.vue'),
        meta: { title: '会员管理', icon: 'User' },
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/inventory/InventoryView.vue'),
        meta: { title: '库存管理', icon: 'Box' },
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/finance/FinanceView.vue'),
        meta: { title: '财务管理', icon: 'Money' },
      },
      {
        path: 'coupons',
        name: 'Coupons',
        component: () => import('@/views/coupons/CouponsView.vue'),
        meta: { title: '优惠券', icon: 'Ticket' },
      },
      {
        path: 'tables',
        name: 'Tables',
        component: () => import('@/views/tables/TablesView.vue'),
        meta: { title: '桌台管理', icon: 'Grid' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: '系统设置', icon: 'Setting' },
      },
    ],
  },
  {
    path: '/pos',
    name: 'POS',
    component: () => import('@/views/pos/PosView.vue'),
    meta: { requiresAuth: true, title: '收银台' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 导航守卫：需要登录但未登录则跳转登录页
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
