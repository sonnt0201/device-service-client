

/**
 * [Observer design pattern]
 */
export interface IObserver<T> {

    /**
     * [Observer design pattern] `update` called when receive new data from Observable object. 
     * @param data 
     */
     update(data: T): void;
}