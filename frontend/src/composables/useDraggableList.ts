import { ref, watch, type Ref, computed } from 'vue';
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

      // Conflict resolution
      if (!localLayout || !localMeta) {
        finalLayout = serverData.layout;
        finalMeta = {
          version: serverData.version,
          timestamp: serverTimestamp,
          synced: true,
        };
      } else if (localMeta.synced) {
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
        if (localMeta.timestamp > serverTimestamp) {
          await syncToServer(localLayout, localMeta);
          finalLayout = localLayout;
          finalMeta = localMeta;
        } else {
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
  storeItems: T[],
  type: 'categories' | 'budgets'
) {
  // Create reactive refs that sync with store
  const storeMap = computed(() => {
    const map = new Map<string, T>();
    storeItems.forEach(item => map.set(item.id, item));
    return map;
  });

  const items = ref<T[]>([...storeItems]) as Ref<T[]>;

  // Register visibility listener
  registerVisibilityListener();

  // Initialize shared layout
  initialize();

  // Watch store items and apply layout order
  watch(storeMap, (newMap) => {
    if (newMap.size === 0) return;

    const orderedIds = sharedLayout.value[type];
    let ordered: T[];

    if (orderedIds && orderedIds.length > 0) {
      // Apply saved order, filter out deleted items
      ordered = orderedIds
        .map(id => newMap.get(id))
        .filter((item): item is T => item !== undefined);

      // Append new items not in saved order
      for (const [id, item] of newMap) {
        if (!orderedIds.includes(id)) {
          ordered.push(item);
        }
      }
    } else {
      // No saved order, use store order
      ordered = Array.from(newMap.values());
    }

    items.value = ordered;
  }, { immediate: true, deep: true });

  function onDragEnd(newOrder: string[]) {
    const ordered = newOrder
      .map(id => storeMap.value.get(id))
      .filter((item): item is T => item !== undefined);

    items.value = ordered;

    const newMeta: LayoutMeta = {
      version: sharedMeta.value?.version || 0,
      timestamp: Date.now(),
      synced: false,
    };

    sharedLayout.value = {
      ...sharedLayout.value,
      [type]: newOrder,
    };
    sharedMeta.value = newMeta;
    saveToLocal(sharedLayout.value, newMeta);
    debouncedSync(sharedLayout.value, newMeta);
  }

  return {
    items,
    loading: sharedLoading,
    onDragEnd,
  };
}
