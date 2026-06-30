import httpClient from './http-client'

export type CategoryType = 'INCOME' | 'EXPENSE'

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon?: string
  color?: string
  createdAt?: string
}

export interface CreateCategoryDto {
  name: string
  type: CategoryType
  icon?: string
  color?: string
}

export const categoryApi = {
  getAll() {
    return httpClient.get<Category[]>('/categories')
  },
  create(dto: CreateCategoryDto) {
    return httpClient.post<Category>('/categories', dto)
  },
  update(id: string, dto: Partial<CreateCategoryDto>) {
    return httpClient.put<Category>(`/categories/${id}`, dto)
  },
  delete(id: string) {
    return httpClient.delete(`/categories/${id}`)
  },
}
