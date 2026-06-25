import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const theme = ref(localStorage.getItem('mm-theme') || 'light')
  const sidebarCollapsed = ref(false)
  const isMobile = ref(window.innerWidth < 768)

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('mm-theme', theme.value)
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setMobile(val: boolean) {
    isMobile.value = val
  }

  // Initialize theme on store creation
  document.documentElement.classList.toggle('dark', theme.value === 'dark')

  return { theme, sidebarCollapsed, isMobile, toggleTheme, toggleSidebar, setMobile }
})
