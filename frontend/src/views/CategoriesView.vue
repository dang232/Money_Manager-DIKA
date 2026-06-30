<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CreateCategoryDto, Category } from '@/api/category.api'
import { VueDraggable } from 'vue-draggable-plus'
import { useDraggableList } from '@/composables/useDraggableList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, GripVertical } from '@lucide/vue'

const categoryStore = useCategoryStore()

// ponytail: small fixed palette per type beats letting users pick pure black or unreadable mid-tones
const EXPENSE_PRESETS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1']
const INCOME_PRESETS = ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#84cc16', '#a3e635']

// DRY: Using composable for draggable list state
const { items: localCategories, onDragEnd } = useDraggableList<Category>(() => categoryStore.categories, 'categories')

const showForm = ref(false)
const editingId = ref<string | null>(null)
// ponytail: backend expects uppercase enum values; default color is type-aware so the form is valid out of the box
type FormType = 'INCOME' | 'EXPENSE'
const defaultColor = (type: FormType) => (type === 'INCOME' ? '#22c55e' : '#ef4444')
const form = ref<CreateCategoryDto>({ name: '', type: 'EXPENSE', icon: '', color: defaultColor('EXPENSE') })
const submitting = ref(false)
const formError = ref('')
const nameTouched = ref(false)
const nameInvalid = computed(() => nameTouched.value && !form.value.name.trim())

// ponytail: backend sends uppercase, customer sees Title Case
const displayType = (t: Category['type']) => (typeof t === 'string' ? t.charAt(0) + t.slice(1).toLowerCase() : t)
const isIncome = (t: Category['type']) => String(t).toLowerCase() === 'income'

onMounted(async () => {
  await categoryStore.fetchAll()
})

function openCreate() {
  editingId.value = null
  form.value = { name: '', type: 'EXPENSE', icon: '', color: defaultColor('EXPENSE') }
  formError.value = ''
  nameTouched.value = false
  showForm.value = true
}

function openEdit(cat: Category) {
  editingId.value = cat.id
  const t: FormType = String(cat.type).toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE'
  form.value = { name: cat.name, type: t, icon: cat.icon || '', color: cat.color || defaultColor(t) }
  formError.value = ''
  nameTouched.value = false
  showForm.value = true
}

function setType(type: FormType) {
  form.value.type = type
  const otherType: FormType = type === 'INCOME' ? 'EXPENSE' : 'INCOME'
  if (!form.value.color || form.value.color === defaultColor(otherType)) {
    form.value.color = defaultColor(type)
  }
}

async function handleSubmit() {
  nameTouched.value = true
  if (!form.value.name.trim()) {
    formError.value = 'Name is required'
    return
  }
  submitting.value = true
  formError.value = ''
  try {
    if (editingId.value) {
      await categoryStore.update(editingId.value, form.value)
    } else {
      await categoryStore.create(form.value)
    }
    showForm.value = false
  } catch (err: unknown) {
    formError.value = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      || 'Could not save category. Please try again.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete this category? Existing transactions will keep their data.')) return
  await categoryStore.remove(id)
}

function handleReorder() {
  onDragEnd(localCategories.value.map(c => c.id))
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
      <!-- DRY: Single draggable grid with reusable pattern -->
      <VueDraggable
        v-model="localCategories"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger"
        ghost-class="opacity-30"
        @end="handleReorder"
      >
        <div
          v-for="cat in localCategories"
          :key="cat.id"
          :data-testid="`category-card`"
          :data-category-id="cat.id"
          class="bg-card rounded-2xl border border-border p-5 card-interactive cursor-grab active:cursor-grabbing group"
        >
          <!-- Card Header -->
          <div class="flex items-center gap-3 mb-4">
            <div class="text-muted-foreground hover:text-foreground" aria-hidden="true">
              <GripVertical :size="18" />
            </div>
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :style="{ background: (cat.color || (isIncome(cat.type) ? '#d1fae5' : '#fee2e2')) + '30' }"
            >
              <ArrowUpRight v-if="isIncome(cat.type)" :size="20" class="text-income" />
              <ArrowDownRight v-else :size="20" class="text-expense" />
            </div>
            <button
              type="button"
              class="flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              :aria-label="`Edit ${cat.name}`"
              @click="openEdit(cat)"
            >
              <h3 class="font-display font-bold text-[15px] text-foreground">{{ cat.name }}</h3>
              <Badge :variant="isIncome(cat.type) ? 'success' : 'destructive'" class="mt-1">
                {{ displayType(cat.type) }}
              </Badge>
            </button>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-destructive hover:text-destructive focus-visible:opacity-100"
              :class="localCategories.length === 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
              :aria-label="`Delete ${cat.name}`"
              @click.stop="handleDelete(cat.id)"
            >
              <Trash2 :size="14" />
            </Button>
          </div>
          <div class="flex justify-between pt-3 border-t border-border/50 text-[13px]">
            <span class="text-muted-foreground">Color</span>
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: cat.color || (isIncome(cat.type) ? '#22c55e' : '#ef4444') }"
              />
              <span class="text-foreground font-medium">{{ cat.color || 'Default' }}</span>
            </div>
          </div>
        </div>
      </VueDraggable>

      <div
        v-if="localCategories.length === 0"
        class="text-center py-12 px-6 rounded-2xl border border-dashed border-border bg-card/40"
      >
        <p class="text-sm text-muted-foreground mb-4">No categories yet. Create one to start organizing transactions.</p>
        <Button @click="openCreate">
          <Plus :size="16" :stroke-width="2.5" />
          New Category
        </Button>
      </div>
    </template>

    <!-- Form Dialog -->
    <Dialog :open="showForm" @update:open="showForm = $event">
      <div class="space-y-5">
        <div>
          <DialogTitle class="font-display text-xl font-bold text-foreground">
            {{ editingId ? 'Edit Category' : 'New Category' }}
          </DialogTitle>
          <DialogDescription class="text-sm text-muted-foreground mt-1">
            Group your transactions. Color helps you spot them faster.
          </DialogDescription>
        </div>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <Label for="cat-name">Name</Label>
            <Input
              id="cat-name"
              v-model="form.name"
              placeholder="e.g. Groceries"
              :aria-invalid="nameInvalid"
              aria-describedby="cat-name-error"
              @blur="nameTouched = true"
            />
            <p v-if="nameInvalid" id="cat-name-error" class="text-xs text-destructive">
              Name is required.
            </p>
          </div>
          <div class="space-y-1.5">
            <Label>Type</Label>
            <div class="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :class="form.type === 'EXPENSE' ? 'bg-card text-expense shadow-sm' : 'text-muted-foreground'"
                @click="setType('EXPENSE')"
              >
                Expense
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :class="form.type === 'INCOME' ? 'bg-card text-income shadow-sm' : 'text-muted-foreground'"
                @click="setType('INCOME')"
              >
                Income
              </Button>
            </div>
          </div>
          <div class="space-y-1.5">
            <Label for="cat-color">Color</Label>
            <div class="flex items-center gap-3">
              <input
                id="cat-color"
                v-model="form.color"
                type="color"
                class="h-10 w-14 rounded-md border border-border cursor-pointer bg-transparent"
                aria-label="Pick a custom color"
              />
              <div class="flex flex-wrap gap-2" role="listbox" aria-label="Color presets">
                <button
                  v-for="preset in (form.type === 'INCOME' ? INCOME_PRESETS : EXPENSE_PRESETS)"
                  :key="preset"
                  type="button"
                  class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  :class="form.color === preset ? 'border-foreground' : 'border-transparent'"
                  :style="{ background: preset }"
                  :aria-label="`Use color ${preset}`"
                  :aria-selected="form.color === preset"
                  @click="form.color = preset"
                />
              </div>
            </div>
          </div>
          <p v-if="formError" class="text-sm text-destructive" role="alert">{{ formError }}</p>
          <div class="flex gap-3 pt-3">
            <Button type="button" variant="outline" class="flex-1" @click="showForm = false" :disabled="submitting">
              Cancel
            </Button>
            <Button type="submit" class="flex-1" :disabled="submitting">
              {{ submitting ? 'Saving...' : 'Save' }}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  </div>
</template>
