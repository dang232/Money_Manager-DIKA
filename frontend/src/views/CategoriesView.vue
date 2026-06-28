<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CreateCategoryDto, Category } from '@/api/category.api'
import { Plus, X } from '@lucide/vue'

const categoryStore = useCategoryStore()

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = ref<CreateCategoryDto>({ name: '', type: 'expense', icon: '', color: '' })

onMounted(() => { categoryStore.fetchAll() })

function openCreate() {
  editingId.value = null
  form.value = { name: '', type: 'expense', icon: '', color: '' }
  showForm.value = true
}

function openEdit(cat: Category) {
  editingId.value = cat.id
  form.value = { name: cat.name, type: cat.type, icon: cat.icon || '', color: cat.color || '' }
  showForm.value = true
}

async function handleSubmit() {
  if (!form.value.name) return
  if (editingId.value) {
    await categoryStore.update(editingId.value, form.value)
  } else {
    await categoryStore.create(form.value)
  }
  showForm.value = false
}

async function handleDelete(id: string) {
  await categoryStore.remove(id)
}
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="font-display text-[28px] font-extrabold tracking-tight text-foreground">Categories</h1>
        <p class="text-sm text-muted-foreground mt-1">Organize your transactions by category</p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
        @click="openCreate"
      >
        <Plus :size="16" :stroke-width="2.5" />
        New Category
      </button>
    </div>

    <div v-if="categoryStore.loading" class="text-center py-12 text-muted-foreground">Loading...</div>

    <template v-else>
      <!-- Category Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="cat in categoryStore.categories"
          :key="cat.id"
          class="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          @click="openEdit(cat)"
        >
          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              :style="{ background: (cat.color || (cat.type === 'income' ? '#d1fae5' : '#fee2e2')) + '30' }"
            >
              {{ cat.icon || (cat.type === 'income' ? '💰' : '💸') }}
            </div>
            <div class="flex-1">
              <h3 class="font-display font-bold text-[15px] text-foreground">{{ cat.name }}</h3>
              <p class="text-xs text-muted-foreground capitalize">{{ cat.type }}</p>
            </div>
            <button
              class="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:text-destructive/80 transition-opacity px-2 py-1 rounded"
              @click.stop="handleDelete(cat.id)"
            >
              Delete
            </button>
          </div>
          <div class="flex justify-between pt-3 border-t border-border/50 text-[13px]">
            <span class="text-muted-foreground">Color</span>
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: cat.color || (cat.type === 'income' ? '#22c55e' : '#ef4444') }"
              />
              <span class="text-foreground font-medium">{{ cat.color || 'Default' }}</span>
            </div>
          </div>
        </div>
      </div>

      <p v-if="categoryStore.categories.length === 0" class="text-sm text-muted-foreground text-center py-8">
        No categories yet. Create one to start organizing.
      </p>
    </template>

    <!-- Form Dialog -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showForm = false">
      <div class="bg-card rounded-3xl border border-border p-6 w-full max-w-md shadow-xl">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-display text-xl font-bold text-foreground">
            {{ editingId ? 'Edit Category' : 'New Category' }}
          </h2>
          <button class="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" @click="showForm = false">
            <X :size="20" />
          </button>
        </div>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Name</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="Category name"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Type</label>
            <div class="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl">
              <button
                type="button"
                class="py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                :class="form.type === 'expense' ? 'bg-card text-expense shadow-sm' : 'text-muted-foreground'"
                @click="form.type = 'expense'"
              >💸 Expense</button>
              <button
                type="button"
                class="py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                :class="form.type === 'income' ? 'bg-card text-income shadow-sm' : 'text-muted-foreground'"
                @click="form.type = 'income'"
              >💰 Income</button>
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Color</label>
            <input v-model="form.color" type="color" class="w-full h-10 rounded-xl border border-border cursor-pointer" />
          </div>
          <div class="flex gap-3 pt-3">
            <button type="button" class="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors" @click="showForm = false">Cancel</button>
            <button type="submit" class="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
