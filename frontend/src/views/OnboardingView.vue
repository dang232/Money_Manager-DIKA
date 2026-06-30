<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoryStore } from '@/stores/category.store'
import { useTransactionStore } from '@/stores/transaction.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CreateTransactionDto } from '@/api/transaction.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const router = useRouter()
const categoryStore = useCategoryStore()
const txStore = useTransactionStore()
const budgetStore = useBudgetStore()

const step = ref(1)

// Step 1: Categories
const defaultCategories = [
  { name: 'Salary', type: 'INCOME' as const },
  { name: 'Freelance', type: 'INCOME' as const },
  { name: 'Food & Dining', type: 'EXPENSE' as const },
  { name: 'Transportation', type: 'EXPENSE' as const },
  { name: 'Shopping', type: 'EXPENSE' as const },
  { name: 'Bills & Utilities', type: 'EXPENSE' as const },
  { name: 'Entertainment', type: 'EXPENSE' as const },
  { name: 'Healthcare', type: 'EXPENSE' as const },
]
const selectedCategories = ref<number[]>([0, 2, 3, 4, 5])
const customCategory = ref('')
const customCategories = ref<{ name: string; type: 'INCOME' | 'EXPENSE' }[]>([])

function toggleCategory(idx: number) {
  const i = selectedCategories.value.indexOf(idx)
  if (i >= 0) selectedCategories.value.splice(i, 1)
  else selectedCategories.value.push(idx)
}

function addCustom() {
  if (!customCategory.value.trim()) return
  customCategories.value.push({ name: customCategory.value.trim(), type: 'EXPENSE' })
  customCategory.value = ''
}

function removeCustom(idx: number) {
  customCategories.value.splice(idx, 1)
}

// Step 2: Budgets
const budgets = ref<Record<string, number>>({})

// Step 3: First transaction
const txForm = ref<CreateTransactionDto>({
  amount: 0,
  type: 'EXPENSE',
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
          <Button
            v-for="(cat, idx) in defaultCategories"
            :key="idx"
            type="button"
            variant="outline"
            class="justify-start h-auto py-3 px-4"
            :class="selectedCategories.includes(idx) ? 'border-primary bg-primary/10 text-primary' : ''"
            @click="toggleCategory(idx)"
          >
            <span class="text-xs text-muted-foreground block">{{ cat.type }}</span>
            {{ cat.name }}
          </Button>
        </div>

        <!-- Custom -->
        <div class="flex gap-2">
          <Input
            v-model="customCategory"
            placeholder="Add custom category..."
            class="flex-1"
            @keyup.enter="addCustom"
          />
          <Button type="button" variant="secondary" @click="addCustom">Add</Button>
        </div>
        <div v-if="customCategories.length" class="flex flex-wrap gap-2">
          <div v-for="(cc, i) in customCategories" :key="i" class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2">
            {{ cc.name }}
            <button type="button" class="hover:text-primary/70" @click="removeCustom(i)">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <Button
          type="button"
          class="w-full"
          :disabled="loading || (selectedCategories.length === 0 && customCategories.length === 0)"
          @click="finishStep1"
        >
          {{ loading ? 'Creating...' : 'Continue' }}
        </Button>
      </div>

      <!-- Step 2: Budgets -->
      <div v-if="step === 2" class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Set monthly budgets</h1>
          <p class="text-sm text-muted-foreground mt-1">Optional: set spending limits per category</p>
        </div>

        <div class="space-y-3">
          <div
            v-for="cat in createdCategoryIds.filter(c => c.type === 'EXPENSE')"
            :key="cat.id"
            class="flex items-center gap-3"
          >
            <span class="text-sm text-foreground flex-1">{{ cat.name }}</span>
            <Input
              v-model.number="budgets[cat.id]"
              type="number"
              min="0"
              step="100000"
              placeholder="0"
              class="w-40 text-right"
            />
          </div>
        </div>

        <div class="flex gap-3">
          <Button type="button" variant="outline" class="flex-1" @click="skipStep2">Skip</Button>
          <Button type="button" class="flex-1" :disabled="loading" @click="finishStep2">
            {{ loading ? 'Saving...' : 'Continue' }}
          </Button>
        </div>
      </div>

      <!-- Step 3: First Transaction -->
      <div v-if="step === 3" class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Your first transaction</h1>
          <p class="text-sm text-muted-foreground mt-1">Record your first income or expense</p>
        </div>

        <form class="space-y-4" @submit.prevent="finishStep3">
          <!-- Type Toggle -->
          <div class="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              :class="txForm.type === 'EXPENSE' ? 'bg-card text-expense shadow-sm' : 'text-muted-foreground'"
              @click="txForm.type = 'EXPENSE'"
            >
              Expense
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              :class="txForm.type === 'INCOME' ? 'bg-card text-income shadow-sm' : 'text-muted-foreground'"
              @click="txForm.type = 'INCOME'"
            >
              Income
            </Button>
          </div>
          <Input v-model.number="txForm.amount" type="number" min="0" step="1000" placeholder="Amount" />
          <select v-model="txForm.categoryId" class="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="" disabled>Select category</option>
            <option v-for="cat in createdCategoryIds.filter(c => c.type === txForm.type)" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <Input v-model="txForm.description" type="text" placeholder="Description" />
          <Input v-model="txForm.date" type="date" />
          <div class="flex gap-3">
            <Button type="button" variant="outline" class="flex-1" @click="skipStep3">Skip</Button>
            <Button type="submit" class="flex-1" :disabled="loading">
              {{ loading ? 'Saving...' : 'Get Started' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
