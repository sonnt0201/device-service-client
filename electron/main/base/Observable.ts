import { IObservable } from "./IObservable";
import { IObserver } from "./IObserver";

/**
 * [Observer design pattern] Standard
 */
export class Observable<T> implements IObservable<T> {
    private _observers: Set<IObserver<T>> = new Set();

    subcribe(...observers: IObserver<T>[]): void {
        observers.forEach(observer => this._observers.add(observer));
    }

    unsubcribe(...observers: IObserver<T>[]): void {
        observers.forEach(observer => this._observers.delete(observer));
    }

    /**
     * 
     * @param data Notify to all observer
     */
    notify(data: T): void {
        this._observers.forEach(observer => observer.update(data));
    }




}

