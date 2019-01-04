import {RefreshableAsyncCacheGetter} from "../cache/cache";
import {MaybePromise} from "../maybePromise/MaybePromise";
import {isPromise} from "../types/isType";
import {ValueOf} from "../types/ValueOf";

export type AwaitType<T> = T extends Promise<infer U> ? U : T;

export type Values<T> = {[key: string]: T};

export namespace objectFields {
    
    export const map = function <T, U>(t: T, mapper: (field: ValueOf<T>) => ValueOf<U>): U {
        return t.mapFields(mapper);
    };
    
    export type CallEach<T> = {[K in keyof T]: () => T[K]};
    
    export const callEach = function <T>(functions: CallEach<T>): T {
        return map(functions, f => f());
    };
    
    export type CallEachArgs<T, Args> = {[K in keyof T]: (args: Args) => T[K]};
    
    export const callEachArgs = function <T, Args>(functions: CallEachArgs<T, Args>, args: Args): T {
        return map(functions, f => f(args));
    };
    
    export type AwaitAll<T> = {[K in keyof T]: MaybePromise<T[K]>};
    
    export const awaitAll = function <T>(promises: AwaitAll<T>): MaybePromise<T> {
        type K = keyof T;
        type V = T[K];
        if (!Object.values(promises).some(isPromise)) {
            return promises as T;
        }
        return (async () =>
                (await Object.entries(promises)
                        .asyncMap(async ([key, promise]) => [key, await promise] as [K, V])
                ).toObject()
        )();
    };
    
    export type AwaitGetters<T> = CallEach<AwaitAll<T>>;
    
    export const awaitGetters = function <T>(asyncGetters: AwaitGetters<T>): MaybePromise<T> {
        return awaitAll(callEach(asyncGetters));
    };
    
    export type AwaitFunctions<T, Args> = CallEachArgs<AwaitAll<T>, Args>;
    
    export const awaitFunctions = function <T, Args>(
        asyncFunctions: AwaitFunctions<T, Args>,
        args: Args,
    ): MaybePromise<T> {
        return awaitAll(callEachArgs(asyncFunctions, args));
    };
    
    export type AwaitRefreshableCaches<T, Args> = {[K in keyof T]: RefreshableAsyncCacheGetter<T[K], Args>};
    
    export const awaitRefreshableCaches = function <T, Args>(
        caches: AwaitRefreshableCaches<T, Args>,
        args: Args,
    ): MaybePromise<T> {
        return awaitAll(map<AwaitRefreshableCaches<T, Args>, AwaitAll<T>>(caches, e => e.get(args)));
    };
    
}