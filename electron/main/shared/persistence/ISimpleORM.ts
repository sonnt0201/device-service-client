

export interface ISimpleORM<T> {
    create(data: T): Promise<T>;
    read(id: string): Promise<T | null>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    // findAll(): Promise<T[]>;
}

