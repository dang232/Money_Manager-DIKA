import { watch } from 'vue'
import { useSocket } from './useSocket'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Wire WebSocket lifecycle to auth state.
 * Call init() once in App.vue after the app mounts.
 * The socket connects when the user is authenticated (user object present)
 * and disconnects on logout.
 */
export function useSocketInit() {
  const { connect, disconnect, on } = useSocket()
  const authStore = useAuthStore()

  function init() {
    // ponytail: connect immediately if already authenticated (page refresh case)
    if (authStore.user) {
      connect(authStore.user.id)
    }

    // ponytail: watch for auth state changes — connect on login, disconnect on logout
    watch(
      () => authStore.user,
      (user) => {
        if (user) {
          connect(user.id)
        } else {
          disconnect()
        }
      },
    )
  }

  function teardown() {
    disconnect()
  }

  return { init, teardown, on }
}
