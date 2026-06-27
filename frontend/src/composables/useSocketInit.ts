import { useSocket } from './useSocket'

/**
 * Call this in App.vue or main.ts after the app mounts.
 * When auth store exists (feat/fe-auth branch), wire:
 *   watch(() => authStore.user, (user) => user ? connect(user.id) : disconnect())
 *
 * For now, connect with userId from localStorage or 'default'.
 */
export function useSocketInit() {
  const { connect, disconnect, on } = useSocket()

  function init() {
    // ponytail: will read userId from auth store once branches merge
    const userId = localStorage.getItem('mm-user-id') || 'default'
    connect(userId)
  }

  function teardown() {
    disconnect()
  }

  return { init, teardown, on }
}
