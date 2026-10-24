import { IObserver } from "./IObserver";

/**
 * [Observer design pattern]
 */
export interface IObservable<T> {

    subcribe(...observers: IObserver<T>[]):void ;

    unsubcribe(...observers: IObserver<T>[]):void;

    notify(data: T):void;

}