import { useUiStore } from '@/stores/ui.store'
import { watchEffect } from 'vue'

export function useTheme() {
  const ui = useUiStore()

  // Watch system preference if no stored value
  const stored = localStorage.getItem('mm-theme')
  if (!stored) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    if (mq.matches) {
      ui.theme = 'dark'
      document.documentElement.classList.add('dark')
    }
    mq.addEventListener('change', (e) => {
      if (!localStorage.getItem('mm-theme')) {
        ui.theme = e.matches ? 'dark' : 'light'
        document.documentElement.classList.toggle('dark', e.matches)
      }
    })
  }

  watchEffect(() => {
    document.documentElement.classList.toggle('dark', ui.theme === 'dark')
  })

  return {
    theme: ui.theme,
    toggleTheme: ui.toggleTheme,
  }
}
