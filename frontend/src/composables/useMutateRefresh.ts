import { useAsync } from './use-async'

/**
 * ponytail: extracted mutateAndRefresh pattern shared across stores
 * - Runs async operation
 * - Refreshes data on success
 * - Handles loading/error state
 */
export function useMutateRefresh<T>(fetchFn: () => Promise<void>) {
  const { loading, error, run } = useAsync()

  const mutate = (op: () => Promise<T>) =>
    run(async () => {
      await op()
      await fetchFn()
    })

  return { loading, error, mutate }
}
