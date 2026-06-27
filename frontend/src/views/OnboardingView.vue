<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoryStore } from '@/stores/category.store'
import { useTransactionStore } from '@/stores/transaction.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CreateTransactionDto } from '@/api/transaction.api'

const router = useRouter()
const categoryStore = useCategoryStore()
const txStore = useTransactionStore()
const budgetStore = useBudgetStore()

const step = ref(1)

// Step 1: Categories
const defaultCategories = [
  { name: 'Salary', type: 'income' as const },
  { name: 'Freelance', type: 'income' as const },
  { name: 'Food & Dining', type: 'expense' as const },
  { name: 'Transportation', type: 'expense' as const },
  { name: 'Shopping', type: 'expense' as const },
  { name: 'Bills & Utilities', type: 'expense' as const },
  { name: 'Entertainment', type: 'expense' as const },
  { name: 'Healthcare', type: 'expense' as const },
]
const selectedCategories = ref<number[]>([0, 2, 3, 4, 5])
const customCategory = ref('')
const customCategories = ref<{ name: string; type: 'income' | 'expense' }[]>([])

function toggleCategory(idx: number) {
  const i = selectedCategories.value.indexOf(idx)
  if (i >= 0) selectedCategories.value.splice(i, 1)
  else selectedCategories.value.push(idx)
}

function addCustom() {
  if (!customCategory.value.trim()) return
  customCategories.value.push({ name: customCategory.value.trim(), type: 'expense' })
  customCategory.value = ''
}

// Step 2: Budgets
const budgets = ref<Record<string, number>>({})

// Step 3: First transaction
const txForm = ref<CreateTransactionDto>({
  amount: 0,
  type: 'expense',
  categoryId: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
})

const loading = ref(false)
const createdCategoryIds = ref<{ id: string; name: string; type: string }[]>([])

async function finishStep1() {
  loading.value = true
  const toCreate = [
    ...selectedCategories.value.map((i) => defaultCategories[i]),
    ...customCategories.value,
  ]
  for (const cat of toCreate) {
    await categoryStore.create(cat)
  }
  await categoryStore.fetchAll()
  createdCategoryIds.value = categoryStore.categories.map((c) => ({ id: c.id, name: c.name, type: c.type }))
  loading.value = false
  step.value = 2
}

async function finishStep2() {
  loading.value = true
  const now = new Date()
  for (const [categoryId, amount] of Object.entries(budgets.value)) {
    if (amount > 0) {
      await budgetStore.setBudget({
        categoryId,
        monthlyLimit: amount,
        currency: 'USD',
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      })
    }
  }
  loading.value = false
  step.value = 3
}

async function finishStep3() {
  loading.value = true
  if (txForm.value.amount > 0 && txForm.value.categoryId) {
    await txStore.create(txForm.value)
  }
  localStorage.setItem('mm-onboarded', 'true')
  loading.value = false
  router.push('/dashboard')
}

function skipStep2() {
  step.value = 3
}

function skipStep3() {
  localStorage.setItem('mm-onboarded', 'true')
  router.push('/dashboard')
}

onMounted(() => { categoryStore.fetchAll() })
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-lg">
      <!-- Progress -->
      <div class="flex gap-2 mb-8">
        <div v-for="s in 3" :key="s" class="flex-1 h-1 rounded-full" :class="s <= step ? 'bg-primary' : 'bg-muted'" />
      </div>

      <!-- Step 1: Categories -->
      <div v-if="step === 1" class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Choose your categories</h1>
          <p class="text-sm text-muted-foreground mt-1">Select the categories you want to track</p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(cat, idx) in defaultCategories"
            :key="idx"
            class="px-4 py-3 rounded-lg border text-sm text-left transition-colors"
            :class="selectedCategories.includes(idx) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:bg-accent'"
            @click="toggleCategory(idx)"
          >
            <span class="text-xs text-muted-foreground block">{{ cat.type }}</span>
            {{ cat.name }}
          </button>
        </div>

        <!-- Custom -->
        <div class="flex gap-2">
          <input
            v-model="customCategory"
            placeholder="Add custom category..."
            class="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            @keyup.enter="addCustom"
          />
          <button class="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm" @click="addCustom">Add</button>
        </div>
        <div v-if="customCategories.length" class="flex flex-wrap gap-2">
          <span v-for="(cc, i) in customCategories" :key="i" class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            {{ cc.name }}
          </span>
        </div>

        <button
          :disabled="loading || (selectedCategories.length === 0 && customCategories.length === 0)"
          class="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
          @click="finishStep1"
        >
          {{ loading ? 'Creating...' : 'Continue' }}
        </button>
      </div>

      <!-- Step 2: Budgets -->
      <div v-if="step === 2" class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Set monthly budgets</h1>
          <p class="text-sm text-muted-foreground mt-1">Optional: set spending limits per category</p>
        </div>

        <div class="space-y-3">
          <div
            v-for="cat in createdCategoryIds.filter(c => c.type === 'expense')"
            :key="cat.id"
            class="flex items-center gap-3"
          >
            <span class="text-sm text-foreground flex-1">{{ cat.name }}</span>
            <input
              v-model.number="budgets[cat.id]"
              type="number"
              min="0"
              step="100000"
              placeholder="0"
              class="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm text-right"
            />
          </div>
        </div>

        <div class="flex gap-3">
          <button class="flex-1 py-3 rounded-lg border border-border text-sm text-muted-foreground" @click="skipStep2">Skip</button>
          <button
            :disabled="loading"
            class="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
            @click="finishStep2"
          >
            {{ loading ? 'Saving...' : 'Continue' }}
          </button>
        </div>
      </div>

      <!-- Step 3: First Transaction -->
      <div v-if="step === 3" class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Your first transaction</h1>
          <p class="text-sm text-muted-foreground mt-1">Record your first income or expense</p>
        </div>

        <form class="space-y-4" @submit.prevent="finishStep3">
          <div class="flex gap-2">
            <button type="button" class="flex-1 py-2 rounded-lg text-sm font-medium" :class="txForm.type === 'expense' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'" @click="txForm.type = 'expense'">Expense</button>
            <button type="button" class="flex-1 py-2 rounded-lg text-sm font-medium" :class="txForm.type === 'income' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'" @click="txForm.type = 'income'">Income</button>
          </div>
          <input v-model.number="txForm.amount" type="number" min="0" step="1000" placeholder="Amount" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <select v-model="txForm.categoryId" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="" disabled>Select category</option>
            <option v-for="cat in createdCategoryIds.filter(c => c.type === txForm.type)" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <input v-model="txForm.description" type="text" placeholder="Description" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input v-model="txForm.date" type="date" class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <div class="flex gap-3">
            <button type="button" class="flex-1 py-3 rounded-lg border border-border text-sm text-muted-foreground" @click="skipStep3">Skip</button>
            <button type="submit" :disabled="loading" class="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50">
              {{ loading ? 'Saving...' : 'Get Started' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
