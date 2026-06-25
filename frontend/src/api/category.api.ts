import httpClient from './http-client'

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  icon?: string
  color?: string
}

export interface CreateCategoryDto {
  name: string
  type: 'income' | 'expense'
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
    return httpClient.patch<Category>(`/categories/${id}`, dto)
  },
  delete(id: string) {
    return httpClient.delete(`/categories/${id}`)
  },
}
