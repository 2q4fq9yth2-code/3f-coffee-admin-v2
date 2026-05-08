import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const staffInfo = ref(JSON.parse(localStorage.getItem('staffInfo') || 'null'))
  const token = ref(localStorage.getItem('staffToken') || '')

  const isLoggedIn = computed(() => !!staffInfo.value)

  function login(info) {
    staffInfo.value = info
    token.value = info.token || ''
    localStorage.setItem('staffInfo', JSON.stringify(info))
    if (info.token) localStorage.setItem('staffToken', info.token)
  }

  function logout() {
    staffInfo.value = null
    token.value = ''
    localStorage.removeItem('staffInfo')
    localStorage.removeItem('staffToken')
  }

  return { staffInfo, token, isLoggedIn, login, logout }
})
