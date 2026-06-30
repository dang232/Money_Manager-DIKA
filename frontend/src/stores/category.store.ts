import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categoryApi, type Category, type CreateCategoryDto } from '@/api/category.api'
import { useMutateRefresh } from '@/composables/useMutateRefresh'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const { loading, error, mutate } = useMutateRefresh(fetchAll)

  const incomeCategories = computed(() => categories.value.filter((c: Category) => c.type === 'INCOME'))
  const expenseCategories = computed(() => categories.value.filter((c: Category) => c.type === 'EXPENSE'))
  const byId = computed(() => {
    const map: Record<string, Category> = {}
    for (const c of categories.value) map[c.id] = c
    return map
  })

  async function fetchAll() {
    const res = await categoryApi.getAll()
    categories.value = res.data
  }

  const create = (dto: CreateCategoryDto) => mutate(() => categoryApi.create(dto))
  const update = (id: string, dto: Partial<CreateCategoryDto>) => mutate(() => categoryApi.update(id, dto))
  const remove = (id: string) => mutate(() => categoryApi.delete(id))

  return { categories, loading, error, incomeCategories, expenseCategories, byId, fetchAll, create, update, remove }
})