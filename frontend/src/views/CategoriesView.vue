<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CreateCategoryDto } from '@/api/category.api'

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

function openEdit(cat: any) {
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
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-foreground">Categories</h1>
      <button
        class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        @click="openCreate"
      >
        + Add Category
      </button>
    </div>

    <div v-if="categoryStore.loading" class="text-center py-8 text-muted-foreground">Loading...</div>

    <template v-else>
      <!-- Income categories -->
      <div>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase mb-3">Income</h2>
        <div class="rounded-xl border border-border bg-card divide-y divide-border">
          <div
            v-for="cat in categoryStore.incomeCategories"
            :key="cat.id"
            class="flex items-center justify-between p-4 group"
          >
            <div class="flex items-center gap-3 cursor-pointer" @click="openEdit(cat)">
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: cat.color || '#22c55e' }"
              />
              <span class="text-sm font-medium text-foreground">{{ cat.name }}</span>
            </div>
            <button
              class="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:text-destructive/80 transition-opacity"
              @click="handleDelete(cat.id)"
            >
              Delete
            </button>
          </div>
          <p v-if="categoryStore.incomeCategories.length === 0" class="text-sm text-muted-foreground text-center py-4">
            No income categories
          </p>
        </div>
      </div>

      <!-- Expense categories -->
      <div>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase mb-3">Expense</h2>
        <div class="rounded-xl border border-border bg-card divide-y divide-border">
          <div
            v-for="cat in categoryStore.expenseCategories"
            :key="cat.id"
            class="flex items-center justify-between p-4 group"
          >
            <div class="flex items-center gap-3 cursor-pointer" @click="openEdit(cat)">
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: cat.color || '#ef4444' }"
              />
              <span class="text-sm font-medium text-foreground">{{ cat.name }}</span>
            </div>
            <button
              class="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:text-destructive/80 transition-opacity"
              @click="handleDelete(cat.id)"
            >
              Delete
            </button>
          </div>
          <p v-if="categoryStore.expenseCategories.length === 0" class="text-sm text-muted-foreground text-center py-4">
            No expense categories
          </p>
        </div>
      </div>
    </template>

    <!-- Form Dialog -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showForm = false">
      <div class="bg-card rounded-xl border border-border p-6 w-full max-w-sm shadow-lg">
        <h2 class="text-lg font-semibold text-foreground mb-4">
          {{ editingId ? 'Edit Category' : 'New Category' }}
        </h2>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Name</label>
            <input v-model="form.name" type="text" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Type</label>
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 py-2 rounded-lg text-sm font-medium"
                :class="form.type === 'expense' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'"
                @click="form.type = 'expense'"
              >Expense</button>
              <button
                type="button"
                class="flex-1 py-2 rounded-lg text-sm font-medium"
                :class="form.type === 'income' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'"
                @click="form.type = 'income'"
              >Income</button>
            </div>
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Color</label>
            <input v-model="form.color" type="color" class="w-full h-10 rounded-lg border border-border" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 py-2 rounded-lg border border-border text-sm" @click="showForm = false">Cancel</button>
            <button type="submit" class="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
