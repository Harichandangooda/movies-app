import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { useAuth } from '../contexts/Auth'
import type { Collection, WatchedItem, WatchlistItem } from '../types/api'

export function useCollection(collection: Collection) {
  const { session, authorized } = useAuth()
  const queryKey = ['session', session?.id, collection] as const
  return useQuery({
    queryKey,
    enabled: !!session,
    queryFn: async ({ signal }) =>
      (await authorized<WatchlistItem[] | WatchedItem[] | null>('/' + collection, { signal })) ?? [],
  })
}

export function useCollectionToggle(collection: Collection, id: number) {
  const { session, authorized } = useAuth()
  const query = useCollection(collection)
  const saved = query.data?.some(movie => movie.id === id) ?? false
  const client = useQueryClient()
  const queryKey = ['session', session?.id, collection] as const
  const mutationKey = [...queryKey, id]
  const busy = useIsMutating({ mutationKey, exact: true }) > 0
  const lock = useRef(false)

  const mutation = useMutation({
    mutationKey,
    mutationFn: (remove: boolean) =>
      authorized<void>('/' + collection + '/' + id, { method: remove ? 'DELETE' : 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey, exact: true }),
    onSettled: () => { lock.current = false },
  })

  function toggle() {
    if (!session || !query.isSuccess || lock.current || client.isMutating({ mutationKey, exact: true })) return
    lock.current = true
    mutation.mutate(saved)
  }

  return { query, saved, busy, toggle, error: mutation.error, success: mutation.isSuccess }
}
