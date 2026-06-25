// ponytail: generic repository port — base contract for all aggregate persistence
export interface RepositoryPort<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
