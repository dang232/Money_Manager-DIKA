import { ref, watch, type Ref } from 'vue';
import { useLayoutPersistence } from './useLayoutPersistence';

export function useDraggableList<T extends { id: string }>(initialItems: T[] = [], type: 'categories' | 'budgets') {
  const items = ref<T[]>([...initialItems]) as Ref<T[]>;

  // Layout persistence composable
  const { layout, loading: layoutLoading, onDragEnd: persistDragEnd } = useLayoutPersistence(type);

  // Watch for layout changes and apply order
  watch(() => layout.value, (newLayout) => {
    if (newLayout && newLayout[type]?.length > 0) {
      const orderedIds = newLayout[type];
      const currentItems = items.value;
      const ordered = orderedIds
        .map(id => currentItems.find(item => item.id === id))
        .filter((item): item is T => item !== undefined);

      if (ordered.length === currentItems.length) {
        items.value = ordered as T[];
      }
    }
  }, { immediate: true });

  function sync(source: T[]) {
    if (items.value.length === 0 && source.length > 0) {
      items.value = [...source] as T[];
    }
  }

  function refresh(source: T[]) {
    items.value = [...source] as T[];
  }

  function handleDragEnd(newOrder: string[]) {
    const currentItems = items.value;
    const ordered = newOrder
      .map(id => currentItems.find(item => item.id === id))
      .filter((item): item is T => item !== undefined);
    items.value = ordered as T[];
    persistDragEnd(newOrder);
  }

  return {
    items,
    loading: layoutLoading,
    sync,
    refresh,
    onDragEnd: handleDragEnd,
  };
}