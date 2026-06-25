import { ref, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { useDashboardStore } from '@/stores/dashboard.store'

export function useWebSocket() {
  const isConnected = ref(false)
  let socket: Socket | null = null
  let reconnectAttempts = 0
  const maxDelay = 30000

  function connect() {
    socket = io('/ws', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: maxDelay,
    })

    socket.on('connect', () => {
      isConnected.value = true
      reconnectAttempts = 0
      const dashboard = useDashboardStore()
      dashboard.refresh()
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    socket.on('connect_error', () => {
      reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxDelay)
      setTimeout(() => socket?.connect(), delay)
    })
  }

  function on(event: string, handler: (...args: any[]) => void) {
    socket?.on(event, handler)
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
  }

  connect()

  onUnmounted(() => {
    disconnect()
  })

  return { isConnected, on, disconnect }
}
