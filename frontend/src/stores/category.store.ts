import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categoryApi, type Category, type CreateCategoryDto } from '@/api/category.api'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)

  const incomeCategories = computed(() => categories.value.filter((c) => c.type === 'income'))
  const expenseCategories = computed(() => categories.value.filter((c) => c.type === 'expense'))
  const byId = computed(() => {
    const map: Record<string, Category> = {}
    for (const c of categories.value) map[c.id] = c
    return map
  })

  async function fetchAll() {
    loading.value = true
    try {
      const res = await categoryApi.getAll()
      categories.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateCategoryDto) {
    loading.value = true
    try {
      await categoryApi.create(dto)
      await fetchAll()
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, dto: Partial<CreateCategoryDto>) {
    loading.value = true
    try {
      await categoryApi.update(id, dto)
      await fetchAll()
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    try {
      await categoryApi.delete(id)
      await fetchAll()
    } finally {
      loading.value = false
    }
  }

  return { categories, loading, incomeCategories, expenseCategories, byId, fetchAll, create, update, remove }
})
