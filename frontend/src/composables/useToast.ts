import { ref, computed } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  const add = (toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    const duration = toast.duration ?? 4000
    toasts.value.push({ ...toast, id })

    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }

  const remove = (id: string) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx > -1) toasts.value.splice(idx, 1)
  }

  const success = (message: string, duration?: number) => add({ type: 'success', message, duration })
  const error = (message: string, duration?: number) => add({ type: 'error', message, duration })
  const info = (message: string, duration?: number) => add({ type: 'info', message, duration })
  const warning = (message: string, duration?: number) => add({ type: 'warning', message, duration })

  return {
    toasts: computed(() => toasts.value),
    add,
    remove,
    success,
    error,
    info,
    warning,
  }
}
