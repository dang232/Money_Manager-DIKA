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
const sharedLayout = ref<LayoutData | null>(null);
const sharedMeta = ref<LayoutMeta | null>(null);
const sharedLoading = ref(true);
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function saveToLocal(data: LayoutData, m: LayoutMeta) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(STORAGE_META_KEY, JSON.stringify(m));
}

function loadFromLocal(): { layout: LayoutData | null; meta: LayoutMeta | null } {
  const layoutData = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  const metaData = JSON.parse(localStorage.getItem(STORAGE_META_KEY) || 'null');
  return { layout: layoutData, meta: metaData };
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

async function initialize() {
  if (initialized) return;
  initialized = true;
  sharedLoading.value = true;

  const { layout: localLayout, meta: localMeta } = loadFromLocal();
  if (localLayout) {
    sharedLayout.value = localLayout;
    sharedMeta.value = localMeta;
  }

  try {
    const serverData = await layoutApi.get();

    if (!localLayout || !localMeta) {
      sharedMeta.value = {
        version: serverData.version,
        timestamp: new Date(serverData.updatedAt).getTime(),
        synced: true,
      };
      sharedLayout.value = serverData.layout;
      saveToLocal(serverData.layout, sharedMeta.value);
    } else if (localMeta.synced) {
      if (serverData.version > localMeta.version) {
        sharedMeta.value = {
          version: serverData.version,
          timestamp: new Date(serverData.updatedAt).getTime(),
          synced: true,
        };
        sharedLayout.value = serverData.layout;
        saveToLocal(serverData.layout, sharedMeta.value);
      }
    } else {
      if (localMeta.timestamp > new Date(serverData.updatedAt).getTime()) {
        await syncToServer(localLayout, localMeta);
      } else {
        sharedMeta.value = {
          version: serverData.version,
          timestamp: new Date(serverData.updatedAt).getTime(),
          synced: true,
        };
        sharedLayout.value = serverData.layout;
        saveToLocal(serverData.layout, sharedMeta.value);
      }
    }
  } catch (err) {
    console.error('Failed to fetch layout:', err);
  } finally {
    sharedLoading.value = false;
  }
}

export function useDraggableList<T extends { id: string }>(initialItems: T[] = [], type: 'categories' | 'budgets') {
  const items = ref<T[]>([...initialItems]) as Ref<T[]>;

  // Watch shared layout and reorder items when layout changes
  watch(() => sharedLayout.value, (newLayout) => {
    if (!newLayout) return;

    const orderedIds = newLayout[type];
    if (!orderedIds || orderedIds.length === 0) return;

    const currentItems = items.value;
    if (currentItems.length === 0) return;

    // Only reorder if we have all items in the order list
    const ordered = orderedIds
      .map(id => currentItems.find(item => item.id === id))
      .filter((item): item is T => item !== undefined);

    if (ordered.length === orderedIds.length) {
      items.value = ordered as T[];
    }
  }, { immediate: true });

  // Initialize shared state on first use
  initialize();

  function sync(source: T[]) {
    if (items.value.length === 0 && source.length > 0) {
      items.value = [...source] as T[];
    }
  }

  function refresh(source: T[]) {
    items.value = [...source] as T[];
  }

  function onDragEnd(newOrder: string[]) {
    const currentItems = items.value;
    const ordered = newOrder
      .map(id => currentItems.find(item => item.id === id))
      .filter((item): item is T => item !== undefined);
    items.value = ordered as T[];

    // Update shared layout
    if (!sharedLayout.value) {
      sharedLayout.value = { categories: [], budgets: [] };
    }

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
    sync,
    refresh,
    onDragEnd,
  };
}
