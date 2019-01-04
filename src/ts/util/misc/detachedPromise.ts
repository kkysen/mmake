export interface DetachedPromise<T> {
    readonly promise: Promise<T>;
    readonly resolve: (t: T) => void;
    readonly reject: <E>(e?: E) => void;
}

export function detachedPromise<T>(): DetachedPromise<T> {
    let resolved: T;
    let wasResolved = false;
    
    let rejected: any;
    let wasRejected = false;
    
    let promiseCreated = false;
    let resolve: (t: T) => void;
    let reject: <E>(e: E) => void;
    
    const promise = new Promise<T>((_resolve, _reject) => {
        if (wasRejected) {
            _reject(rejected);
        } else if (wasResolved) {
            _resolve(resolved);
        } else {
            resolve = _resolve;
            reject = _reject;
            promiseCreated = true;
        }
    });
    
    return {
        promise,
        resolve: t => {
            if (promiseCreated) {
                resolve(t);
            } else {
                resolved = t;
                wasResolved = true;
            }
        },
        reject: e => {
            if (promiseCreated) {
                reject(e);
            } else {
                rejected = e;
                wasRejected = true;
            }
        },
    }
}