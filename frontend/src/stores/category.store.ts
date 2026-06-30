import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categoryApi, type Category, type CreateCategoryDto } from '@/api/category.api'
import { useAsync } from '@/composables/use-async'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const { loading, error, run } = useAsync()

  const incomeCategories = computed(() => categories.value.filter((c) => c.type.toLowerCase() === 'income'))
  const expenseCategories = computed(() => categories.value.filter((c) => c.type.toLowerCase() === 'expense'))
  const byId = computed(() => {
    const map: Record<string, Category> = {}
    for (const c of categories.value) map[c.id] = c
    return map
  })

  async function fetchAll() {
    await run(async () => {
      const res = await categoryApi.getAll()
      categories.value = res.data
    })
  }

  async function mutateAndRefresh<T>(op: () => Promise<T>) {
    await run(async () => {
      await op()
      await fetchAll()
    })
  }

  const create = (dto: CreateCategoryDto) => mutateAndRefresh(() => categoryApi.create(dto))
  const update = (id: string, dto: Partial<CreateCategoryDto>) => mutateAndRefresh(() => categoryApi.update(id, dto))
  const remove = (id: string) => mutateAndRefresh(() => categoryApi.delete(id))

  return { categories, loading, error, incomeCategories, expenseCategories, byId, fetchAll, create, update, remove }
})