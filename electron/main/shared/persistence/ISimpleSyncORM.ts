export interface ISimpleSyncORM<T>{
     create(data: T): T;
    read(id: string): T | null;
    update(id: string, data: Partial<T>): T | null;
    delete(id: string): Promise<boolean>;
}