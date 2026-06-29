import { ref, watch, type Ref } from 'vue';
import { layoutApi, type LayoutData } from '@/api/layout.api';

const STORAGE_KEY = 'card_layout';
const STORAGE_META_KEY = 'card_layout_meta';

interface LayoutMeta {
  version: number;
  timestamp: number;
  synced: boolean;
}

// Singleton state shared across all instances
const sharedLayout = ref<LayoutData>({ categories: [], budgets: [] });
const sharedMeta = ref<LayoutMeta | null>(null);
const sharedLoading = ref(true);
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

function saveToLocal(data: LayoutData, m: LayoutMeta) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(STORAGE_META_KEY, JSON.stringify(m));
}

function loadFromLocal(): { layout: LayoutData | null; meta: LayoutMeta | null } {
  try {
    const layoutData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const metaData = JSON.parse(localStorage.getItem(STORAGE_META_KEY) || 'null');
    return { layout: layoutData, meta: metaData };
  } catch {
    return { layout: null, meta: null };
  }
}

async function syncToServer(data: LayoutData, m: LayoutMeta) {
  try {
    const result = await layoutApi.update({
      layout: data,
      clientVersion: m.version,
      clientTimestamp: m.timestamp,
    });
    const newMeta: LayoutMeta = {
      version: result.version,
      timestamp: m.timestamp,
      synced: true,
    };
    sharedLayout.value = result.layout;
    sharedMeta.value = newMeta;
    saveToLocal(result.layout, newMeta);
  } catch (err) {
    console.error('Layout sync failed:', err);
  }
}

function debouncedSync(data: LayoutData, m: LayoutMeta) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => syncToServer(data, m), 1500);
}

// SendBeacon: fire-and-forget for when tab is closing
function flushIfDirty() {
  if (!sharedMeta.value || sharedMeta.value.synced) return;

  const { layout, meta } = loadFromLocal();
  if (!layout || !meta || meta.synced) return;

  const blob = new Blob([JSON.stringify({
    layout,
    clientVersion: meta.version,
    clientTimestamp: meta.timestamp,
  })], { type: 'application/json' });
  navigator.sendBeacon('/api/layout', blob);

  // Mark as synced locally (best effort)
  meta.synced = true;
  saveToLocal(layout, meta);
}

async function initialize() {
  // If already initializing, wait for it
  if (initPromise) {
    await initPromise;
    return;
  }

  if (initialized) return;

  initialized = true;
  sharedLoading.value = true;

  initPromise = (async () => {
    const { layout: localLayout, meta: localMeta } = loadFromLocal();

    try {
      const serverData = await layoutApi.get();
      const serverTimestamp = new Date(serverData.updatedAt).getTime();

      let finalLayout: LayoutData;
      let finalMeta: LayoutMeta;

      // CONFLICT RESOLUTION:
      // 1. No local data → server wins
      // 2. Local is synced → server wins (if server has newer data)
      // 3. Local is unsynced AND local is newer → local wins (push to server)
      // 4. Local is unsynced AND server is newer → server wins

      if (!localLayout || !localMeta) {
        // Case 1: No local data, use server
        finalLayout = serverData.layout;
        finalMeta = {
          version: serverData.version,
          timestamp: serverTimestamp,
          synced: true,
        };
      } else if (localMeta.synced) {
        // Case 2: Local is synced, check versions
        if (serverData.version > localMeta.version) {
          finalLayout = serverData.layout;
          finalMeta = {
            version: serverData.version,
            timestamp: serverTimestamp,
            synced: true,
          };
        } else {
          finalLayout = localLayout;
          finalMeta = localMeta;
        }
      } else {
        // Case 3 & 4: Local has unsynced changes
        if (localMeta.timestamp > serverTimestamp) {
          // Case 3: Local is newer, push to server
          await syncToServer(localLayout, localMeta);
          finalLayout = localLayout;
          finalMeta = localMeta;
        } else {
          // Case 4: Server is newer, use server
          finalLayout = serverData.layout;
          finalMeta = {
            version: serverData.version,
            timestamp: serverTimestamp,
            synced: true,
          };
        }
      }

      sharedLayout.value = finalLayout;
      sharedMeta.value = finalMeta;
      saveToLocal(finalLayout, finalMeta);
    } catch (err) {
      console.error('Failed to fetch layout:', err);
      // Fall back to local if server fails
      if (localLayout) {
        sharedLayout.value = localLayout;
        sharedMeta.value = localMeta;
      }
    } finally {
      sharedLoading.value = false;
    }
  })();

  await initPromise;
}

// Register visibility change listener once
let visibilityListenerRegistered = false;
function registerVisibilityListener() {
  if (visibilityListenerRegistered) return;
  visibilityListenerRegistered = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushIfDirty();
    }
  });

  window.addEventListener('beforeunload', () => {
    flushIfDirty();
  });
}

export function useDraggableList<T extends { id: string }>(
  storeItems: T[] | Map<string, T>,
  type: 'categories' | 'budgets'
) {
  const items = ref<T[]>([]) as Ref<T[]>;
  const initialized = ref(false);

  // Register visibility listener once
  registerVisibilityListener();

  // Convert to Map for fast lookups
  const itemMap = new Map<string, T>();
  watch(() => storeItems, (newItems) => {
    if (Array.isArray(newItems)) {
      itemMap.clear();
      newItems.forEach(item => itemMap.set(item.id, item));
    }
  }, { immediate: true });

  // Initialize on first use
  initialize().then(() => {
    initialized.value = true;
  });

  // Watch shared layout and reorder items
  watch(() => sharedLayout.value, (newLayout) => {
    if (!newLayout) return;

    const orderedIds = newLayout[type];
    if (!orderedIds || orderedIds.length === 0) {
      // No order saved, use store items as-is
      if (itemMap.size > 0) {
        items.value = Array.from(itemMap.values());
      }
      return;
    }

    // Apply saved order, filter out deleted items
    const ordered = orderedIds
      .map(id => itemMap.get(id))
      .filter((item): item is T => item !== undefined);

    // Append any new items not in order yet
    for (const [id, item] of itemMap) {
      if (!orderedIds.includes(id)) {
        ordered.push(item);
      }
    }

    items.value = ordered;
  }, { immediate: true });

  function sync(source: T[]) {
    if (source.length === 0) return;

    // Update item map
    source.forEach(item => itemMap.set(item.id, item));

    // If no saved order yet, use source order
    if (sharedLayout.value[type].length === 0) {
      items.value = [...source];
    }
  }

  function refresh(source: T[]) {
    source.forEach(item => itemMap.set(item.id, item));
    items.value = [...source];
  }

  function onDragEnd(newOrder: string[]) {
    const ordered = newOrder
      .map(id => itemMap.get(id))
      .filter((item): item is T => item !== undefined);

    items.value = ordered;

    // Clean stale IDs and append any new items
    const validIds = newOrder.filter(id => itemMap.has(id));
    for (const [id] of itemMap) {
      if (type === 'categories' && !validIds.includes(id)) {
        // New category not in order - handled in watch above
      }
    }

    const newMeta: LayoutMeta = {
      version: sharedMeta.value?.version || 0,
      timestamp: Date.now(),
      synced: false,
    };

    sharedLayout.value = {
      ...sharedLayout.value,
      [type]: validIds,
    };
    sharedMeta.value = newMeta;
    saveToLocal(sharedLayout.value, newMeta);
    debouncedSync(sharedLayout.value, newMeta);
  }

  return {
    items,
    loading: sharedLoading,
    sync,
    refresh,
    onDragEnd,
  };
}
