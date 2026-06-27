import { io, type Socket } from 'socket.io-client'
import { ref } from 'vue'

let socket: Socket | null = null
const connected = ref(false)

export function useSocket() {
  function connect(userId: string) {
    if (socket?.connected) return
    socket = io('/ws', { query: { userId }, transports: ['websocket'] })
    socket.on('connect', () => { connected.value = true })
    socket.on('disconnect', () => { connected.value = false })
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
    connected.value = false
  }

  function on(event: string, handler: (data: unknown) => void) {
    socket?.on(event, handler)
  }

  function off(event: string, handler?: (data: unknown) => void) {
    socket?.off(event, handler)
  }

  return { connected, connect, disconnect, on, off }
}
