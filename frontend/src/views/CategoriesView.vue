<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CreateCategoryDto, Category } from '@/api/category.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, ArrowUpRight, ArrowDownRight } from '@lucide/vue'

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
      <Button @click="openCreate">
        <Plus :size="16" :stroke-width="2.5" />
        New Category
      </Button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="categoryStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="bg-card rounded-2xl border border-border p-5">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 rounded-xl skeleton" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-24 skeleton" />
            <div class="h-3 w-16 skeleton" />
          </div>
        </div>
        <div class="h-3 w-full skeleton" />
      </div>
    </div>

    <template v-else>
      <!-- Category Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        <div
          v-for="cat in categoryStore.categories"
          :key="cat.id"
          class="bg-card rounded-2xl border border-border p-5 card-interactive cursor-pointer group"
          @click="openEdit(cat)"
        >
          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :style="{ background: (cat.color || (cat.type === 'income' ? '#d1fae5' : '#fee2e2')) + '30' }"
            >
              <ArrowUpRight v-if="cat.type === 'income'" :size="22" class="text-income" />
              <ArrowDownRight v-else :size="22" class="text-expense" />
            </div>
            <div class="flex-1">
              <h3 class="font-display font-bold text-[15px] text-foreground">{{ cat.name }}</h3>
              <Badge :variant="cat.type === 'income' ? 'success' : 'destructive'" class="mt-1">
                {{ cat.type }}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:text-destructive"
              @click.stop="handleDelete(cat.id)"
            >
              <Trash2 :size="14" />
              <span class="sr-only">Delete</span>
            </Button>
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
    <Dialog :open="showForm" @update:open="showForm = $event">
      <div class="space-y-5">
        <DialogTitle class="font-display text-xl font-bold text-foreground">
          {{ editingId ? 'Edit Category' : 'New Category' }}
        </DialogTitle>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <Label for="cat-name">Name</Label>
            <Input id="cat-name" v-model="form.name" placeholder="Category name" />
          </div>
          <div class="space-y-1.5">
            <Label>Type</Label>
            <div class="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :class="form.type === 'expense' ? 'bg-card text-expense shadow-sm' : 'text-muted-foreground'"
                @click="form.type = 'expense'"
              >
                Expense
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :class="form.type === 'income' ? 'bg-card text-income shadow-sm' : 'text-muted-foreground'"
                @click="form.type = 'income'"
              >
                Income
              </Button>
            </div>
          </div>
          <div class="space-y-1.5">
            <Label for="cat-color">Color</Label>
            <input id="cat-color" v-model="form.color" type="color" class="w-full h-10 rounded-md border border-border cursor-pointer" />
          </div>
          <div class="flex gap-3 pt-3">
            <Button type="button" variant="outline" class="flex-1" @click="showForm = false">Cancel</Button>
            <Button type="submit" class="flex-1">Save</Button>
          </div>
        </form>
      </div>
    </Dialog>
  </div>
</template>
