<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo 区域 -->
      <div class="login-logo">
        <span class="logo-emoji">☕</span>
        <h1 class="logo-title">三楼咖啡</h1>
        <p class="logo-subtitle">管理后台</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            size="large"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            native-type="submit"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 提示 -->
      <div class="login-tip">
        <p>演示账号：admin / 123456</p>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="login-bg">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    // 演示模式：使用假数据
    if (form.username === 'admin' && form.password === '123456') {
      authStore.login({
        username: 'admin',
        name: '店长',
        role: 'owner',
        token: 'demo-token-xxx',
      })
      ElMessage.success('登录成功')
      const redirect = route.query.redirect || '/dashboard'
      router.push(redirect)
      return
    }

    // 真实登录接口
    const res = await authApi.login(form)
    authStore.login(res.data)
    ElMessage.success('登录成功')
    router.push(route.query.redirect || '/dashboard')
  } catch (err) {
    ElMessage.error(err.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f3f0 0%, #e8dff0 100%);
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 400px;
  background: #ffffff;
  border-radius: 20px;
  padding: 48px 40px 36px;
  box-shadow: 0 8px 32px rgba(45, 36, 56, 0.12);
  position: relative;
  z-index: 10;
  border: 1px solid var(--color-border);
}

.login-logo {
  text-align: center;
  margin-bottom: 36px;
}

.logo-emoji {
  font-size: 56px;
  display: block;
  margin-bottom: 8px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.logo-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.logo-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.login-form {
  margin-bottom: 20px;

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-input__wrapper) {
    padding: 4px 12px;
    border-radius: 10px;
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 10px !important;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
}

.login-tip {
  text-align: center;
  p {
    font-size: 12px;
    color: var(--color-text-light);
  }
}

// 背景装饰
.login-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: var(--color-primary);
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: var(--color-accent);
  bottom: -80px;
  left: -80px;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: var(--color-primary);
  bottom: 20%;
  right: 15%;
}
</style>
