export interface RepositoryPort<T> {
    findById(id: string): Promise<T | null>;
    save(entity: T): Promise<T>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=repository.port.d.ts.map