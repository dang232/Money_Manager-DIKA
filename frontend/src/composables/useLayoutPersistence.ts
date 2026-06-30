import { ref, onMounted, onUnmounted } from 'vue';
import { layoutApi, type LayoutData } from '@/api/layout.api';

const STORAGE_KEY = 'card_layout';
const STORAGE_META_KEY = 'card_layout_meta';

interface LayoutMeta {
  version: number;
  timestamp: number;
  synced: boolean;
}

interface LayoutState {
  layout: LayoutData | null;
  meta: LayoutMeta | null;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function useLayoutPersistence(type: 'categories' | 'budgets') {
  const layout = ref<LayoutData | null>(null);
  const meta = ref<LayoutMeta | null>(null);
  const loading = ref(true);

  // Layer 1: localStorage
  function saveToLocal(data: LayoutData, m: LayoutMeta) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(m));
  }

  function loadFromLocal(): LayoutState {
    const layoutData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const metaData = JSON.parse(localStorage.getItem(STORAGE_META_KEY) || 'null');
    return { layout: layoutData, meta: metaData };
  }

  // Layer 2: Debounced API sync
  function debouncedSync(data: LayoutData, m: LayoutMeta) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => syncToServer(data, m), 1500);
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
      layout.value = result.layout;
      meta.value = newMeta;
      saveToLocal(result.layout, newMeta);
    } catch (err) {
      console.error('Layout sync failed:', err);
    }
  }

  // Layer 3: sendBeacon on visibility change
  function flushIfDirty() {
    const { layout: localLayout, meta: localMeta } = loadFromLocal();
    if (!localLayout || !localMeta || localMeta.synced) return;

    const blob = new Blob([JSON.stringify({
      layout: localLayout,
      clientVersion: localMeta.version,
      clientTimestamp: localMeta.timestamp,
    })], { type: 'application/json' });
    navigator.sendBeacon('/api/layout/beacon', blob);
  }

  // Initialize on mount
  async function initialize() {
    loading.value = true;

    // Load from localStorage first (instant)
    const { layout: localLayout, meta: localMeta } = loadFromLocal();
    if (localLayout) {
      layout.value = localLayout;
      meta.value = localMeta;
    }

    // Fetch from server
    try {
      const serverData = await layoutApi.get();

      if (!localLayout || !localMeta) {
        const newMeta: LayoutMeta = {
          version: serverData.version,
          timestamp: new Date(serverData.updatedAt).getTime(),
          synced: true,
        };
        layout.value = serverData.layout;
        meta.value = newMeta;
        saveToLocal(serverData.layout, newMeta);
      } else if (localMeta.synced) {
        if (serverData.version > localMeta.version) {
          const newMeta: LayoutMeta = {
            version: serverData.version,
            timestamp: new Date(serverData.updatedAt).getTime(),
            synced: true,
          };
          layout.value = serverData.layout;
          meta.value = newMeta;
          saveToLocal(serverData.layout, newMeta);
        }
      } else {
        if (localMeta.timestamp > new Date(serverData.updatedAt).getTime()) {
          await syncToServer(localLayout, localMeta);
        } else {
          const newMeta: LayoutMeta = {
            version: serverData.version,
            timestamp: new Date(serverData.updatedAt).getTime(),
            synced: true,
          };
          layout.value = serverData.layout;
          meta.value = newMeta;
          saveToLocal(serverData.layout, newMeta);
        }
      }
    } catch (err) {
      console.error('Failed to fetch layout:', err);
    } finally {
      loading.value = false;
    }
  }

  // Called when user drops a card
  function onDragEnd(newOrder: string[]) {
    if (!layout.value) {
      layout.value = { categories: [], budgets: [] };
    }

    const newLayout = {
      ...layout.value,
      [type]: newOrder,
    };

    const newMeta: LayoutMeta = {
      version: meta.value?.version || 0,
      timestamp: Date.now(),
      synced: false,
    };

    layout.value = newLayout;
    meta.value = newMeta;
    saveToLocal(newLayout, newMeta);
    debouncedSync(newLayout, newMeta);
  }

  // Register visibility change listener
  onMounted(() => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushIfDirty();
      }
    });
    window.addEventListener('beforeunload', flushIfDirty);
    initialize();
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', flushIfDirty);
    window.removeEventListener('beforeunload', flushIfDirty);
    if (syncTimeout) clearTimeout(syncTimeout);
  });

  return {
    layout,
    loading,
    onDragEnd,
    initialize,
  };
}